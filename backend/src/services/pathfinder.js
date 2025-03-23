import { session } from "../config/db.js";

async function findNearestCity(lat, lon) {
    const query = `
        MATCH (c:City)
        WITH c, 
            point.distance(
                point({latitude: toFloat(c.lat1), longitude: toFloat(c.lon1)}), 
                point({latitude: toFloat($lat), longitude: toFloat($lon)})
            ) AS distance
        RETURN c.from_city AS name, distance
        ORDER BY distance ASC
        LIMIT 1
    `;

    try {
        const result = await session.run(query, { lat: parseFloat(lat), lon: parseFloat(lon) });

        if (result.records.length > 0) {
            const city = result.records[0].get("name");
            console.log("Nearest City:", city);
            return city;
        } else {
            console.log("No city found.");
            return null;
        }
    } catch (error) {
        console.error("Error executing query:", error);
        return null;
    }
}


export const findShortestPath = async (start, end) => {
    try {
        const [startLat, startLon] = start.split(",");
        const [endLat, endLon] = end.split(",");

        // Convert lat/lon to nearest city names using `city_ascii`
        const startCity = await findNearestCity(startLat, startLon);
        const endCity = await findNearestCity(endLat, endLon);

        if (!startCity || !endCity) {
            return { message: "No cities found near the given coordinates." };
        }

        console.log(`Start City: ${startCity}, End City: ${endCity}`);

        // A* Algorithm Query
        const pathQuery1 = `
            MATCH (start:City {from_city: $startCity})
            MATCH (goal:City {to_city: $endCity})
            MATCH (n:City)
            SET n.latitude = COALESCE(n.lat1, n.lat2),
                n.longitude = COALESCE(n.lon1, n.log2)
            WITH start, goal

            CALL apoc.algo.aStar(
                start,
                goal,
                'Connects',
                'distance',
                'latitude',
                'longitude'
            )
            YIELD path, weight

            RETURN
                [node IN nodes(path) | {
                    name: COALESCE(node.from_city, node.to_city),
                    latitude: node.latitude,
                    longitude: node.longitude
                }] AS path,
                weight AS totalCost;
        `;

        const pathQuery2 = `
            MATCH (start:City {from_city: $startCity})
            MATCH (goal:City {to_city: $endCity})
            CALL apoc.algo.dijkstra(start, goal, 'Connects', 'distance')
            YIELD path, weight
            RETURN
                [node IN nodes(path) | {
                    name: COALESCE(node.from_city, node.to_city),
                    latitude: COALESCE(node.lat1, node.lat2),
                    longitude: COALESCE(node.lon1, node.log2)
                }] AS path, weight AS totalCost;
        `

        const pathResult = await session.run(pathQuery1, { startCity, endCity });
        console.log(pathResult);
        if (pathResult.records[0].length === 0) {
            return { message: "No path found.", path: [] };
        }

        const path = pathResult.records[0]._fields[0];  // Extracts path array
        const totalCost = pathResult.records[0]._fields[1]; // Extracts total cost
        console.log(path);
        console.log(totalCost);
        return { path, totalCost };
    } catch (error) {
        console.error("Error finding path:", error);
        return { message: "Error occurred while finding the path.", };
    }
};
