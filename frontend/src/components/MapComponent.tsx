import { toast } from '@/components/ui/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';

type Location = {
  name: string;
  latitude: number;
  longitude: number;
};

type PathData = {
  path: Location[];
  totalCost: number;
};

interface MapComponentProps {
  onPathFound: (pathData: PathData) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onPathFound }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [waypoints, setWaypoints] = useState<Location[]>([]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on('click', function (e) {
        const newWaypoint: Location = {
          name: `Waypoint`,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        };

        const newMarker = L.marker(e.latlng).addTo(map);
        markersRef.current.push(newMarker);

        setWaypoints((prev) => [...prev, newWaypoint]);

        toast({
          title: `${newWaypoint.name} selected`,
          description: `Latitude: ${newWaypoint.latitude}, Longitude: ${newWaypoint.longitude}`,
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  const findPath = async () => {
    if (waypoints.length < 2) {
      toast({
        title: "Insufficient points",
        description: "Please select at least two points on the map.",
        variant: "destructive",
      });
      return;
    }

    let fullPath = [];
    let totalDistance = 0;

    try {

      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];

        const startCoordinates = `${start.latitude},${start.longitude}`;
        const endCoordinates = `${end.latitude},${end.longitude}`;

        const response = await fetch(
          `http://localhost:5000/api/find-path?start=${startCoordinates}&end=${endCoordinates}`
        );

        if (!response.ok) {
          throw new Error(`Server Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.path || !data.path.length) {
          toast({
            title: `No path found between points ${i + 1} and ${i + 2}`,
            description: "Please try different locations.",
            variant: "destructive",
          });
          continue;
        }

        const filteredPath = data.path.filter(
          (node) => node.name !== null && node.latitude !== null && node.longitude !== null
        );

        if (!filteredPath.length) {
          toast({
            title: "Invalid path data",
            description: "The path data is invalid.",
            variant: "destructive",
          });
          return;
        }

        if (i === 0) {
          fullPath = filteredPath;
        } else {
          fullPath = [...fullPath, ...filteredPath.slice(1)];
        }

        totalDistance += data.totalCost;
      }

      drawPath(fullPath);

      onPathFound({ path: fullPath, totalCost: totalDistance });

    } catch (error) {
      console.error("Error fetching path:", error);
      toast({
        title: "Error finding path",
        description: "Failed to retrieve path. Please try again.",
        variant: "destructive",
      });
    }
  };

  const drawPath = (path: Location[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLngs = path.map(node => [node.latitude, node.longitude] as [number, number]);

    if (!latLngs.length) {
      toast({
        title: "Invalid path data",
        description: "The path data is invalid.",
        variant: "destructive"
      });
      return;
    }

    L.polyline(latLngs, { color: '#4CAF50', weight: 4 }).addTo(map);
    map.fitBounds(latLngs);
  };

  const resetMap = () => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => mapInstanceRef.current?.removeLayer(marker));
    markersRef.current = [];

    setWaypoints([]);
    toast({ title: "Map reset", description: "Select new waypoints." });
  };

  return (
    <div className="flex flex-col gap-4">
      <div ref={mapRef} className="h-[500px] w-full rounded-lg shadow-md z-10" />
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <span className="text-sm font-medium">Waypoints:</span>
          <ul className="list-disc pl-4">
            {waypoints.map((waypoint, index) => (
              <li key={index}>
                {waypoint.name} - Lat: {waypoint.latitude}, Long: {waypoint.longitude}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={findPath}
          disabled={waypoints.length < 2}
          className="bg-eco px-4 py-2 text-white rounded-md hover:bg-eco-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px] self-end"
        >
          Find Path
        </button>
        <button onClick={resetMap} className="bg-red-500 px-4 py-2 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px] self-end">
          Reset
        </button>
      </div>
    </div>
  );
};

export default MapComponent;
