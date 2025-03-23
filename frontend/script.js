// Initialize the map
var map = L.map('map').setView([20.5937, 78.9629], 5); // Default to India

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Variables for markers and path
let startMarker = null;
let endMarker = null;
let pathLayer = null;

// Function to fetch and draw the path
async function findPath() {
    const start = document.getElementById("start").value.trim();
    const end = document.getElementById("end").value.trim();

    if (!isValidCoordinates(start) || !isValidCoordinates(end)) {
        alert("Please enter valid start and end locations (latitude,longitude). ");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/find-path?start=${start}&end=${end}`);

        if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.path || !data.path.length) {
            alert("No path found.");
            return;
        }
        const filteredPath = data.path.filter(node => node.name !== null && node.latitude !== null && node.longitude !== null);

        if (!filteredPath.length) {
            alert("No valid locations found in the path.");
            return;
        }

        drawPath(filteredPath);

    } catch (error) {
        console.error("Error fetching path:", error);
        alert("Failed to retrieve path. Please try again.");
    }
}

// Function to draw path on map
function drawPath(path) {
    if (pathLayer) {
        map.removeLayer(pathLayer);
    }

    let latLngs = path.map(node => [node.latitude, node.longitude]);

    if (!latLngs.length) {
        alert("Invalid path data received.");
        return;
    }

    pathLayer = L.polyline(latLngs, { color: 'blue', weight: 4 }).addTo(map);
    map.fitBounds(pathLayer.getBounds());
}

// Function to validate coordinates in "latitude,longitude" format
function isValidCoordinates(input) {
    const regex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    return regex.test(input);
}

// Place markers on map click
map.on('click', function (e) {
    if (!startMarker) {
        startMarker = L.marker(e.latlng).addTo(map);
        document.getElementById("start").value = `${e.latlng.lat},${e.latlng.lng}`;
    } else if (!endMarker) {
        endMarker = L.marker(e.latlng).addTo(map);
        document.getElementById("end").value = `${e.latlng.lat},${e.latlng.lng}`;
    } else {
        // Reset markers if both exist
        map.removeLayer(startMarker);
        map.removeLayer(endMarker);
        startMarker = L.marker(e.latlng).addTo(map);
        document.getElementById("start").value = `${e.latlng.lat},${e.latlng.lng}`;
        endMarker = null; // Reset end marker
        document.getElementById("end").value = "";
    }
});
