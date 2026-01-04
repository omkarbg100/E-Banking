const express = require("express");
const cors = require("cors");


const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const accountRoutes = require("./Routes/accountRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");
const qrRoutes = require("./Routes/qrRoutes");




const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/qr", qrRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("E-Banking API is running");
});

module.exports = app;
