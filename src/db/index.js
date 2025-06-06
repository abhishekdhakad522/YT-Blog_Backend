import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { app } from "../app.js";

const connectDB = async()=>{
    // console.log(process.env.MONGODB_URI,DB_NAME);
    
    try {
        // console.log("successful");
        const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR: ",error);
            throw error
            
        })
        console.log(`\n MONGODB connected !! DB HOST :  ${connectionInstance.connection.host}`);
        
        
        // application.listen
    } catch (error) {
        console.log("MONGODB Connection FAILED: ",error);
        process.exit(1)
        
    }
}

export default connectDB