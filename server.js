import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
// Core additions for WebSockets
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import Vehicle from "./models/Vehicle.js";
import authRoutes from "./routes/authRoutes.js";
import "./reminder.js";
import { sendMail } from "./email.js";
import EmailLog from "./models/EmailLog.js";

const app = express();
// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.IO server and configure CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://vehicle-frontend-priya.s3-website.eu-north-1.amazonaws.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://vehicle-frontend-priya.s3-website.eu-north-1.amazonaws.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use("/api/auth", authRoutes);

if (!process.env.MONGO_URI) {
  console.error("❌ Missing MongoDB URI in .env file");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected to:", mongoose.connection.name))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --- Socket.IO Real-Time Tracking Logic ---
io.on("connection", (socket) => {
  console.log(`✅ A user connected: ${socket.id}`);

  // LISTENER: Client (gps-tracker.jsx) sends a location update
  socket.on("sendLocation", async (data) => {
    const { number, latitude, longitude } = data;
    console.log(`📍 Received location for ${number}: ${latitude}, ${longitude}`);

    // 1. Save the location to MongoDB
    try {
      await Vehicle.findOneAndUpdate(
        { number },
        {
          lastLocation: { latitude, longitude, timestamp: new Date() }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("Database update failed:", error);
    }

    // 2. Broadcast the location to ALL connected clients (the live-map viewers)
    io.emit("locationUpdate", {
      number,
      latitude,
      longitude,
      timestamp: new Date() // Include timestamp for map popup
    });
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// --- API Routes (Restored for initial map load) ---

// ✅ Get last known location by vehicle number (used by LiveMap component for initial view)
app.get("/api/getLocation", async (req, res) => {
  const { number } = req.query;

  const vehicle = await Vehicle.findOne({ number });
  if (!vehicle || !vehicle.lastLocation) {
    return res.json({ success: false, message: "No location found" });
  }

  res.json({ success: true, location: vehicle.lastLocation });
});

// ✅ Get all vehicles
app.get("/api/vehicles", async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  res.json(vehicles);
});

// ... (other existing routes remain the same) ...

app.get("/", (req, res) => {
  res.send("Vehicle Info API is running 🚗 (Socket.IO Ready)");
});

const PORT = process.env.PORT || 5001;
// Start the HTTP server (which hosts Express and Socket.IO)
server.listen(PORT, () => console.log(`🚗 Server running on port ${PORT}`));