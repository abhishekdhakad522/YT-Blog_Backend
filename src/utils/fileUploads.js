// phele file ko server pr laynge then cloudinary pr store karayenge 
// agr file uppload ho chuki hai to fir usse server se remove kr denge

import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // file system bult in in node js

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCLoudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null;

        // upload the file on cloudinary
       const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("File is uploaded on cloudinary",response.url);
        //unlink
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove locally saved temporary files
        return null;
    }
}

export default uploadOnCLoudinary
