import express from "express";
import Payment from "../models/Payment.js";  // create this model
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const router = express.Router();


// ----------------------
// 1️⃣ MAKE PAYMENT ENTRY
// ----------------------
router.post("/pay", async (req, res) => {
  try {
    const { name, vehicle, insuranceType, amount } = req.body;

    // Save payment in MongoDB
    const payment = new Payment({
      name,
      vehicle,
      insuranceType,
      amount,
      date: new Date(),
    });

    await payment.save();

    res.json({
      success: true,
      data: payment, // contains _id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ----------------------
// 2️⃣ GENERATE PDF RECEIPT
// ----------------------
router.get("/receipt/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const fileName = `receipt-${payment._id}.pdf`;
    const filePath = path.join("uploads", fileName);

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // PDF Content
    doc.fontSize(22).text("Vehicle Insurance Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Name: ${payment.name}`);
    doc.text(`Vehicle Number: ${payment.vehicle}`);
    doc.text(`Insurance Type: ${payment.insuranceType}`);
    doc.text(`Amount Paid: ₹${payment.amount}`);
    doc.text(`Payment Date: ${payment.date}`);

    doc.end();

    stream.on("finish", () => {
      res.download(filePath);
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;