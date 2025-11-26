// my-dms-client/src/components/MapComponent.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'; 
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon (essential for react-leaflet)
let DefaultIcon = L.icon({ iconUrl: icon, iconRetinaUrl: iconRetina, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- Multi-Hazard Icon Logic ---
const getCustomIcon = (event) => {
    const type = (event.properties.type || 'earthquake').toLowerCase();
    const magnitude = event.properties.mag || 0; 
    let color = 'white';
    let size = 15;
    let symbol = '⚠️';

    if (type.includes('flood') || type.includes('water')) {
        color = '#2196f3'; 
        symbol = '🌊';
        size = 20;
    } else if (type.includes('fire') || type.includes('wildfire') || type.includes('industrial fire')) {
        color = '#dc3545'; 
        symbol = '🔥';
        size = 25;
    } else if (type.includes('cyclone') || type.includes('storm')) {
        color = '#9c27b0'; 
        symbol = '🌀';
        size = 28;
    } else if (type.includes('earthquake')) {
        symbol = '🌍';
        if (magnitude >= 6.0) { color = '#dc3545'; size = 25; }
        else if (magnitude >= 4.0) { color = '#ffc107'; size = 20; }
        else { color = '#28a745'; size = 15; } // Green for minor
    } else if (type.includes('landslide')) {
        color = '#6c757d'; // Grey
        symbol = '⛰️';
        size = 22;
    } else {
        color = '#607d8b'; 
        symbol = '🚨';
    }

    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: ${size / 2}px;" title="${type}">${symbol}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};


function MapComponent({ events }) {
  // Center map on India (Delhi coordinates)
  const defaultCenter = [28.6139, 77.2090]; 
  const defaultZoom = 5; 

  return (
    <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />

      {events.map((event, index) => {
        const coords = event.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        
        const position = [coords[1], coords[0]]; 
        const type = event.properties.type || 'Earthquake';
        const place = event.properties.place || 'Unknown Location';
        const time = new Date(event.properties.time).toLocaleString();

        return (
          <Marker 
            key={event.id || index} 
            position={position}
            icon={getCustomIcon(event)}
          >
            <Popup>
              <strong>{type.toUpperCase()}</strong><br />
              Location: {place}<br />
              Time: {time}<br />
              Severity: {event.properties.severity || event.properties.mag}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MapComponent;