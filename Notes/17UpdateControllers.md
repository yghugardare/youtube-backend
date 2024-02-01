add subscription schema
```js
import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // one who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

```

in user.controller.js add changeCurrentPassword function
```js
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
```
then add function to get current User
```js
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});
```
then add function to update users account details

**Advice** - make a seperate controller for updating files like img or videos, to avoid network congestion

`{new: true}` = update hone ka baad jo information miltihai vo return hoti hai
```js
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
```
then add a function to update user avatar and simillarly coverImage
```js
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
```

