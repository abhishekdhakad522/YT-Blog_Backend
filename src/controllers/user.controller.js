import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import uploadOnCLoudinary from "../utils/fileUploads.js"; 
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { syncIndexes } from "mongoose";



const generateAccessAndRefreshToken = async(userId)=>
{
    try {
      const user =  await User.findById(userId) 
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500 ,"Something went wrong while genrating refresh and access token")
    }
}


const registerUser = asyncHandler(async(req,res)=>{
    
    
    //  get all user infromation from the frontend
    // validation - if all fields are filled or not
    // check if user is already exist - username or email
    // check for images , avatar
    // upload them to cloudinary , avatar
    //  create user object - create entry in DB
    // remove password and refresh tokens field from response
    //  check for user creation
    // return response

    //Data handling
    const {fullName, email, username , password} = req.body
    // console.log("Email: ", email);
    
    // if(fullName===""){
    //     throw new ApiError(400,"fullName is required")
    // }
if(
    [fullName,email,password,username].some((field)=>
        field?.trim() ===""
    )
){
    throw new ApiError(400,"fullName is required")
}

const existedUser = await User.findOne({
    $or:[{email}, {username}]
})
if(existedUser){
    throw new ApiError(409,"User already exits ")
}

const avatarLocalPath = req.files?.avatar[0]?.path;
// console.log(avatarLocalPath);

// const coverLocalPath = req.files?.coverImage[0]?.path;
// normal approach
let coverLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0)
{
    coverLocalPath = req.files.coverImage[0].path
}

if(!avatarLocalPath){
    
    // console.log("first check\n");
    throw new ApiError(400,"Avatar file is required")
} 

const avatar = await uploadOnCLoudinary(avatarLocalPath)
const coverImage = await uploadOnCLoudinary(coverLocalPath)

if(!avatar)
{
    console.log("second check");
    throw new ApiError(400,"Avatar file is required")
}

const user= await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase()

})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // kya kya nahi chahiye
)
if(!createdUser){
    throw new ApiError(400 ,"Something went wrong while user creating")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered succesfully")
)

})



const loginUser = asyncHandler(async(req,res) =>{

//  login body ->data
// username or email
// find the user
// password check
// access and refresh token
// send in cookies
const {email, username, password} = req.body
if(!(email || username))
{
    throw new ApiError(400 , "username or email is required")
}

const user = await User.findOne({
    $or:[{username},{email}]
})
if(!user)
{
    throw new ApiError(404,"user does not exit")
}

const isPasswordValid = await user.isPasswordCorrect(password)
if(!isPasswordValid)
{
    throw new ApiError(401, "invalid user credentials")
}

const {accessToken, refreshToken} =await generateAccessAndRefreshToken(user._id)


const loggedInUser = await User.findById(user._id).
select(" -password -refreshToken")

const options ={ // for cookies
    httpOnly:true,
    secure :true
}
return res.
status(200).
cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(200,
        {
            user:loggedInUser, accessToken,
            refreshToken
        },
        "user loggged in successfuly"
    )
)
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
    {
        $set:{
            refreshToken:undefined
        }
    },
    {
            new:true
    }
)
const options ={ // for cookies
    httpOnly:true,
    secure :true
}
return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"User Looged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
     const incomingRefreshToken = req.cookies.refreshToken 
                                     || req.body.refreshToken   // body mobile users
    if(!incomingRefreshToken){
        throw  new ApiError(401,"Unauthorized Request")
    }

   try {
    const decodedToken =  jwt.verify(incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = await User.findById(decodedToken?._id)
     if(!user){
         throw new ApiError(401,"Invalid Refresh Token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh token is expired or used")
     }
 
     const options ={
         http:true,
         secure:true
     }
     const {accessToken, newrefreshToken} =await generateAccessAndRefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newrefreshToken,options)
     .json(
         new ApiResponse(
             200,
             {accessToken, refreshToken: newrefreshToken},
             "Access Token refreshed"
         )
     )
   } catch (error) {
    throw new ApiError(401,error?.message ||
        "Invalid refresh token"
     )
   }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body
    const  user = await User.findById(req.user?._id)

    const isPasswordCorrect =await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user .save({validateBeforeSave})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed succesfully"))  //  no data is sent i.e {}

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200, req.user,"current user fetched succesfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body
    if(!fullName || !email)
    {
        throw new ApiError(400 ,"All fields are  required")
    }

    const user = User.findByIdAndUpdate(req.user?._id , 
         {$set:{
            fullName,
            email:email
         }}, 
    {new :true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const CoverImageLocalPath  = req.file?.path
    if(!CoverImageLocalPath){
        throw new ApiError(400 , "CoverImage file is missing")  
    }
    const CoverImage = await uploadOnCLoudinary(CoverImageLocalPath)
    if(!CoverImage.url)
    {
        throw new ApiError(400,"Error while uploading on  CoverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.body?._id,
        {$set :{
            coverImage: CoverImage.url
        }},
        {new :true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image updated succesfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath  = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is missing")  
    }
    const avatar = await uploadOnCLoudinary(avatarLocalPath)
    if(!avatar.url)
    {
        throw new ApiError(400,"Error while uploading on  avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.body?._id,
        {$set :{
            avatar: avatar.url
        }},
        {new :true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated succesfully"))
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}