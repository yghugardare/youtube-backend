in controller , user.controller.js
```js
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "hi",
  });
});
export { registerUser };
```
in app.js add route- 
`app.use("/api/v1/users",userRouter)`

in routes user.routes.js
```js
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()
// router.route("/login").get(registerUser)
router.route("/register").post(registerUser);

export default router;
```

![postman](/Notes/images/postman.png)

ISSUE I was facing - In index.js i did not import app, instead i was running it other express server