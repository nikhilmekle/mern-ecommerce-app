import productModel from "../models/productModel.js";
import fs from "fs";
import slugify from "slugify";
import categoryModel from "../models/categoryModel.js";
import braintree from "braintree";
import dotenv from "dotenv";

import orderModel from "../models/orderModel.js";
dotenv.config();

//payment gatewaty

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIK_KEY, // Fix typo from BRAINTREE_PUBLIK_KEY
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields; // contains non-file fields
    const { photo } = req.files; // contains files

    // Validation
    if (!name) return res.status(400).send({ error: "Name is Required" });
    if (!description)
      return res.status(400).send({ error: "Description is Required" });
    if (!price) return res.status(400).send({ error: "Price is Required" });
    if (!category)
      return res.status(400).send({ error: "Category is Required" });
    if (!quantity)
      return res.status(400).send({ error: "Quantity is Required" });
    if (photo && photo.size > 1024 * 1024)
      return res.status(400).send({ error: "Photo should be less than 1MB" });

    const products = new productModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Creating Product",
    });
  }
};
//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      totalCount: products.length,
      message: "All Products get Successfully",
      products,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: "false",
      error,
      messsage: "Error while getting all Products",
    });
  }
};

//get single products

export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Getting Successfully",
      product,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While geting Single Product",
    });
  }
};

//get product photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");

    if (product && product.photo && product.photo.data) {
      // Set content-type to the photo's MIME type
      res.set("Content-Type", product.photo.contentType);
      // Send the photo data (which is a buffer)
      return res.status(200).send(product.photo.data);
    } else {
      // If no photo is found, return a 404 error
      return res.status(404).send({ error: "Photo not found" });
    }
  } catch (error) {
    // console.log(error);
    return res.status(500).send({
      success: false,
      error,
      message: "Error while getting photo",
    });
  }
};

//delete product
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-param");
    res.status(200).send({
      success: true,
      message: "product Deleted Successfully",
    });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Deleting Product",
    });
  }
};

//update product
export const updateProductController = async (req, res) => {
  try {
    const { name, slug, description, price, category, quantity, shipping } =
      req.fields; // contains non-file fields
    const { photo } = req.files; // contains files

    //validation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });

      case !description:
        return res.status(500).send({ error: "Description is Required" });

      case !price:
        return res.status(500).send({ error: "Price is Required" });

      case !category:
        return res.status(500).send({ error: "Category is Required" });

      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });

      case photo && photo.size > 1024 * 1024: // 1MB in bytes
        return res.status(500).send({ error: "Photo should be less than 1MB" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Update Successfully",
      products,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Updating Product",
    });
  }
};

//Filter Product
export const productFilterController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: "true",
      products,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while Filtering Products",
      error,
    });
  }
};

//product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

//product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in per page",
      error,
    });
  }
};

export const serachProductController = async (req, res) => {
  try {
    const { keywords } = req.params;
    const result = await productModel
      .find({
        $or: [
          { name: { $regex: keywords, $options: "i" } },
          { description: { $regex: keywords, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(result);
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      success: false,
      message: "error i search product API",
      error,
    });
  }
};
export const relatedProductController = async (req, res) => {
  try {
    const { cid, pid } = req.params;

    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo") // Corrected to lowercase "s"
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while getting related products",
      error,
    });
  }
};

// Get products by category
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    // console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error while getting product",
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    // console.log(error);
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = 0;
    cart.map((i) => {
      total += i.price;
    });
    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      function (error, result) {
        if (result) {
          const order = new orderModel({
            products: cart,
            payment: result,
            buyer: req.user._id,
          }).save();
          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    // console.log(error);
  }
};
