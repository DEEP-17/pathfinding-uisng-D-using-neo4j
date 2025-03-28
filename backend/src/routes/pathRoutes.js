import express from "express";
import { findShortestPath } from "../services/pathfinder.js";
import { updateEdgeWeight } from "../services/updateGraph.js";

const router = express.Router();

router.get("/find-path", async (req, res) => {
    const { start, end } = req.query;
    const { path, totalCost } = await findShortestPath(start, end);
    res.json({ path, totalCost });
});

router.post("/update-road", async (req, res) => {
    const { start, end, factor } = req.body;
    const result = await updateEdgeWeight(start, end, factor);
    res.json(result);
});

export default router;
