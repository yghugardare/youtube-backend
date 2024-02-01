# Access Refresh Tokens , Middelware and Cookies

- *Access Token:* Short-lived, usually valid for a short period (e.g., 15 minutes).
- *Refresh Token:* Longer-lived, valid for a longer duration (e.g., several days).

- Refresh token stored in data base while access token is not

In user.controller.js, we write steps for login user

Steps - 
    1. fetch data from req body
    2. check if username or email present
    3. find the username with matching username/email
    4. password check - use user which is User instance to access isPasswordCorrect method and not User
    5. generate access and refresh token - this is so common, we create a seperate function as it will be used many times
    6. send cookie and response

```js
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

```

Q1. What is a cookie ?
A1. A cookie is a small piece of data sent from a server and stored on the client's browser. It is typically used to store user-specific information or session data, allowing websites to maintain stateful interactions with users.

Q2. Why Do We Need Cookies?
A2. Cookies are essential for maintaining user sessions and preserving user-specific data between requests. In the context of user authentication, cookies often store tokens (like access and refresh tokens) that are sent back to the server with each subsequent request, enabling the server to identify and authenticate the user.

Q3. Sending Tokens in Cookies and Response
Sending Tokens in Cookies and Response:

Cookies:

The code is using res.cookie to set cookies for the access token and refresh token.
These cookies are marked as httpOnly (accessible only through the server) and secure (sent only over HTTPS), enhancing security.
Cookies are sent automatically by the client's browser in subsequent requests to the same domain.

Response:

The response also includes the access token and refresh token in the JSON payload.
This redundant inclusion in the response can be useful for the client to immediately access the tokens without relying on subsequent requests or parsing cookies.

Why Both Cookies and Response?

Cookies: Cookies are primarily for the browser to include tokens automatically in subsequent requests, enhancing security by keeping tokens out of client-side JavaScript reach.
Response: Including tokens in the response allows the client (e.g., a front-end application) to immediately access and use the tokens without relying on cookies.
This dual approach accommodates different scenarios. For instance, a client-side application might prefer accessing tokens directly from the response, while traditional web applications or server-side processes benefit from automatic inclusion via cookies. It provides flexibility in handling tokens based on the application's architecture and requirements
-----
logout steps -
    1. Reset refresh tokens
    2. clear cookies
Problem  -  in the logout function, user kaha se laye ? 
Solution - Middleware - "jaane se pehle mil ke jayega"

we will design our first middleware, which will decide ki user hai ya nahi hai? and add req.user in request

In middleware folder add auth.middleware.js and add  - 

```js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
// true login
export const verifyJWT = asyncHandler(async (req, res, next) => {
 try {
     // because of cookieParser we have access of req.cookie
     const token =
       req.cookies?.accessToken ||
       req.header("Authorization")?.replace("Bearer ", "");
     if (!token) {
       throw new ApiError(401, "Unauthorized request");
     }
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
     // now get the user
     const user = await User.findById(decodedToken?._id).select(
       "-password -refreshToken"
     );
     if (!user) {
       // TODO: Discuss about frontend
       throw new ApiError(401, "Invalid Access Token");
     }
     // add new property to req object
     req.user = user;
     next();
 } catch (error) {
    throw new ApiError(401, "Invalid Access Token");
 }
});


```

Logout Logic - 

```js
const logoutUser = asyncHandler(async(req,res)=>{
  // const userId = req.user._id;
  await User.findByIdAndUpdate(
    req.user_id,
    {
      $set: {
        // remove refresh tokens
        refreshToken : undefined
      }
    },
    {
      // return new value and not old value
      new:true
    }
  )
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})
```

Now create a route , in user.routes.js , inside route we add verifyJwt+logoutUser as a route and login User as another route 
```js
router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT,logoutUser) 

```
