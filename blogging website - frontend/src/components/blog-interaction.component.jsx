import { useContext } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import {Toaster, toast} from 'react-hot-toast';
import { UserContext } from "../App"

const BlogInteraction = ({blog, hide=false}) => {

    let { blog: {title, blog_id, activity, activity : {total_likes, total_comments}, author, author: {personal_info : {username: author_username}}}, setBlog } = useContext(BlogContext)

    let { userAuth : {username} } = useContext(UserContext)
    
    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard!")
        
    }

    return (
        <>
        <hr className="border-grey my-2"/>
        <div className="flex gap-6 justify-between">

            <div className="flex gap-3 items-center">

                <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                    <i className="fi fi-rr-heart"></i>
                </button>
                <p className="text-xl text-dark-grey">{total_likes}</p>

                <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                    <i className="fi fi-rr-comment-alt-dots"></i>
                </button>
                <p className="text-xl text-dark-grey">{total_comments}</p>
                 
            </div>

            <div className="flex gap-6 items-center">
                <Toaster/>    
                
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
