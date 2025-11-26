import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  number: { type: String, required: true },
  make: String,
  model: String,
  year: Number,
  owner: String,
  ownerEmail: String,
  insuranceExpiry: Date,
  pucExpiry: Date,

  // ⭐ ADD THIS NEW FIELD FOR GPS LOCATION
  lastLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    timestamp: { type: Date, default: null }
  }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
