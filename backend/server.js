const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const analysisRoutes = require("./routes/analysisRoutes");
const reportRoutes = require("./routes/reportRoutes");

dotenv.config();

const app = express();


// ==========================================
// Middleware
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// Health Check
// ==========================================

app.get("/", (req, res) => {

  res.json({

    success: true,

    message:
      "IS-ASSIST Backend is running 🚀"

  });

});


// ==========================================
// API Routes
// ==========================================

app.use(
  "/api",
  analysisRoutes
);
app.use("/api", reportRoutes);


// ==========================================
// Error Handler
// ==========================================

app.use((err, req, res, next) => {

  console.error(
    "Server Error:",
    err
  );

  res.status(500).json({

    success: false,

    message:
      err.message ||
      "Internal server error"

  });

});


// ==========================================
// Start Server
// ==========================================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `IS-ASSIST Backend running on port ${PORT}`
  );

});