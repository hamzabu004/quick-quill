import express, { json } from "express";
import mongoose from "mongoose";
import 'dotenv/config'
import bcrypt from 'bcrypt';
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import { nanoid } from "nanoid";
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from "firebase-admin";
import serviceAccountKey from "./blogging-website-88ff8-firebase-adminsdk-mo1gc-44c62f84e0.json" with {type:"json"}
import {getAuth} from "firebase-admin/auth";
import aws from "aws-sdk"


const server = express();
let PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})


let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors())

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})


//setting up AWS (s3 bucket)
const s3 = new aws.S3({
    region:'us-east-2',
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
})

const generateUploadURL = async () => {

    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;
    
    return await s3.getSignedUrlPromise('putObject', {
        Bucket: 'ali-blogging-website',
        Key: imageName,
        Expires: 1000,
        ContentType: "image/jpeg"
    })
}


const verifyJWT = (req, rest, next) =>{

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(token==null){
        return res.status(401).json({"error":"No access token"})

    }
    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user)=>{
        if(err){
            return res.status(403).json({"error":"Invalid access token"})

        }
        req.user = user.id
        next()
    })


}


const formatDatatoSend = (user) => {

    const access_token = jwt.sign({id:user._id}, process.env.SECRET_ACCESS_KEY)

    return {
        access_token,
        profile_img : user.personal_info.profile_img,
        username : user.personal_info.username,
        fullname : user.personal_info.fullname,
    }
}


const generateUsername = async (email) => {
    let username = email.split("@")[0];

    let usernameExists = await User.exists({"personal_info.username" : username}).then((result) => result)


    .catch(err => {
        return res.status(500).json({"error" : err.message})
    })

    usernameExists ? username += nanoid().substring(0, 5): "";

    return username

}


//upload image url

server.get("/get-upload-url", (req, res) => {
    generateUploadURL().then(url => res.status(200).json({"uploadURL":url}))
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({"error":err.message})
    })
}) 


server.post("/signup", (req, res) => {
    
    let { fullname, email, password } = req.body;
    

    // validating data from frontend
    if (fullname.length < 3){
        return res.status(403).json({"error" : "Fullname must be at least 3 letters long"}) 
    }
    if (!email.length){
        return res.status(403).json({"error" : "This field is required. Please enter Email"})
    }
    if (!emailRegex.test(email)){
        return res.status(403).json({"error": "Invalid email"})
    }
    if (!passwordRegex.test(password)){
        return res.status(403).json({"error": "Password should be 6-20 characters, with at least 1 number, 1 lowercase letter and 1 uppercase letter"})
    }

    bcrypt.hash(password, 10, async (err, hashed_password)=>{

        let emailExists = await User.exists({"personal_info.email" : email}).then((result) => result)

        if(emailExists){
            return res.status(403).json({"error":"Email already exists"})
        }


        let username = await generateUsername(email);

        let user = new User({
            personal_info : {fullname, email, password:hashed_password, username }
        })

        user.save().then((u) => {
            return res.status(200).json(formatDatatoSend(u))
        })
        .catch(err => {

            if (err.code == 11000) {
                return res.status(500).json({"error":"Email already exists"})
            }
            return res.status(500).json({"error" : err.message})
        })
    })


    

})

server.post("/signin", (req, res)=> {
    
    let { email, password} = req.body;

    User.findOne({"personal_info.email" : email})
    .then(async (user) =>{
        if(!user) {
            return res.status(403).json({"error":"Email not found"})
        }
        let validPassword = await bcrypt.compare(password, user.personal_info.password).then((result) => result)
        if (!validPassword){
            return res.status(403).json({"error":"Invalid Password"})
        }

        bcrypt.compare(password, user.personal_info.password, (err, result) => {
            if (err) {
                return res.status(403).json({"error":"Error occurred while logging in. Please try again"})
            }
            if (!result) {
                return res.status(403).json({"Error": "Incorrect Password. Try Again."})
            } else {
                return res.status(200).json(formatDatatoSend(user))
            }
        })

    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({"error":"Invalid email and/or password"})
    })


})


server.post("/google-auth", async (req, res) => {

    let { access_token } = req.body;

    getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
        let { email, name, picture } = decodedUser;

        picture = picture.replace("s96-c", "s384-c")

        let user = await User.findOne({"personal_info.email" : email}).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
            return u || null
        })
        .catch(err => {
            return res.status(500).json({"error" : err.message})
        })
        if (user) { //login
            if (!user.google_auth) {
                return res.status(403).json({"error":"You already have an account with this email. Please use the email and password to login."})
            }
        }else {
            
            let username = await generateUsername(email);
            
            user = new User({
                personal_info : {fullname:name, email, profile_img:picture, username},
                google_auth: true
            })
            
            await user.save().then((u) => {
                user = u;
            })
            .catch(err => {
                return res.status(500).json({"error":err.message})})
        }

        return res.status(200).json(formatDatatoSend(user))


    })
    .catch(err => {return res.status(500).json({"error":"Failed to authenticate through Google. Try again or try another account"})})



})


server.post('/create-blog', verifyJWT, (req, res) =>{
    
    let authorID = req.user;

    let { title, desc, banner, tags, content, draft } = req.body;


    if(!draft){
        if(!desc.length || desc.length>200){
            return res.status(403).json({"error":"You must provide a blog description under 200 characters to publish"});
        }
        if(!banner.length){
            return res.status(403).json({"error":"You must provide a banner for your blog to publish it"});
        }
        if(!content.blocks.length){
            return res.status(403).json({"error":"You cannot publish an empty blog."});
        }
        if(!tags.length){
            return res.status(403).json({"error":"You need at least 1 tag to publish your blog"});
        }
        if(tags.length>5){
            return res.status(403).json({"error":"You cannot add more than 5 tags to your blog"});
        }
    }

    if(!title.length){
        return res.status(403).json({"error":"You must provide a title to save a draft"})
    }
    

    tags = tags.map(tag => tag.toLowerCase());

    let blog_id= title.replace(/[=>a-zA-z0-9]/g, ' ').replace(/\s+/g,'-').trim() +nanoid();

    let blog = new Blog({
        title,
        desc,
        banner,
        content,
        tags,
        author:authorID,
        blog_id,
        draft:Boolean(draft)

    })

    blog.save().then(blog =>{

        let incrementVal = draft ? 0 : 1;

        User.findOneAndUpdate({_id:authorID}, { $inc : {"account_info.total_posts":incrementVal}, $push : {"blogs" : blog._id}})
        .then(user => {
            return res.status(200).json({id:blog.blog_id})
        })
        .catch(err=> {
            return res.status(500).json({"error":"Failed to update posts number"})
        })


    })
    .catch(err=>{
        return res.status(500).json({"error":err.message})
    })


})

server.listen(PORT, () => {
    console.log('listening on port -> ' + PORT);
})
