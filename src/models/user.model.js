import mongoose, { mongo } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
       username:{
        type:String,
        required:[true, "Email is Required"],
        unique:true,
        lowercase: true,
        trim: true,
        index: true,
       },
       email:{
        type:String,
        required:[true, "Email is Required"],
        unique:true,
        lowercase: true,
        trim: true,
       },
       fullName:{
        type:String,
        required:[true, "Full Name is Required"],
        trim: true,
        index: true,
       },
       avatar:{
        type:String,  // Cloudinary
        required:true,

       },
       coverImage:{
        type: String // Cloudinary
       },
       password:{
         type:String,
         required: [true, "Password is Required"]
       },
       watchHistory:{
          type: mongoose.Schema.Types.ObjectId,
          ref: "Video",
       },
       refreshToken:{
        type:String
       }

    },
    {
        timestamps:true
    }
);

userSchema.pre("save", async function(next){
    if(! this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10);
    next(); //middleware
});
// Password Decryption Method
userSchema.methods.isPasswordCorrect = async function(password){
   // console.log(`${typeof password}, :Original Password: ${typeof this.password}`);
    const ispasswordValid =  await bcrypt.compare(password,this.password);
    return ispasswordValid;
}

userSchema.methods.generateAccessToken = async function(){
    const accessToken = await jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    return accessToken;
}

userSchema.methods.generateRefreshToken =async function(){
    const refreshToken =  await jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
    return refreshToken;
}
export const User = mongoose.model("User",userSchema);