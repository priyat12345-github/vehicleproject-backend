import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log("🟢 Register request:", { email });

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    console.log("✅ User registered successfully:", email);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("🔥 Error registering user:", error);
    res.status(500).json({ message: "Error registering user", error });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Log in a user and return JWT token
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("🟢 Login attempt:", { email });

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Invalid password for:", email);
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("✅ Login successful for:", email);
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("🔥 Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
});

export default router;
