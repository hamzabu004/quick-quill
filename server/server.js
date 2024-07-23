import express, { json } from "express";
import mongoose from "mongoose";
import 'dotenv/config'
import bcrypt from 'bcrypt';
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import Notification from './Schema/Notification.js'
import Comment from './Schema/Comment.js';
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


server.post('/latest-blogs', (req, res) => {

    let {page} = req.body

    let maxLimit = 5
    
    Blog.find({ draft : false})
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({"publishedAt":-1})
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page-1) * maxLimit)
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({blogs})
    })
    .catch(err =>{
        return res.status(500).json({"error":err.message})
    })
    

})

server.post('/all-latest-blogs-count', (req, res) =>{
    Blog.countDocuments({ draft:false })
    .then(count =>{
        return res.status(200).json({totalDocs:count})
    })
    .catch(err =>{
        return res.status(500).json({"error":err.message})
    })
})

server.get('/trending-blogs', (req, res) => {

    Blog.find({draft:false})
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({"activity.total_reads":-1, "activity.total_likes":-1, "publishedAt":-1})
    .select("blog_id title publishedAt tags -_id")
    .limit(5)
    .then(blogs =>{
        return res.status(200).json({blogs})
    })
    .catch(err => {
        return res.status(500).json({"error":err.message})
    })

})

server.post('/search-blogs', (req, res)=>{

    let { tag, query, author, page, multipleTags, limit, remove_blog} = req.body;

    let findQuery;

    if(multipleTags){
        multipleTags.map(t => t.toLowerCase());
        let stringTags = multipleTags.join('|')
        findQuery = {$or:[{tags: {$in: multipleTags}, draft:false, blog_id: { $ne : remove_blog }}, {title: new RegExp(stringTags, 'i'), draft:false, blog_id: { $ne : remove_blog }}]}
    }
    else if(tag){
        tag= tag.toLowerCase()
        findQuery = {$or:[{tags:tag, draft:false}, {draft:false, title: new RegExp(tag, 'i')}]}
    } 
    else if(query) {
        tag = query
        findQuery = {$or:[{tags:tag, draft:false}, {draft:false, title: new RegExp(tag, 'i')}]}
    } 
    else if(author){
        findQuery = {draft:false, author:author}
    }

    let maxLimit = limit ? limit : 10;
    

    Blog.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({"activity.total_likes":-1, "publishedAt":-1})
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page-1) * maxLimit)
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({blogs})
    })
    .catch(err =>{
        return res.status(500).json({"error":err.message})
    })

})

server.post('/search-blogs-count', (req, res)=>{
    let {tag, query, author} = req.body;

    let findQuery;
    
    if(tag){
        tag= tag.toLowerCase()
        findQuery = {$or:[{tags:tag, draft:false}, {draft:false, title: new RegExp(tag, 'i')}]}
    } else if(query) {
        tag = query
        findQuery = {$or:[{tags:tag, draft:false}, {draft:false, title: new RegExp(tag, 'i')}]}
    } else if(author){
        findQuery = {draft:false, author:author}
    }
    
    
    Blog.countDocuments(findQuery)
    .then(count => {
        return res.status(200).json({totalDocs:count})
    })
    .catch(err =>{
        return res.status(500).json({"error":err.message})
    })


})

server.post('/search-users', (req, res)=>{

    let {query} = req.body;

    User.find({"personal_info.username": new RegExp(query, 'i')})
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
    .then(users =>{
        return res.status(200).json({users})
    })
    .catch(err => {
        return res.status(500).json({error: err.message})
    })


})

server.post("/get-profile", (req, res) => {
    let { username } = req.body;

    User.findOne({"personal_info.username" : username})
    .select("-personal_info.password -google_auth -updatedAt -blogs")
    .then(user => {
        return res.status(200).json(user)
    })
    .catch(err =>{
        return res.status(500).json({error:err.message})
    })

})

server.post('/create-blog', verifyJWT, (req, res) =>{
    
    let authorID = req.user;

    let { title, des, banner, tags, content, draft, id } = req.body;


    if(!draft){
        if(!des.length || des.length>200){
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

    let blog_id= id || title.replace(/[=>a-zA-z0-9]/g, ' ').replace(/\s+/g,'-').trim() +nanoid();

    if(id){

        Blog.findOneAndUpdate({blog_id}, {title, des, banner, content, tags, draft: draft ? draft : false})
        .then(() => {
            return res.status(200).json({id:blog_id})
        })
        .catch(err =>{
            return res.status(500).json({error: 'Failed to update total posts numberd'})
        })

    }
    else {
        
        let blog = new Blog({
            title,
            des:des,
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
    }
})

server.post("/get-blog", (req, res) =>{
    
    let { blog_id, draft, mode } = req.body

    let incrementVal = mode == 'edit' ? 0 : 1;

    Blog.findOneAndUpdate({blog_id}, {$inc : {"activity.total_reads":incrementVal}})
    .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
    .select("title des content banner activity publishedAt blog_id tags")
    .then(blog =>{

        User.findOneAndUpdate({"personal_info.username":blog.author.personal_info.username}, {$inc:{"account_info.total_reads" : incrementVal}})
        .catch(err =>{
            return res.status(500).json({error:err.message})
        })

        if(blog.draft && !draft){
            return res.status(500).json({error:'You cannot access draft blogs'})
        }

        return res.status(200).json({blog})})

    .catch(err =>{
        return res.status(500).json({error:err.message})
    })
})

server.post("/like-blog", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { _id, isLikedByUser } = req.body;
    
    let incrementVal = !isLikedByUser ? 1 : -1;

    Blog.findOneAndUpdate({ _id}, {$inc : {"activity.total_likes" : incrementVal}})
    .then(blog=>{
        if (!isLikedByUser){
            let like = new Notification({
                type: 'like',
                blog: _id,
                notification_for: blog.author,
                user: user_id 
            })
            like.save().then(notification => {
                return res.status(200).json({liked_by_user : true})})
        } else {

            Notification.findOneAndDelete({user:user_id, blog: _id, type:"like"})
            .then(data =>{
                return res.status(200).json({liked_by_user : false})
            })
            .catch(err => {
                return res.status(500).json({error: err.message})
            })

        }
    })
})

server.post("/isliked-by-user", verifyJWT, (req, res)=> {

    let user_id = req.user;

    let { _id } = req.body;

    Notification.exists({ user: user_id, type:"like", blog: _id })
    .then(result => {
        return res.status(200).json({result})
    })
    .catch(err => {
        return res.status(500).json({error: err.message})
    })
})

server.post("/add-comment", verifyJWT, (req, res)=>{

    let user_id = req.user;

    let { _id, comment, blog_author, replying_to } = req.body

    if(!comment.length){
        return res.status(403).json({error: "Write something to add a comment"})
    }

    let commentObj = {
        blog_id: _id,
        blog_author,
        comment,
        commented_by: user_id
    }

    if(replying_to){
        commentObj.parent = replying_to;
        commentObj.isReply = true;
    }

    new Comment(commentObj).save().then(async commentFile => {

        let { comment, commentedAt, children  } = commentFile;

        Blog.findOneAndUpdate({_id}, 
            { $push : {"comments" : commentFile._id}, 
            $inc : {"activity.total_comments" : 1, "activity.total_parent_comments" : replying_to ? 0 : 1}})
        .then(blog => {console.log('New Comment Created')})

        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentFile._id
        }

        if(replying_to){
            notificationObj.replied_on_comment = replying_to;

            await Comment.findOneAndUpdate({_id: replying_to}, {$push: { children : commentFile._id }})
            .then(replyingToCommentDoc => {
                notificationObj.notification_for = replyingToCommentDoc.commented_by
            })

        }

        new Notification(notificationObj).save().then(notification => console.log('New notification created'))

        return res.status(200).json({comment, commentedAt, _id: commentFile._id, user_id, children})

    })
})

server.post("/get-blog-comments", (req, res) => {

    let { blog_id, skip } = req.body

    let maxLimit = 5;

    Comment.find({blog_id, isReply:false})
    .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
    .skip(skip)
    .limit(maxLimit)
    .sort({
        'commentedAt': -1
    })
    .then(comment => {
        return res.status(200).json(comment);
    })
    .catch(err => {
        console.log(err.message)
        return res.status(500).json({error: err.message})
    })

})


server.post("/get-replies", (req, res)=> {

    let { _id, skip } = req.body;

    let maxLimit = 5;

    Comment.findOne({_id})
    .populate({
        path: "children",
        options: {
            skip: skip,
        },
        populate : {
            path: 'commented_by',
            select: "personal_info.profile_img personal_info.fullname personal_info.username"
        },
        select: "-blog_id -updatedAt"
    })
    .select("children")
    .then(doc => {
        return res.status(200).json({replies: doc.children})
    })
    .catch(err => {
        return res.status(500).json({error:err.message})
    })

})

const deleteComments = (_id) => {

    Comment.findOneAndDelete({_id})
    .then(comment => {

        if(comment.parent) {
            Comment.findOneAndUpdate({_id: comment.parent}, {$pull : {children : _id}})
            .then(data => console.log('Comment removed from parent'))
            .catch(err => console.log(err));
        }

        Notification.findOneAndDelete({comment: _id}).then(notification => console.log('notification deleted'))

        Notification.findOneAndDelete({reply: _id}).then(notification => console.log('reply notification deleted'))

        Blog.findOneAndUpdate({_id: comment.blog_id}, {
            $pull : {comments: _id}, 
            $inc : {
                "activity.total_comments" : -1, 
                "activity.total_parent_comments": comment.parent ? 0 : -1}})
        .then(blog => {
            if(comment.children.length){
                comment.children.map(reply => {
                    deleteComments(reply)
                })
            }
        })

    })
    .catch(err => {
        console.log(err.message)
    })

}



server.post("/delete-comment", verifyJWT, (req, res)=> {

    let user_id = req.user

    let { _id } = req.body

    Comment.findOne({_id})
    .then(comment => {
        if (user_id == comment.commented_by || user_id == comment.blog_author){

            deleteComments(_id)

            return res.status(200).json({status: 'Comment and replies deleted'})

        } else {
            return res.status(403).json({error: "You cannot delete this comment"})
        }
    })
    .catch(err=>{
        return res.status(500).json({error: err.message})
    })

})

server.listen(PORT, () => {
    console.log('listening on port -> ' + PORT);
})
