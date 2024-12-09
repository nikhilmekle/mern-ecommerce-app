import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: "String",
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    photo: {
      data: Buffer, // Binary data for storing the photo
      contentType: String, // Type of image (e.g., image/jpeg)
    },
    shipping: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Products", productSchema);
