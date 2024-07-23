import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import {Toaster, toast} from 'react-hot-toast';
import { UserContext } from "../App"
import axios from "axios";


const BlogInteraction = ({hide=false}) => {

    let { blog, blog: {_id, title, blog_id, activity, activity : {total_likes, total_comments}, author, author: {personal_info : {username: author_username}}}, setBlog, isLikedByUser, setLikedByUser, setCommentsWrapper } = useContext(BlogContext)

    let { userAuth : {username, access_token} } = useContext(UserContext)

    useEffect(() => {

        if(access_token){
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/isliked-by-user", {_id}, {
                headers : {
                    'Authorization' : `Bearer ${access_token}`
                }
            })
            .then(({data: {result}}) => {
                setLikedByUser(Boolean(result))
            })
            .catch(err => {
                console.log(err)
            })
        }
    }, [])

    const handleLike = () => {
        if(access_token){
            setLikedByUser(preVal => !preVal);

            !isLikedByUser ? total_likes ++  : total_likes --

            setBlog({...blog, activity: {...activity, total_likes}})

            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/like-blog", {_id, isLikedByUser}, {
                headers : {'Authorization' : `Bearer ${access_token}`}
            })
            .then(({data}) => {
                console.log(data);
            })
            .catch(err => {
                console.log(err)
            })
            
        } else {
            toast.error("Please sign in to like blogs")
        }
    }
    
    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard!")
        
    }

    return (
        <>
        <Toaster/>   
        <hr className="border-grey my-2"/>
        <div className="flex gap-6 justify-between">

            <div className="flex gap-3 items-center">

                <button 
                onClick={handleLike}
                className={"w-10 h-10 rounded-full flex items-center justify-center " +(isLikedByUser ? "bg-red/20 text-red" : "bg-grey/80") }>
                    <i className={"fi " + (isLikedByUser ?  "fi-sr-heart" : "fi-rr-heart") }></i>
                </button>
                <p className="text-xl text-dark-grey">{total_likes}</p>

                <button 
                onClick={() => setCommentsWrapper(preVal => !preVal)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                    <i className="fi fi-rr-comment-alt-dots"></i>
                </button>
                <p className="text-xl text-dark-grey">{total_comments}</p>
                 
            </div>

            <div className="flex gap-6 items-center">
                 
                
                <button onClick={copyLink} 
                className="w-10 h-10 rounded-full bg-grey/80">
                    <i className="text-xl fi fi-rr-share hover:text-dark-grey"/>
                </button>

                {
                    username == author_username ?
                    <Link to={`/editor/${blog_id}`} className={"btn-light rounded-md hover:text-dark-grey" + (hide ? " hidden" : "")}>Edit</Link> : ""
                }

                
            </div>
            

        </div>
        <hr className="border-grey my-2"/>
        </>
    )
}

export default BlogInteraction;
