// require('dotenv').config({
//     path:'./env'
// })
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
    path: "./env"
})
connectDB()





/*
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("App not able to talk to db error:  ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
})();
*/
