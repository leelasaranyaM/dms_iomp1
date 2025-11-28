// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const twilio = require('twilio');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const SALT_ROUNDS = 10;

// --- Twilio Client Initialization ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;
const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// --- API Endpoints ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disasterAppDB';

// USGS Endpoint filtered for India
const USGS_INDIA_API =
  'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=3.0&latitude=23&longitude=77&maxradius=25&limit=15&orderby=time';

// --- Middleware and DB Connection ---
app.use(
  cors({
    origin: 'http://localhost:3000',
  })
);
app.use(express.json());

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB successfully connected. 💾'))
  .catch(err => console.error('MongoDB connection error:', err));

// =========================================================
// 1. SCHEMAS AND MODELS
// =========================================================

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  registeredAt: { type: Date, default: Date.now },
});
const AdminUser = mongoose.model('AdminUser', adminSchema);

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  data: { type: Object },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});
const Otp = mongoose.model('Otp', otpSchema);

const volunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  skills: { type: String },
  registeredAt: { type: Date, default: Date.now },
});
const Volunteer = mongoose.model('Volunteer', volunteerSchema);

const helpRequestSchema = new mongoose.Schema({
  reporterContact: { type: String, required: true },
  disasterType: { type: String, required: true },
  description: { type: String, required: true },
  severity: {
    type: String,
    default: 'Moderate',
    enum: ['Minor', 'Moderate', 'Severe', 'Critical'],
  },
  geolocation: {
    lat: { type: Number, required: false },
    lon: { type: Number, required: false },
  },
  manualAddress: { type: String, required: false },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Confirmed', 'Dispatched', 'Resolved', 'Completed'],
  },
  timestamp: { type: Date, default: Date.now },
});
const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);

// =========================================================
// 2. TWILIO HELPER FUNCTIONS
// =========================================================

const sendSms = async (to, body) => {
  if (!twilioClient || !TWILIO_NUMBER) {
    console.warn('Twilio client or sender number is not configured. Skipping SMS.');
    return;
  }
  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_NUMBER,
      to,
    });
    console.log(`SMS Sent to ${to} successfully.`);
  } catch (error) {
    console.error(`FAILED TO SEND SMS to ${to}:`, error.message);
  }
};

const sendAlertSms = async request => {
  if (!twilioClient || !TWILIO_NUMBER) {
    console.warn('SMS ALERT: Twilio client not configured. Skipping.');
    return;
  }

  const admins = await AdminUser.find({});
  if (admins.length === 0) {
    console.warn('SMS ALERT: No admin users registered. Skipping.');
    return;
  }

  const location =
    request.manualAddress ||
    (request.geolocation
      ? `GPS: ${request.geolocation.lat.toFixed(2)}, ${request.geolocation.lon.toFixed(2)}`
      : 'Unknown');

  const smsBody = `🚨 NEW DISASTER ALERT 🚨
Type: ${request.disasterType}
Sev: ${request.severity}
Loc: ${location}
Contact: ${request.reporterContact}`;

  const smsPromises = admins.map(admin => sendSms(admin.phone, smsBody));

  try {
    await Promise.all(smsPromises);
    console.log(`SMS Alert sent to ${admins.length} admin(s) successfully.`);
  } catch (error) {
    console.error('FAILED TO SEND ONE OR MORE SMS ALERTS:', error.message);
  }
};

const sendGeoTargetedSms = async request => {
  if (!twilioClient || !TWILIO_NUMBER) {
    console.warn('SMS ALERT: Twilio client not configured. Skipping volunteer SMS.');
    return;
  }

  const rawDisasterLocation = (request.manualAddress || request.description || '').toLowerCase();

  let searchKey = '';
  const commonCities = [
    'hyderabad',
    'chennai',
    'mumbai',
    'delhi',
    'bangalore',
    'kolkata',
    'pune',
    'jaipur',
  ];

  for (const city of commonCities) {
    if (rawDisasterLocation.includes(city)) {
      searchKey = city;
      break;
    }
  }

  if (!searchKey) {
    searchKey = rawDisasterLocation.split(/[ ,]/)[0].trim();
  }

  if (!searchKey) {
    console.log('VOLUNTEER ALERT: Could not determine a valid search key.');
    return;
  }

  const matchingVolunteers = await Volunteer.find({
    location: { $regex: new RegExp(searchKey, 'i') },
  });

  if (matchingVolunteers.length === 0) {
    console.log(`VOLUNTEER ALERT: No volunteers found matching location key "${searchKey}".`);
    return;
  }

  const disasterDetails = request.manualAddress || request.description;
  const smsBody = `🚨 VOLUNTEER ALERT 🚨
URGENT: ${request.disasterType} (Sev: ${request.severity}) near ${searchKey.toUpperCase()}.
Details: ${disasterDetails.substring(0, 50)}...
Contact: ${request.reporterContact}`;

  const smsPromises = matchingVolunteers.map(volunteer =>
    sendSms(volunteer.phone, smsBody)
  );

  try {
    await Promise.all(smsPromises);
    console.log(
      `Volunteer Alert sent to ${matchingVolunteers.length} volunteer(s) successfully for ${searchKey}.`
    );
  } catch (error) {
    console.error('FAILED TO SEND VOLUNTEER SMS:', error.message);
  }
};

// =========================================================
// 3. AUTHENTICATION MIDDLEWARE
// =========================================================

const authenticateAdmin = async (req, res, next) => {
  const adminEmail =
    req.query.token || req.headers['x-admin-token'] || req.body.adminToken;

  if (adminEmail) {
    const user = await AdminUser.findOne({ email: adminEmail });
    if (user) {
      req.adminUser = user;
      return next();
    }
  }

  console.log('Authentication Failed: Token not found or invalid.');
  return res.status(401).json({ message: 'Unauthorized: Admin session required.' });
};

// =========================================================
// 4. DATA ROUTES
// =========================================================

// A1. Admin Registration: Send OTP
app.post('/api/admin/register/send-otp', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const existingAdmin = await AdminUser.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingAdmin) {
      return res
        .status(409)
        .json({ message: 'This email or phone number is already registered.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await Otp.findOneAndUpdate(
      { phone },
      { otp: otpCode, data: { email, password: hashedPassword, phone } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendSms(
      phone,
      `Your DM-Hub Admin verification code is: ${otpCode}. It expires in 5 minutes.`
    );
    res.status(200).json({ message: 'OTP sent successfully. Please check your phone.' });
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ message: 'Server error: Could not send OTP.' });
  }
});

// A2. Admin Registration: Verify OTP and Finalize
app.post('/api/admin/register/verify-otp', async (req, res) => {
  try {
    const { phone, otpCode } = req.body;
    const storedOtp = await Otp.findOne({ phone, otp: otpCode });

    if (!storedOtp) {
      return res.status(401).json({ message: 'Invalid OTP or expired.' });
    }

    const { email, password: hashedPassword } = storedOtp.data;
    const newAdmin = new AdminUser({ email, password: hashedPassword, phone });
    await newAdmin.save();
    await Otp.deleteOne({ phone });

    res.status(201).json({ message: 'Account verified and created successfully.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during final registration.' });
  }
});

// B. Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await AdminUser.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // token = user.email (simple)
    return res.status(200).json({ isAdmin: true, token: user.email });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// C. Password Reset: Send OTP
app.post('/api/admin/reset/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const adminUser = await AdminUser.findOne({ phone });
    if (!adminUser) {
      return res
        .status(404)
        .json({ message: 'Phone number not found in admin records.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { phone },
      { otp: otpCode, data: { phone, email: adminUser.email } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendSms(
      phone,
      `Your DM-Hub password reset code is: ${otpCode}. It expires in 5 minutes.`
    );
    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Password reset OTP send error:', error);
    res.status(500).json({ message: 'Server error: Could not initiate reset.' });
  }
});

// D. Password Reset: Verify OTP and Change Password
app.post('/api/admin/reset/change-password', async (req, res) => {
  try {
    const { phone, otpCode, newPassword } = req.body;
    const storedOtp = await Otp.findOne({ phone, otp: otpCode });
    if (!storedOtp) {
      return res.status(401).json({ message: 'Invalid OTP.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updatedAdmin = await AdminUser.findOneAndUpdate(
      { phone },
      { password: hashedPassword }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin user not found for update.' });
    }
    await Otp.deleteOne({ phone });

    res.status(200).json({ message: 'Password successfully updated. You can now log in.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change.' });
  }
});

// E. Volunteer Registration
app.post('/api/volunteer/register', async (req, res) => {
  try {
    const { name, email, phone, location, skills } = req.body;
    const existingVolunteer = await Volunteer.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingVolunteer) {
      return res
        .status(400)
        .json({ message: 'This email or phone number is already registered.' });
    }
    const newVolunteer = new Volunteer({ name, email, phone, location, skills });
    await newVolunteer.save();
    res.status(201).json({ message: 'Volunteer successfully registered. Thank you!' });
  } catch (error) {
    console.error('Volunteer registration error:', error);
    res.status(500).json({ message: 'Server error during volunteer registration.' });
  }
});

// F. Help Request Submission
app.post('/api/help/request', async (req, res) => {
  try {
    const {
      reporterContact,
      disasterType,
      description,
      severity,
      lat,
      lon,
      manualAddress,
    } = req.body;

    if (!manualAddress && (lat == null || lon == null)) {
      return res
        .status(400)
        .json({ message: 'Location data (GPS or manual address) is required.' });
    }

    const geolocation =
      lat != null && lon != null ? { lat: Number(lat), lon: Number(lon) } : undefined;

    const newRequest = new HelpRequest({
      reporterContact,
      disasterType,
      description,
      severity,
      manualAddress: manualAddress || undefined,
      geolocation,
      status: 'Pending',
    });
    await newRequest.save();

    sendAlertSms(newRequest);
    sendGeoTargetedSms(newRequest);

    res
      .status(201)
      .json({ message: 'Help request successfully submitted. Responders are being notified.' });
  } catch (error) {
    console.error('Help request submission error:', error);
    res.status(500).json({ message: 'Server error during help request submission.' });
  }
});

// G. Fetch Multi-Hazard Live Data
app.get('/api/disasters/india/active', async (req, res) => {
  try {
    const events = [];

    try {
      const usgsResponse = await axios.get(USGS_INDIA_API);
      const usgsEvents = usgsResponse.data.features.map(feature => ({
        id: feature.id,
        type: 'Feature',
        properties: {
          mag: feature.properties.mag,
          place: feature.properties.place,
          time: feature.properties.time,
          type: 'Earthquake',
          severity: feature.properties.mag >= 5.0 ? 'Extreme' : 'Moderate',
        },
        geometry: feature.geometry,
      }));
      events.push(...usgsEvents);
    } catch (e) {
      console.warn('USGS API Call failed.');
    }

    const mockHazardEvents = [
      {
        id: 'fl67890',
        type: 'Feature',
        properties: {
          mag: 0,
          place: 'Brahmaputra Valley, Assam',
          time: Date.now() - 7200000,
          type: 'Flood',
          severity: 'Severe',
        },
        geometry: { type: 'Point', coordinates: [91.75, 26.2] },
      },
      {
        id: 'cyc111',
        type: 'Feature',
        properties: {
          mag: 0,
          place: 'Near Bhubaneswar, Odisha Coast',
          time: Date.now() - 10800000,
          type: 'Cyclone',
          severity: 'Extreme',
        },
        geometry: { type: 'Point', coordinates: [85.82, 20.29] },
      },
    ];
    events.push(...mockHazardEvents);

    res.status(200).json(events);
  } catch (error) {
    console.error('Error in multi-hazard aggregation:', error.message);
    res.status(500).json({ message: 'Error retrieving live hazard data.' });
  }
});

// H. Fetch Live Help Requests
app.get('/api/help/alerts', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeRequests = await HelpRequest.find({
      $or: [
        { status: { $in: ['Pending', 'Dispatched'] } },
        { status: 'Completed', timestamp: { $gte: twentyFourHoursAgo } },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(20);

    res.status(200).json(activeRequests);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ message: 'Error retrieving active help requests.' });
  }
});

// I. Update Alert Status (PROTECTED)
app.put('/api/help/alerts/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;

    if (!['Completed', 'Dispatched', 'Pending'].includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const updatedRequest = await HelpRequest.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Help request not found.' });
    }

    res.status(200).json({ message: `Status updated to ${newStatus}` });
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({ message: 'Server error during status update.' });
  }
});

// =========================================================
// 5. START SERVER
// =========================================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
