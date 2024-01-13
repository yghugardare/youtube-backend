# Logic building and Register controller

- req.body => when data coming from form or direct JSON

1. made algo for registration process

2. started wrting code in user.controller.js

While writing 2.1 Step- **get user details from frontend**
    - took data from req.body and tested it by sending request in postman
    ![testingWithPostman](image.png)
    - then realised that we also need to handle files , for that we went to user.routes.js and imported upload variable present in multer middleware, so that we can upload two files.
    - `upload.single` - upload single file
    - `upload.array` - upload multiple files at a **single** field
    - `upload.fields([{f1},{f2},..{fn}])` - upload multiple files associated with different fields, in our case we need two fields, avatar and coverImage.
    - So we will add this middleware in between `/register` and post data
    - Code - 
```js
router.route("/register").post(
  upload.fields([
    {
      // name of the fields
      // should be same at fronend
      // this communication should be there between
      // backedn and frontend developer
      name: "avatar",
      // how many files you want to upload?1
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

```
-----

- While writing 2.2 Step- **validation - check fields not empty**
    - optimal way to validate
```js
        if([fullName,email,username,password].some((field)=>field?.trim()==="")){
            throw new ApiError(400,"All fields are required")
        }
```
----
- While writing 2.3 Step- **check if user already exists: username , email**
    - import User mode in user controller
    - User model is campable of calling your mongo db whenever needed
    - `User.findOne({$or:[{username},{email}]})` - to find one of them
    - if  found then throw error
----
- While writing 2.4 Step- **check for images and avatar**
    - Now since we wrote multer middleware in between register route and post, it provides us , `req.files`
    - So now we can use that data to see whether any image has been uploaded or not
    - to retrieve the file path of avatar and cover image,
    we use `const avatarLocalPath = req.files?.avatar[0]?.path;` 
    - if no image is there then , we throw ApiError
----
- While writing 2.5 Step- **upload them to cloudinary and check if they have successfully uploaded or not**  
    - import uploadOnCloudinary function from utils/cloudinary.js
    - NOTE- In cloudinary.js we have logic for uploading and in case upload fails we delete the file from localServer, but we also need to delete the file from local server when uploaded suxesfully on cloudinary, that PART, we'll deal later
```js
const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!avatar){
    throw new ApiError(400, "Avatar file is required");
  }
```
- While writing 2.6 Step- **create user object , create entry in db**  
    - for each entry mongoDb associates a unique _id by default
```js
const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
    email,
    password,
    username: username.toLowerCase(),
  });
```
----
-  writing 2.7,8 and 9 Step- **remove password and refresh token field from response check for user creation and return response**  
    - we select the user with that particular id and ignore "password" and "refreshToken" field
```js
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
```
----



