import JWT from "jsonwebtoken"; // Import JSON Web Token for handling token verification
import userModel from "../models/userModel.js"; // Import the user model to access user details from the database

// Protected route token-based authentication middleware
// This middleware checks if the request has a valid token for protected routes
export const requireSignIn = async (req, res, next) => {
  try {
    // Verify the token from the Authorization header using JWT secret
    const decode = JWT.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    // Store the decoded token (user info) in the req object for future use
    req.user = decode;

    // Proceed to the next middleware or controller
    next();
  } catch (error) {
    // console.log(error);
    res.status(401).send({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Admin access middleware
// This middleware checks if the logged-in user has admin privileges (role 1)
export const isAdmin = async (req, res, next) => {
  try {
    // Fetch the user details using the ID decoded from the token (req.user)
    const user = await userModel.findById(req.user._id);

    // Check if the user's role is admin (role === 1)
    if (user.role !== 1) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access",
      });
    } else {
      // If the user is an admin, proceed to the next middleware or controller
      next();
    }
  } catch (error) {
    // console.log(error);
    // Return an error response if something goes wrong in the middleware
    res.status(401).send({
      success: false,
      message: "Error in admin middleware",
      error,
    });
  }
};
