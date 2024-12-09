import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    //    console.log(`connected To MongoDb Database ${conn.connection.host}`.bgBlack.green)
  } catch (error) {
    // console.log(`Error in mongodb ${error}`.bgRed.white)
  }
};

export default connectDB;
