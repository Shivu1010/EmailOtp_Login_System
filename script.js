// script.js

document.addEventListener("DOMContentLoaded", () => {
    let currentEmail = "";
    let currentRole = "";
  
    // Clear form fields to avoid back-button retaining old input
    ["login-identifier", "login-password",
     "register-username", "register-email", "register-password",
     "otp-input"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  
    //
    // === AUTHENTICATION & NAVIGATION LOGIC ===
    //
  
    // Register with OTP
    async function registerUser() {
      const username = document.getElementById("register-username").value.trim();
      const email    = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value;
      const role     = document.getElementById("register-role").value;
      if (!username || !email || !password) {
        alert("Please fill in all fields.");
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, role })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) {
          currentEmail = email;
          currentRole  = role;
          document.getElementById("register-box").style.display = "none";
          document.getElementById("otp-box").style.display      = "block";
        }
      } catch (err) {
        console.error("Registration error:", err);
        alert("An error occurred. Please try again.");
      }
    }
  
    // Verify OTP
    async function verifyOTP() {
      const otp = document.getElementById("otp-input").value.trim();
      if (!otp) {
        alert("Please enter the OTP.");
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentEmail, otp, role: currentRole })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) {
          document.getElementById("otp-box").style.display      = "none";
          document.getElementById("register-box").style.display = "block";
          backToLogin();
        }
      } catch (err) {
        console.error("OTP error:", err);
        alert("An error occurred. Please try again.");
      }
    }
  
    // Login
    async function loginUser() {
      const identifier = document.getElementById("login-identifier").value.trim();
      const password   = document.getElementById("login-password").value;
      if (!identifier || !password) {
        alert("Please enter both identifier and password.");
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = data.role === "admin"
            ? "admin.html"
            : "ecommerce.html";
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred. Please try again.");
      }
    }
  
    // Show registration form
    function showRegister() {
      document.getElementById("login-section").style.display    = "none";
      document.getElementById("register-section").style.display = "block";
    }
  
    // Back to login form
    function backToLogin() {
      document.getElementById("register-section").style.display = "none";
      document.getElementById("login-section").style.display    = "block";
    }
  
    // Dashboard navigation
    function goToStore() {
      window.location.href = "store.html";
    }
    function goToHomeAutomation() {
      window.location.href = "home-automation.html";
    }
    function goToDashboard() {
      window.location.href = "ecommerce.html";
    }
  
    // Logout (clears history)
    function logout() {
      window.location.replace("index.html");
    }
    function logoutAdmin() {
      window.location.replace("index.html");
    }
  
    //
    // === HOME AUTOMATION LOGIC ===
    // This runs on home-automation.html
    //
    if (document.getElementById("led1-checkbox")) {
      // Setup event listeners
      ["led1", "led2"].forEach(led => {
        const cb     = document.getElementById(`${led}-checkbox`);
        const slider = document.getElementById(`${led}-slider`);
        cb.addEventListener("change", () => updateLED(led));
        slider.addEventListener("input", () => updateLED(led));
      });
    }
  
    // Send LED command to server
    async function updateLED(led) {
      const state     = document.getElementById(`${led}-checkbox`).checked ? 1 : 0;
      const intensity = parseInt(document.getElementById(`${led}-slider`).value);
      try {
        const res = await fetch("http://localhost:3000/updateLED", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ led, state, intensity })
        });
        const text = await res.text();
        console.log(`${led} response:`, text);
      } catch (err) {
        console.error(`${led} error:`, err);
        alert("Failed to send command to ESP32.");
      }
    }
  
    // Expose globally
    window.registerUser       = registerUser;
    window.verifyOTP          = verifyOTP;
    window.loginUser          = loginUser;
    window.showRegister       = showRegister;
    window.backToLogin        = backToLogin;
    window.goToStore          = goToStore;
    window.goToHomeAutomation = goToHomeAutomation;
    window.goToDashboard      = goToDashboard;
    window.logout             = logout;
    window.logoutAdmin        = logoutAdmin;
    window.updateLED          = updateLED;
  });
  