/*import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import Vehicle from "./models/Vehicle.js";
import authRoutes from "./routes/authRoutes.js";
import "./reminder.js";
import { sendMail } from "./email.js";
import EmailLog from "./models/EmailLog.js";

const app = express();
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
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://vehicle-frontend-priya.s3-website.eu-north-1.amazonaws.com");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST");
  next();
});



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
  // ✅ Get all vehicles
app.get("/api/vehicles", async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  res.json(vehicles);
});
// ✅ Get all email logs
app.get("/api/email-logs", async (req, res) => {
  try {
    // Fetch latest 50 emails (sent + failed)
    const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json(logs);
  } catch (err) {
    console.error("❌ Error fetching email logs:", err);
    res.status(500).json({ error: "Failed to fetch email logs" });
  }
});


app.get("/test-email", async (req, res) => {
  try {
    await sendMail(
      "priyamegalamane@gmail.com",
      "Test Email from Vehicle App",
      "This is a test message from your Nodemailer setup."
    );
    res.send("✅ Test email sent successfully!");
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).send("❌ Failed to send test email");
  }
});


app.get("/", (req, res) => {
  res.send("Vehicle Info API is running 🚗");
});

// Fetch vehicle info by number
app.get("/api/vehicles/:number", async (req, res) => {
  try {
    const vehicleNumber = req.params.number.trim().toUpperCase();
    console.log("Searching for:", vehicleNumber);

    const vehicle = await Vehicle.findOne({ number: vehicleNumber });
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (err) {
    console.error("Error fetching vehicle:", err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ Add a new vehicle (POST)
app.post("/api/vehicles", async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
    console.log(`✅ Vehicle added: ${vehicle.number}`);
  } catch (err) {
    console.error("❌ Error adding vehicle:", err);
    res.status(400).json({ error: err.message });
  }
});
app.post("/api/send-reminder/:number", async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ number: req.params.number });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (!vehicle.ownerEmail)
      return res.status(400).json({ message: "No owner email found" });

    let msg = `Hello ${vehicle.owner || "User"},\n\n`;
    msg += `Your vehicle ${vehicle.number} has expiring documents:\n`;
    if (vehicle.insuranceExpiry)
      msg += `- Insurance expires on ${new Date(
        vehicle.insuranceExpiry
      ).toDateString()}\n`;
    if (vehicle.pucExpiry)
      msg += `- PUC expires on ${new Date(vehicle.pucExpiry).toDateString()}\n`;
    msg += "\nPlease renew soon.\n\nVehicle Info Finder 🚗";

    await sendMail(vehicle.ownerEmail, "Manual Vehicle Reminder", msg);

    await EmailLog.create({
      to: vehicle.ownerEmail,
      subject: "Manual Vehicle Reminder",
      vehicleNumber: vehicle.number,
      body: msg,
      status: "sent",
    });

    res.json({ success: true, message: `Reminder sent to ${vehicle.ownerEmail}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

app.post("/api/updateLocation", async (req, res) => { 
  const { number, latitude, longitude } = req.body; 
  await Vehicle.findOneAndUpdate( 
    { number }, 
    { 
      lastLocation: { 
        latitude, 
        longitude, 
        timestamp: new Date() 
      } 
    }, 
    { upsert: true } 
  ); 
  
  res.json({ success: true }); 
});
app.get("/api/getLocation", async (req, res) => {
  const { number } = req.query;

  const vehicle = await Vehicle.findOne({ number });
  if (!vehicle || !vehicle.lastLocation) {
    return res.json({ success: false, message: "No location found" });
  }

  res.json({ success: true, location: vehicle.lastLocation });
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚗 Server running on port ${PORT}`));*/


import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import fs from "fs";

// Models
import Vehicle from "./models/Vehicle.js";
import EmailLog from "./models/EmailLog.js";

// Custom
import "./reminder.js";
import { sendMail } from "./email.js";

// NEW Insurance Route
import insuranceRoutes from "./routes/insuranceRoutes.js";

const app = express();

// ------------------------------------------------------
// 1) YOU WILL CREATE uploads/ MANUALLY (NO AUTO CREATE)
// ------------------------------------------------------

// Middleware
app.use(express.json());

// CORS (Frontend hosted on localhost + S3)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://vehicle-frontend-priya.s3-website.eu-north-1.amazonaws.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Manual headers override
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "http://vehicle-frontend-priya.s3-website.eu-north-1.amazonaws.com"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// Serve uploads (for receipts)
app.use("/uploads", express.static("uploads"));

// Routes
import authRoutes from "./routes/authRoutes.js";
app.use("/api/auth", authRoutes);

// Insurance routes
app.use("/api/insurance", insuranceRoutes);

// ------------------------------------------------------
// MongoDB Connection
// ------------------------------------------------------
if (!process.env.MONGO_URI) {
  console.error("❌ Missing MongoDB URI in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected:", mongoose.connection.name))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ------------------------------------------------------
// Base Route
// ------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Vehicle Info API is running 🚗");
});

// ------------------------------------------------------
// Vehicle APIs
// ------------------------------------------------------

// Get all vehicles
app.get("/api/vehicles", async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  res.json(vehicles);
});

// Get vehicle by number
app.get("/api/vehicles/:number", async (req, res) => {
  try {
    const vehicleNumber = req.params.number.trim().toUpperCase();

    const vehicle = await Vehicle.findOne({ number: vehicleNumber });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (err) {
    console.error("Error fetching vehicle:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add vehicle
app.post("/api/vehicles", async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
    console.log(`✅ Vehicle added: ${vehicle.number}`);
  } catch (err) {
    console.error("❌ Error adding vehicle:", err);
    res.status(400).json({ error: err.message });
  }
});

// ------------------------------------------------------
// Email Test
// ------------------------------------------------------
app.get("/test-email", async (req, res) => {
  try {
    await sendMail(
      "priyamegalamane@gmail.com",
      "Test Email from Vehicle App",
      "This is a test message from your Nodemailer setup."
    );

    res.send("✅ Test email sent successfully!");
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).send("❌ Failed to send test email");
  }
});

// ------------------------------------------------------
// Email Logs
// ------------------------------------------------------
app.get("/api/email-logs", async (req, res) => {
  try {
    const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json(logs);
  } catch (err) {
    console.error("❌ Error fetching email logs:", err);
    res.status(500).json({ error: "Failed to fetch email logs" });
  }
});

// ------------------------------------------------------
// Manual Email Reminder
// ------------------------------------------------------
app.post("/api/send-reminder/:number", async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ number: req.params.number });

    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (!vehicle.ownerEmail)
      return res.status(400).json({ message: "Owner email missing" });

    let msg = `Hello ${vehicle.owner || "User"},\n\n`;
    msg += `Your vehicle ${vehicle.number} has expiring documents:\n`;

    if (vehicle.insuranceExpiry)
      msg += `- Insurance expires on ${new Date(
        vehicle.insuranceExpiry
      ).toDateString()}\n`;

    if (vehicle.pucExpiry)
      msg += `- PUC expires on ${new Date(vehicle.pucExpiry).toDateString()}\n`;

    msg += "\nPlease renew soon.\n\nVehicle Info Finder 🚗";

    await sendMail(vehicle.ownerEmail, "Manual Vehicle Reminder", msg);

    await EmailLog.create({
      to: vehicle.ownerEmail,
      subject: "Manual Vehicle Reminder",
      vehicleNumber: vehicle.number,
      body: msg,
      status: "sent",
    });

    res.json({ success: true, message: "Reminder email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

// ------------------------------------------------------
// GPS Live Location Tracking
// ------------------------------------------------------
app.post("/api/updateLocation", async (req, res) => {
  const { number, latitude, longitude } = req.body;

  await Vehicle.findOneAndUpdate(
    { number },
    {
      lastLocation: {
        latitude,
        longitude,
        timestamp: new Date(),
      },
    },
    { upsert: true }
  );

  res.json({ success: true });
});

app.get("/api/getLocation", async (req, res) => {
  const { number } = req.query;

  const vehicle = await Vehicle.findOne({ number });

  if (!vehicle || !vehicle.lastLocation) {
    return res.json({ success: false, message: "No location found" });
  }

  res.json({ success: true, location: vehicle.lastLocation });
});

// ------------------------------------------------------
// Start Server
// ------------------------------------------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚗 Server running on port ${PORT}`));
