import mongoose, { mongo } from "mongoose";
import bcrypt from "bcrpyt";
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

userSchema.pre("save", async function(){
    if(! this.isModified("password")) return next()
    this.password = await bcrypt(this.password, 10);
    next(); //middleware
});
// Password Decryption Method
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema);