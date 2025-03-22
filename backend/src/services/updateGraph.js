import { session } from "../config/db.js";

export const updateEdgeWeight = async (start, end, factor) => {
    try {
        const query = `
            MATCH (a {name: $start})-[r:CONNECTED_TO]->(b {name: $end})
            SET r.cost = r.cost * $factor
            RETURN r.cost
        `;
        const result = await session.run(query, { start, end, factor });

        return { message: "Edge weight updated", newCost: result.records[0].get("r.cost") };
    } catch (error) {
        console.error("Graph update error:", error);
        return { error: "Failed to update edge weight" };
    }
};
