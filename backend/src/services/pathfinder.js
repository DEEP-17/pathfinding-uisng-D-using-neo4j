import { session } from "../config/db.js";

export const findShortestPath = async (start, end) => {
    try {
        const query = `
            MATCH (a {name: $start}), (b {name: $end})
            CALL algo.shortestPath.stream(a, b, 'cost') 
            YIELD nodeId
            RETURN nodeId
        `;
        const result = await session.run(query, { start, end });

        const path = result.records.map(record => record.get("nodeId"));
        return path;
    } catch (error) {
        console.error("Pathfinding error:", error);
        return [];
    }
};
