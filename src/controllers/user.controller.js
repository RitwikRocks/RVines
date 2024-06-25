import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { cookieOptions } from "../constants.js";
/*
Register User Algorithm
1. Get the user details from Frontend
2. Validate the data
3. Check if the  username or email already exist or not
4. File - check for image and check for avatar
5. Upload them to the cloudinary
6. Create the entry of the object in the database
7. Remove the password and refresh token from the responsep
8. check for user creation
9. Return the response
*/

// Function to generate the token

const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken =await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validBeforeSave:false});

        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while Generating Tokens");
    }
}



const registerUser = asyncHandler( async(req,res) =>{
    // 1 get user data from frontend
    const {username, email,fullName,password}=req.body;
    
   // console.log(`${username}, ${email}, ${fullName}, ${password}`)
    // 2 Validation Check
    if([username, email, fullName, password].some( (field)=>{
       return field?.trim === ""
    })){
        throw new ApiError(400, "All Fields are required");
    }

    // Check if user Exists or not
 const userExist =await User.findOne({
        $or:[{username}, {email}]
})
    if(userExist)
    {
        throw new ApiError(409, "The Username or Email Already Exists!");
    }

    // File - Check for Image and Avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath; 
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar Not Found");
    }
    
    // Upload on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // Entry in DataBase
    const user = await User.create(
        {
            fullName,
            avatar:avatar.url,
            coverImage:coverImage?.url||"",
            email,
            username:username.toLowerCase(),
            password,
        }
    )
    console.log(user);

    const createdUser = await User.findById(user._id);
    return res.send(201).json(new ApiResponse(200, createdUser, "User Created"));
})

const loginUser = asyncHandler( async(req,res)=>{
       const {username, email, password} = req.body;
       if(!(username || email)){
         throw new ApiError(400, "UserName or Email Required");
       }
       //console.table([username,email,password]);
      try {
         const user = await User.findOne({ $or:[{username}, {email}]});
         if(!user){
          throw new ApiError(404, "User Does not Exit");
         }

         const passwordValid = await user.isPasswordCorrect(String(password));
         if(!passwordValid){
          throw new ApiError(401, "Password is Incorrect");
         }
        
         const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
         const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

         res.status(200)
         .cookie("accessToken", accessToken, cookieOptions)
         .cookie("refreshToken", refreshToken, cookieOptions)
         .json(
            new ApiResponse(
                200,
                {
                    user:loggedInUser, accessToken, refreshToken
                },
                "User Logged In Successfully"
            )
         );

      } catch (error) {
        console.log(error);
         throw new ApiError(500, "Something Went Wrong While Connecting to database");
      }
})

const logoutUser = asyncHandler( async(req,res)=>{
    const _id = req.user._id;
   try {
     const user = await User.findByIdAndUpdate(_id,
         {
             $set:{
                 refreshToken:undefined
             }
         },
         {
             new:true,
         }
     )
     return res.status(200)
     .clearCookie("accessToken", cookieOptions)
     .clearCookie("refreshToken", cookieOptions)
     .json(
         new ApiResponse(
             200,
             {},
             "User has been logout Successfully"
         )
     )
   } catch (error) {
     throw new ApiError(500, "Logout Failed");
   }
})

export {
    registerUser,
    loginUser,
    logoutUser,
};