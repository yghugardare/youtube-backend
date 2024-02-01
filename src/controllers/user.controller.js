import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const registerUser = asyncHandler(async (req, res) => {
  // 1.get user details from frontend
  // we take fields as it is from user model
  const { fullName, email, username, password } = req.body;
  // console.log("email ", email);
  // 2.validation - check fields not empty

  //Brute force way -
  // if(fullName===""){
  //   throw new ApiError(400,"fullName is required")
  // }
  // Optimal way
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // 3.check if user already exists: username , email
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // 4.check for images and avatar
  // TODO: TASK = console.log(req.files)
  // console.log(req.files) check 14Postman.md
  // we retrieve the local path form avatar and coverImage
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // Problem
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Local file is required");
  }
  // 5.upload them to cloudinary and check if they have successfully uploaded or not
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }
  // 6.create user object , create entry in db
  // for each entry there will be _id field automatically
  // assigned by mongo db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // 7.remove password and refresh token field from response
  // select mein jo nahi chahiye vo dedo
  // select user w/0 password and refresh token for sending
  // response to the user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // 8.check for user creation based on response
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating a user");
  }
  // 9.if user created return response else return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refresh token to DB
    user.refreshToken = refreshToken;
    // save and avoid password checks
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refressh and access token"
    );
  }
};
const loginUser = asyncHandler(async (req, res) => {
  // 1. fetch data from req body
  const { email, username, password } = req.body;
  // 2. check if username or email present
  // if(!(username || email)) = also valid
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // 3. find the username with matching username/email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  // 4. password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  // 5. generate access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  // 6. send cookie and response
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // create options for cookies to make them modifiable by server only
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          // why are we snding access and refresh token
          // in cookie as well as response
          accessToken,
          refreshToken,
        },
        "user logged In Successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  // const userId = req.user._id;
  await User.findByIdAndUpdate(
    req.user_id,
    {
      $unset: {
        // this removes the field from document
        refreshToken: 1,
      },
    },
    {
      // return new value and not old value
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    // when we are using mobile, they dont have cookies
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request, no incomingRefreshToken");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // 1. take old and new password
  const { oldPassword, newPassword } = req.body;
  // 2.find user
  const user = await User.findById(req.user?._id);
  // 3. check if old password correct
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  // 4. handle case where password is not correct
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  // 4. set new password
  user.password = newPassword;
  // 5. save it to Db, and no need to validate as we are changing password
  await user.save({ validateBeforeSave: false });
  // 6. return new response, with no data only message
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// function to get current User
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});
// update users account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  // 1. get fullName and email
  const { fullName, email } = req.body;
  // 2. if not then send error response
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }
  // 3. find , update and return updated info without password in a variable
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  // send api response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  // 1. take file path of avatar from req.file thanks to multer we
  // have file in req body
  const avatarLocalPath = req.file?.path;
  // 2. if not present then handle the case
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  //TODO: delete old image - assignment
  // 4. upload file on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // 5. handle failure case
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  //6. find , update avatar and return updated info without password in a variable
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  // return it to user
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

// simillarly upadate coverImage
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  //TODO: delete old image - assignment

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // take user name form URL params
  const { username } = req.params;
  // check if username exists
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  // add agregation pipeline to find user channel info
  const channel = await User.aggregate([
    // pipeline 1
    // find user with the username
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    // pipeline 2
    // look for subscribers of the channel
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    // pipeline 3
    // look for how many chanels that 'channel' has subscribed
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    // pipeline 4
    // add additional fields to the schema/document
    // subscribersCount,channelsSubscribedToCount
    // and isSubscribed
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    // pipeline 5 = last pipelin
    // project or provide only selected fields to the frontend
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  // if channel not there , handle the case
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }
  // channel[0] = only one value of the object
  // so that it will be easy for frontend developer
  // to see the values
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    // pipeline 1
    // get the document of the user, by matching his id
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    // pipeline2
    // look for the vidoos , which will have thumbnail, video, views, owner
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // sub pipeline 2.1
        // for getting owner info from user document
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              // subpipline 2.1.1
              // to include only specific fields from user collection
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          // subpipeline 2.2
          // override the existing owner field
          // reshape  the structure of owner by flatening the array
          {
            $addFields: {
              owner: {
                // select the value of first object
                // from existing owner arrays, to ensure that
                // there is only one owner of that video
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
