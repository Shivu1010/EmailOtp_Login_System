/* server.js */
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const axios = require("axios"); // npm install axios
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",       // your MySQL password
    database: "ecommerce_auth1"
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL connected");
});

// In-memory OTP store
let otpStore = {};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "shivaamminabhavi10@gmail.com", // your email
        pass: "8431785586"       // your app password
    }
});

// Replace with your ESP32's IP
//const ESP32_IP = "192.168.1.100";

/**
 * 1. Request OTP
 */
app.post("/request-otp", async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        otpStore[email] = { otp, username, hashedPassword, role };

        await transporter.sendMail({
            from: "shivaamminabhavi10@gmail.com",
            to: email,
            subject: "Your OTP for Registration",
            text: `Your OTP for registration is: ${otp}`
        });

        res.json({ success: true, message: "OTP sent to email" });
    } catch (err) {
        console.error("Request OTP Error:", err);
        res.json({ success: false, message: "Failed to send OTP" });
    }
});

/**
 * 2. Verify OTP & Register
 */
app.post("/verify-otp", (req, res) => {
    const { email, otp, role } = req.body;
    const record = otpStore[email];
    if (record && record.otp === otp) {
        const { username, hashedPassword } = record;
        const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
        db.query(sql, [username, email, hashedPassword, role], err => {
            if (err) {
                console.error("Registration Error:", err);
                return res.json({ success: false, message: "Registration failed" });
            }
            delete otpStore[email];
            res.json({ success: true, message: "Registration successful" });
        });
    } else {
        res.json({ success: false, message: "Invalid OTP" });
    }
});

/**
 * 3. Login
 */
app.post("/login", (req, res) => {
    const { identifier, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
    db.query(sql, [identifier, identifier], async (err, results) => {
        if (err || results.length === 0) {
            return res.json({ success: false, message: "Invalid credentials" });
        }
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.json({ success: true, role: user.role });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    });
});

/**
 * 4. Get Users (Admin)
 */
app.get("/users", (req, res) => {
    db.query("SELECT email, username, role FROM users WHERE role = 'user'", (err, results) => {
        if (err) {
            console.error("Fetch Users Error:", err);
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

/**
 * 5. Delete User (Admin)
 */
app.post("/delete-user", (req, res) => {
    const { email } = req.body;
    db.query("DELETE FROM users WHERE email = ?", [email], err => {
        if (err) {
            console.error("Delete User Error:", err);
            return res.json({ success: false, message: "Error deleting user" });
        }
        res.json({ success: true, message: "User deleted successfully" });
    });
});

/**
 * 6. Update LED (Home Automation)
 * Forwards LED on/off and intensity commands to ESP32.
 */
app.post("/updateLED", async (req, res) => {
    const { led, state, intensity } = req.body;
    try {
        // Turn LED on/off
        await axios.get(`http://${ESP32_IP}/${led}/${state === 1 ? "on" : "off"}`);
         // Set intensity (0-255)
       await axios.get(`http://${ESP32_IP}/${led}/intensity?value=${intensity}`);
        res.send("OK");
   } catch (err) {
        console.error("ESP32 Communication Error:", err);
      res.status(500).send("ESP32 error");
    }
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));

