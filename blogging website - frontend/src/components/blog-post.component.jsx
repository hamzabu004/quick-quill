import { getDay } from "../common/date";
import {Link} from "react-router-dom"

const BlogPostCard = ({content, author}) => {

    let {publishedAt, tags, title, des, banner, activity: {total_likes}, blog_id:id} = content;
    let { fullname, username, profile_img} = author;

    return (
        <Link to={`/blogs/${id}`} className="flex gap-8 items-center border-b border-grey pb-5 mb-4 ">
            <div className="w-full">

                <div className="flex gap-2 items-center mb-7">

                    <img src={profile_img} className="w-6 h-6 rounded-full"/>

                    <p className="line-clamp-1 capitalize max-sm:hidden">{fullname}</p>
                    <p className="min-w-fit">@{username}</p>
                    <p className="min-w-fit">{getDay(publishedAt)}</p>

                </div>

                <h1 className="blog-title">{title}</h1>

                <p className="my-3 text-xl font-gelasio leading-7 max-sm:hidden line-clamp-2 -translate-y-8">{des}</p>

                <div className="-translate-y-8 flex gap-4 mt-7">
                    <span className="btn-light py-1 px-4 mx-1">{tags[0]}</span>
                    
                    {
                        tags.slice(1).map((tag, i=1) => {
                            return (
                                <span className="btn-light py-1 px-4 mx-1 max-sm:hidden">{tag}</span>
                            )
                        })
                    }
                    
                    <span className="ml-3 flex items-center gap-2 text-dark-grey">
                        <i className="fi fi-rr-heart text-xl"/>
                        {total_likes}
                    </span>

                </div>

            </div>
            
            <div className="h-28 aspect-square bg-grey rounded-full">
                <img src={banner} className="w-full h-full object-cover rounded-lg"/>
            </div>

        </Link>
    )
}

export default BlogPostCard