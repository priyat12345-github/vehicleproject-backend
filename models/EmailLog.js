// models/EmailLog.js
import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema({
  to: String,
  subject: String,
  body: String,
  vehicleNumber: String,
  status: { type: String, enum: ["sent","failed"], default: "sent" },
  info: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export default mongoose.model("EmailLog", emailLogSchema);
