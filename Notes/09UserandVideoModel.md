in models -> user , video.model.js

user ke andar id nahi bnata , automatically bnata hai  and bson mein krta hai , research kro

video and image -> string storrf in 3rd party service like cloudinary or AWS

learn about indexes in Db , what is index:true?

Install -
`npm i mongoose-aggregate-paginate-v2`
use it in video.model.js

Install - 
`npm i bcrypt jsonwebtoken`

bcrypt - lets you hash your passwords
jsonwebtoken - create tokens , encods payloads(userData) with header(crypto algo), payload , verify signature

use it in user.model.js
 But
How to encrypt?
we make use of mongoose hooks[middleware function], in which one is pre hook , which performs operation just before some operation is going to be performed.

In our context, encrypt userData just before saving it
Dont use arrow in pre as they dont have this context
```js
userSchema.pre("save",async function (next){
    this.password = bcrypt.hash(this.password,10);
    next();
})
```
problem -> whenever user is making changes in userSchema , the password field is being encrypted for each save

we want password field to be encrypted only when password in userSchema is being changed
So we write if statement, 

we can also create custome method to check is Password correct

jwt is bearer token -> who has this token only they can access info

what is access token and refresh token, what is need?

what is jwt.sign()?