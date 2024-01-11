import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app  = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
})); // Allow cross origin requests
app.use(express.json({limit:"18kb"})); 
app.use(express.static("public")) // for assets
app.use(express.urlencoded({extended:true,limit:"18kb"}));
app.use(cookieParser())

export {app}