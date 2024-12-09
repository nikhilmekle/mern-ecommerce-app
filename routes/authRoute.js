import express from "express";
import {
  registerController,
  loginController,
  testController,
  forgotPasswordController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// REGISTER route
router.post("/register", registerController);

// LOGIN route
router.post("/login", loginController);

// Forgot Password route
router.post("/forgot-password", forgotPasswordController);

// TEST route (requires user to be signed in and be an admin)
router.get("/test", requireSignIn, isAdmin, testController);

// Protected user route
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

// Protected admin route
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

// Update profile
router.put("/profile", requireSignIn, updateProfileController);

// Get orders (protected route for users)
router.get("/orders", requireSignIn, getOrdersController);

// get all orders
router.get("/all-orders", requireSignIn, isAdmin, getAllOrdersController);

//update status
router.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  orderStatusController
);

export default router;
