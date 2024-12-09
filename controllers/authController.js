import { response } from "express";
import { comparePassword, hashPassword } from "../helpers/authHelper.js"; // Importing helper functions for password hashing and comparison
import userModel from "../models/userModel.js"; // Importing the user model to interact with the MongoDB collection
import orderModel from "../models/orderModel.js";

import JWT from "jsonwebtoken"; // Importing JSON Web Token to generate tokens for authentication

// Controller for user registration
export const registerController = async (req, res) => {
  try {
    // Destructure incoming request data
    const { name, email, password, phone, address, answer } = req.body;

    // Validation: Check if all required fields are provided
    if (!name) {
      return res.status(400).send({ message: "Name is required" });
    }
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }
    if (!password) {
      return res.status(400).send({ message: "Password is required" });
    }
    if (!phone) {
      return res.status(400).send({ message: "Phone number is required" });
    }
    if (!address) {
      return res.status(400).send({ message: "Address is required" });
    }
    if (!answer) {
      return res.status(400).send({ message: "answer is required" });
    }

    // Check if a user already exists with the same email
    const existinguser = await userModel.findOne({ email });
    if (existinguser) {
      return res.status(200).send({
        success: false,
        message: "Already registered, please login",
      });
    }

    // Hash the password using the hashPassword helper function
    const hashedPassword = await hashPassword(password);

    // Create a new user with the hashed password and other details
    const user = new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    });

    // Save the new user to the database
    await user.save();

    // Respond with success message and user data
    res.status(201).send({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    // console.log("Error during registration:", error); // Log any error encountered
    res.status(500).send({
      success: false,
      message: "Error in registration",
      error: error.message,
    });
  }
};

// Controller for user login
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Ensure both email and password are provided
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "Invalid Email or password",
      });
    }

    // Find the user in the database by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered",
      });
    }

    // Compare the provided password with the stored hashed password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid Password",
      });
    }

    // Generate a JWT token with the user's ID as the payload, set to expire in 7 days
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Respond with user details and the generated token
    res.status(200).send({
      success: true,
      message: "Login Successfully",
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    // console.log(error); // Log any error encountered
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

//forgotPasswordController

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      res.status(400).send({
        message: "Email is required",
      });
    }
    if (!answer) {
      res.status(400).send({
        message: "answer is required",
      });
    }
    if (!newPassword) {
      res.status(400).send({
        message: "New Password is required",
      });
    }

    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong email or answer",
      });
    }

    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

//update profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, phone, address, password } = req.body;
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Password is required and 6 character long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );

    res.status(200).send({
      success: true,
      message: "profile updated succeesfully",
      updatedUser,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while Update Profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");

    if (orders.length === 0) {
      return res.status(404).send({
        success: true,
        message: "No orders found for this user",
        orders: [],
      });
    }

    res.send(orders);
  } catch (error) {
    console.error("Error in getOrdersController:", error); // Log full error here
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error: error.message || error, // Log the specific error message
    });
  }
};

//get All Orders

//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).send({
        success: true,
        message: "No orders found for this user",
        orders: [],
      });
    }

    res.send(orders);
  } catch (error) {
    console.error("Error in getOrdersController:", error); // Log full error here
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error: error.message || error, // Log the specific error message
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params; // Corrected: use req.params
    const { status } = req.body;

    if (!orderId || !status) {
      return res.status(400).send({
        success: false,
        message: "Order ID and status are required",
      });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Order status updated successfully",
      updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send({
      success: false,
      message: "Error while updating the order status",
      error: error.message || error,
    });
  }
};

// Test controller for protected routes (for testing authentication)
export const testController = (req, res) => {
  res.send("Protected Controller"); // Simple response to show protected route works
};
