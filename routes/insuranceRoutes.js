import express from "express";
import Payment from "../models/Payment.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const router = express.Router();

// ----------------------
// 1️⃣ CREATE PAYMENT + PDF
// ----------------------
router.post("/pay", async (req, res) => {
  try {
    const { name, vehicle, insuranceType, amount } = req.body;

    // Save to DB
    const payment = await Payment.create({
      name,
      vehicle,
      insuranceType,
      amount,
      date: new Date(),
    });

    // PDF file path
    const fileName = `receipt-${payment._id}.pdf`;
    const filePath = path.resolve("uploads", fileName);

    // Create PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(22).text("Vehicle Insurance Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Name: ${payment.name}`);
    doc.text(`Vehicle Number: ${payment.vehicle}`);
    doc.text(`Insurance Type: ${payment.insuranceType}`);
    doc.text(`Amount Paid: ₹${payment.amount}`);
    doc.text(`Payment Date: ${payment.date}`);

    doc.end();

    stream.on("finish", () => {
      res.json({
        success: true,
        data: payment,
        receiptUrl: `/uploads/${fileName}`,
      });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// 2️⃣ DOWNLOAD PDF RECEIPT
// ----------------------
router.get("/receipt/:id", async (req, res) => {
  const fileName = `receipt-${req.params.id}.pdf`;
  const filePath = path.resolve("uploads", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Receipt not found");
  }

  res.download(filePath);
});

export default router;
