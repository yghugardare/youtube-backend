error debuging done

discusion on access and refresh token

When the access token expires, a request with a 401 error will be sent to the endpoint. This endpoint will handle the request by including a refresh token, which will be validated against the one stored on the server. If the refresh token is verified successfully, a new session will be initiated, resulting in the generation of fresh access and refresh tokens.

in user.controller.js, we create controller function to handle that endpoint - 
```js
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
```

add the endpoint in user.routes.js
```js
router.route("/refresh-token").post(refreshAccessToken);
```
