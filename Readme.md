# Learning backend 

## Setup Professional Backend
- we temporarily store images/audio in our store and also on 3rd party service like cloudinary/aws, to prevent data loss in case 3rd party service is down
- we create temp folder , add .gitkeep empty file to push empty folder to github
- use [this website](https://mrkandreev.name/snippets/gitignore-generator/#Node) to generate giignore file
- install nodemon which automatically restarts server when file changes
- install it as dev dependancy so `npm i -D nodemon`
- install prettier for avoiding merge conflicts when working in a team and format the document properly, instal it as dev dependacy

## Connect database in MERN with debugging
- always wrap db connection in try catch or then catch and NOT in one line
- db is always on different continent hence it takes time to fetch data , hence always use async-await or then catch
- 1. Approach 1 in index using IIFE, good practice to add ; before iife
`javascript
;(async ()=> {try catch})()
`
- 2. Approach 2 write code on other file(src/db/index.js), export and import in index.js, and call it in src/index
### ERRORS
- ERROR 1 -  Directory import 'D:\Backend-Learn\backend-youtube\src\db' is not supported resolving ES modules imported from D:\Backend-Learn\backend-youtube\src\index.js
- import connectDB from "./db";
- OKAY let's change it to - import connectDB from "./db/index";
- ERROR 2 - Directory import 'D:\Backend-Learn\backend-youtube\src\db' is not supported resolving ES modules imported from D:\Backend-Learn\backend-youtube\src\index.js
-  OKAY let's change it to - import connectDB from "./db/index.js";
- ERROR 3- Cannot find module 'D:\Backend-Learn\backend-youtube\src\constants' imported from D:\Backend-Learn\backend-youtube\src\db\index.js 
- Go to src/db/index and change -> import { DB_NAME } from "../constants"; to import { DB_NAME } from "../constants.js";
- ERROR Resolved ! 🎉😉
- Lets see what happens when we make change to env mongoURI , **restart the server whenever env changed!** , ERROR - MONGODB CONNECTION FAILED
