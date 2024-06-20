import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

dotenv.config({path:'./env'})

const connectDB = async function(){
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      //  console.log(connectionInstance.connection);
      console.log(connectionInstance.connection.host);
    }catch(error){
        console.log("Ritwik Error Occured in the MongoDB Connection", error);
        process.exit(1)
    }
}

export default connectDB;