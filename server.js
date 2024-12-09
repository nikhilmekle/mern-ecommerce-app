import express from "express"; // Importing Express.js framework for creating the server
import dotenv from "dotenv"; // Importing dotenv to use environment variables from .env file
import morgan from "morgan"; // Morgan for logging HTTP requests
import connectDB from "./config/db.js"; // Custom function to connect to the MongoDB database
import colors from "@colors/colors"; // Colors library for terminal string styling
import authRoutes from "./routes/authRoute.js"; // Importing authentication routes
import cors from "cors"; // Importing CORS for cross-origin requests
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import path from "path";
import { fileURLToPath } from "url"; // Import fileURLToPath to handle __dirname

// Configure __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment variables using dotenv
dotenv.config();

// Connect to the database
connectDB();

// Initialize an Express app
const app = express();

// Middlewares
app.use(cors()); // Enable CORS to allow cross-origin requests from the frontend
app.use(express.json()); // Middleware to parse incoming JSON requests
app.use(morgan("dev")); // Logger middleware to log all HTTP requests in development mode
app.use(express.static(path.join(__dirname, "./client/build")));

// Authentication routes
app.use("/api/v1/auth", authRoutes); // Using auth routes for any requests starting with /api/v1/auth

app.use("/api/v1/category", categoryRoutes); // Category-related routes
app.use("/api/v1/product", productRoutes); // Product-related routes

// Serve React frontend for all other routes
app.use("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

// Define the port the app will listen on, either from environment variables or default to 8080
const PORT = process.env.PORT || 8080;

// Start the server and listen on the defined port
app.listen(PORT, () => {
  // console.log(
  //   `Server is running in ${process.env.DEV_MODE} mode on port ${PORT}`.bgBlack
  //     .white // Logs the status of the server with some styling
  // );
});
