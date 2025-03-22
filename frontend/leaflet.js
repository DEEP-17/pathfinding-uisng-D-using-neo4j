let map = L.map('map').setView([20.5937, 78.9629], 5); // Default to India

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Markers for start and end locations
let startMarker = null;
let endMarker = null;
let pathLayer = null;

// Draw path on map
function drawPathOnMap(path) {
    if (pathLayer) {
        map.removeLayer(pathLayer);
    }

    let latLngs = path.map(node => [node.latitude, node.longitude]); // Ensure backend provides lat/lon

    pathLayer = L.polyline(latLngs, { color: 'blue', weight: 4 }).addTo(map);

    map.fitBounds(pathLayer.getBounds());
}

// Place marker on click
map.on('click', function (e) {
    if (!startMarker) {
        startMarker = L.marker(e.latlng).addTo(map);
        document.getElementById("start").value = `${e.latlng.lat},${e.latlng.lng}`;
    } else if (!endMarker) {
        endMarker = L.marker(e.latlng).addTo(map);
        document.getElementById("end").value = `${e.latlng.lat},${e.latlng.lng}`;
    }
});
