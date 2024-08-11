import { Link } from "react-router-dom"
import { getDay } from "../common/date"

const MinimalBlogPost = ({blog, index}) => {
    
    let { title, blog_id:id, tags, author : {personal_info : {fullname, username, profile_img}}, publishedAt } = blog
    
    return (
        <Link to={`/blogs/${id}`} className="flex gap-5 mb-8">
            <h1 className="blog-index">{index<10 ? "0"+ (index+1): index}</h1>

            <div>
                <div className="flex gap-2 items-center mb-7">
                    <img src={profile_img} className="w-6 h-6 rounded-full"/>
                    <p className="line-clamp-1 capitalize max-sm:hidden">{fullname}</p>
                    <p className="min-w-fit">@{username}</p>
                    <p className="min-w-fit">{getDay(publishedAt)}</p>
                </div>

                <h1 className="blog-title">{title}</h1>
                <div className="-translate-y-8 gap-4 mt-7">
                <span className="btn-light py-1 px-4 mx-1">{tags[0]}</span>
            </div>
            </div>
            
        
        </Link>
    )
}

export default MinimalBlogPost