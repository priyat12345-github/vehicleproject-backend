import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  number: { type: String, required: true },
  make: String,
  model: String,
  year: Number,
  owner: String,
  ownerEmail: String,
  insuranceExpiry: Date,
  pucExpiry: Date
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle; // ✅ Must be default export
