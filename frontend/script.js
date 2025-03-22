let map = L.map('map').setView([20.5937, 78.9629], 5);  // Default view of India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

async function findPath() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    if (!start || !end) {
        alert("Enter both start and end locations.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/find-path?start=${start}&end=${end}`);
        const data = await response.json();
        drawPath(data.path);
    } catch (error) {
        console.error("Error fetching path:", error);
    }
}

function drawPath(path) {
    if (!path.length) {
        alert("No path found.");
        return;
    }

    let latlngs = path.map(nodeId => {
        return [Math.random() * 10 + 20, Math.random() * 10 + 75];  // Simulating coordinates
    });

    L.polyline(latlngs, { color: 'blue' }).addTo(map);
    map.setView(latlngs[0], 8);
}
