import express from "express";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

router.post("/find", async (req, res) => {
  const { number } = req.body;
  try {
    const vehicle = await Vehicle.findOne({ number: number.toUpperCase() });
    if (vehicle) res.json(vehicle);
    else res.status(404).json({ message: "Vehicle not found!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


