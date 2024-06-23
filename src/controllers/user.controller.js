import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import multer from "multer";
/*
Register User Algorithm
1. Get the user details from Frontend
2. Validate the data
3. Check if the  username or email already exist or not
4. File - check for image and check for avatar
5. Upload them to the cloudinary
6. Create the entry of the object in the database
7. Remove the password and refresh token from the response
8. check for user creation
9. Return the response
*/
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

export {registerUser};