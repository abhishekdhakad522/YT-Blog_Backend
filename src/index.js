//  require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import { app } from "./app.js"
import connectDB from "./db/index.js"

dotenv.config({
    path:"./env"
})

connectDB() // it will return the promise
.then(()=>{
    app.listen(process.env.PORT || 4000,()=>{
        console.log ("Server is Running at PORT ",process.env.PORT);
        
    })
})
.catch((error)=>{
    console.log("MONGODB connection failed !!!",error);
    
})













/*

// iffy
// ;(async()=>{})() initialize and decllaration of function

;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR: ",error);    
        })
        app.listen(process.env.PORT,()=>{
            console.log("APP is listining on PORT: ",process.env.PORT);
            
        })
    } catch (error) {
        console.log("Error : ", error)
        throw error
    }
})()

*/