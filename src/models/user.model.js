import mongoose,{Schema} from "mongoose"; // destructure
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true // enable the searching field
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudinary url
        required:true

    },
    coverImage:{
        type:String, // cloudinary url
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref :"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'password is required'],

    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

userSchema.pre("save",async function(next){    // arrow function ke pass this ka refrence nhi hota that's why normal function is used
    if(! this.isModified("password"))  return next()

    this.password = bcrypt.hash(this.password,10) // this thing will be run if pswd is modified
        next()
})  

// custom method
userSchema.methods.isPasswordCorrect = async function (password) {
     return await bcrypt.compare(password,this.password) // it wil return true or false  
}

userSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        // payload i.e kya kya information rakhna hai
      {
        _id:this._id,
        email: this.email,
        username:this.username,
        fullName: this.fullName
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
      }
   )
}
userSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        // payload i.e kya kya information rakhna hai
      {
        _id:this._id, // ye baar baar refresh hota hai
    
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
      }
   )
}

const User = mongoose.model("User",userSchema)
export {User}