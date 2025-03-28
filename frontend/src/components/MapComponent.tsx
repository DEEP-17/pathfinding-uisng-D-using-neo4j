import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from '@/components/ui/use-toast';

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
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const pathLayerRef = useRef<L.Polyline | null>(null);

  const [startCoordinates, setStartCoordinates] = useState<string>('');
  const [endCoordinates, setEndCoordinates] = useState<string>('');

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on('click', function (e) {
        if (!startMarkerRef.current) {
          startMarkerRef.current = L.marker(e.latlng).addTo(map);
          const coords = `${e.latlng.lat},${e.latlng.lng}`;
          setStartCoordinates(coords);
          toast({
            title: "Start point selected",
            description: "Click on the map to set the end point.",
          });
        } else if (!endMarkerRef.current) {
          endMarkerRef.current = L.marker(e.latlng).addTo(map);
          const coords = `${e.latlng.lat},${e.latlng.lng}`;
          setEndCoordinates(coords);
          toast({
            title: "End point selected",
            description: "Click Find Path to see the route.",
          });
        } else {
          if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
          if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);
          if (pathLayerRef.current) map.removeLayer(pathLayerRef.current);

          startMarkerRef.current = L.marker(e.latlng).addTo(map);
          const coords = `${e.latlng.lat},${e.latlng.lng}`;
          setStartCoordinates(coords);
          setEndCoordinates('');
          endMarkerRef.current = null;
          pathLayerRef.current = null;

          toast({
            title: "Reset locations",
            description: "Start point set. Click on the map to set the end point.",
          });
        }
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
    if (!startCoordinates || !endCoordinates) {
      toast({
        title: "Missing locations",
        description: "Please select both start and end points on the map.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/find-path?start=${startCoordinates}&end=${endCoordinates}`);

      if (!response.ok) {
        throw new Error(`Server Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.path || !data.path.length) {
        toast({
          title: "No path found",
          description: "Please try different locations.",
          variant: "destructive"
        });
        return;
      }

      const filteredPath = data.path.filter(node => node.name !== null && node.latitude !== null && node.longitude !== null);

      if (!filteredPath.length) {
        toast({
          title: "Invalid path data",
          description: "The path data is invalid.",
          variant: "destructive"
        });
        return;
      }

      drawPath(filteredPath);
      onPathFound(data);

    } catch (error) {
      console.error("Error fetching path:", error);
      toast({
        title: "Error finding path",
        description: "Failed to retrieve path. Please try again.",
        variant: "destructive"
      });
    }
  };

  const drawPath = (path: Location[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pathLayerRef.current) {
      map.removeLayer(pathLayerRef.current);
    }

    const latLngs = path.map(node => [node.latitude, node.longitude] as [number, number]);

    if (!latLngs.length) {
      toast({
        title: "Invalid path data",
        description: "The path data is invalid.",
        variant: "destructive"
      });
      return;
    }

    pathLayerRef.current = L.polyline(latLngs, { color: '#4CAF50', weight: 4 }).addTo(map);
    map.fitBounds(pathLayerRef.current.getBounds());
  };
  const resetMap = () => {
    if (!mapInstanceRef.current) return;

    if (startMarkerRef.current) {
      mapInstanceRef.current.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      mapInstanceRef.current.removeLayer(endMarkerRef.current);
      endMarkerRef.current = null;
    }
    if (pathLayerRef.current) {
      mapInstanceRef.current.removeLayer(pathLayerRef.current);
      pathLayerRef.current = null;
    }

    setStartCoordinates('');
    setEndCoordinates('');
    toast({ title: "Map reset", description: "Select new start and end points." });
  };

  return (
    <div className="flex flex-col gap-4">
      <div ref={mapRef} className="h-[500px] w-full rounded-lg shadow-md z-10" />
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 self-center" />
            <span className="text-sm font-medium">Start:</span>
          </div>
          <input
            type="text"
            value={startCoordinates}
            readOnly
            className="p-2 border rounded-md text-sm bg-muted"
            placeholder="Click on map to set start"
          />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 self-center" />
            <span className="text-sm font-medium">End:</span>
          </div>
          <input
            type="text"
            value={endCoordinates}
            readOnly
            className="p-2 border rounded-md text-sm bg-muted"
            placeholder="Click on map to set end"
          />
        </div>
        <button
          onClick={findPath}
          disabled={!startCoordinates || !endCoordinates}
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
