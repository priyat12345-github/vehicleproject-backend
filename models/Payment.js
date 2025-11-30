import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  name: String,
  vehicle: String,
  insuranceType: String,
  amount: Number,
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", paymentSchema);