// reminder.js
import cron from "node-cron";
import dotenv from "dotenv";
import Vehicle from "./models/Vehicle.js";
import { sendMail } from "./email.js";
import EmailLog from "./models/EmailLog.js";

dotenv.config();

// 🕒 Runs every day at 9 AM (for testing use "*/1 * * * *")
cron.schedule("0 9 * * *", async () => {
  console.log("🔍 Running vehicle expiry reminder check...");

  try {
    const today = new Date();
    const upcoming = new Date();
    upcoming.setDate(today.getDate() + 3);

    // Find vehicles with expiry within 3 days
    const vehicles = await Vehicle.find({
      $or: [
        { insuranceExpiry: { $lte: upcoming } },
        { pucExpiry: { $lte: upcoming } }
      ]
    });

    console.log(`🚗 Found ${vehicles.length} vehicles expiring soon.`);
    vehicles.forEach(v =>
      console.log(`- ${v.number} (${v.ownerEmail || "no email"})`)
    );

    if (vehicles.length === 0) {
      console.log("✅ No upcoming expiries found.");
      return;
    }

    for (const v of vehicles) {
      if (!v.ownerEmail) {
        console.log(`⚠️ Skipping ${v.number} — no owner email.`);
        continue;
      }

      // 🔒 Duplicate check — skip if already sent today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const alreadySent = await EmailLog.findOne({
        vehicleNumber: v.number,
        status: "sent",
        createdAt: { $gte: startOfDay }
      });

      if (alreadySent) {
        console.log(`⏩ Skipping ${v.number} — already emailed today.`);
        continue;
      }

      // Construct email
      const subject = `Vehicle Expiry Reminder: ${v.number}`;
      let msg = `Hello ${v.owner || "User"},\n\n`;
      msg += `Your vehicle ${v.number} has expiring documents:\n`;
      if (v.insuranceExpiry)
        msg += `- Insurance expires on ${v.insuranceExpiry.toDateString()}\n`;
      if (v.pucExpiry)
        msg += `- PUC expires on ${v.pucExpiry.toDateString()}\n`;
      msg += "\nPlease renew soon to avoid penalties.\n\nVehicle Info Finder 🚗";

      try {
        console.log(`📤 Sending email to ${v.ownerEmail} for ${v.number}...`);
        const info = await sendMail(v.ownerEmail, subject, msg);
        console.log(`✅ Sent to ${v.ownerEmail} for ${v.number}`);

        // Log success
        await EmailLog.create({
          to: v.ownerEmail,
          subject,
          body: msg,
          vehicleNumber: v.number,
          status: "sent",
          info
        });

        // Wait 2 seconds before sending next email
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`❌ Failed for ${v.number} (${v.ownerEmail}):`, err.message);
        await EmailLog.create({
          to: v.ownerEmail,
          subject,
          body: msg,
          vehicleNumber: v.number,
          status: "failed",
          info: err.message
        });
        continue;
      }
    }

    console.log("✅ Reminder job completed successfully.");
  } catch (err) {
    console.error("❌ Error in reminder job:", err);
  }
});
