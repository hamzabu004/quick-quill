import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import { Toaster, toast } from "react-hot-toast";
import { useContext, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";


const BlogStats = ({stats}) => {
    return (
        <div className="flex gap-2 max-lg:mb-6 max-lg:pb-6 border-grey max-lg:border-b ">
            {
                Object.keys(stats).map((key, i) => {
                    
                    let oneCheck = stats[key] == 1;
                    let strLength = key.split("_")[1].length
                    let newKey = key.split("_")[1]
                    newKey == 'reads' ? newKey='views' : newKey = newKey
                    return !key.includes("parent") ?  
                    <div key={i} className={"flex flex-col items-center w-full h-full justify-center p-4 px-6 "+ (i!= 0 ? "border-grey border-l" : "")}>
                        <h1 className="text-xl lg:text-2xl mb-2">{stats[key].toLocaleString()}</h1>
                        <p className="max-lg:text-dark-grey capitalize">{!oneCheck ? newKey: newKey.substring(0, strLength-1)}</p>
                    </div> : ""
                })
            }
        </div>
    )
}

const deleteToast = ({type, blog, access_token, target}) =>{
    toast.custom(() => (
        <div
          className={"max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5"}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
              <i className="fi fi-ss-triangle-warning h-10 w-10 rounded-full"></i>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Warning
                </p>
                {type=="blog" ? <p className="mt-1 text-sm text-grey-500">
                  Deleting a blog is permanent and cannot be undone! Are you sure you want to delete?
                </p> : <p className="mt-1 text-sm text-grey-500">
                  Deleting a draft is permanent and cannot be undone! Are you sure you want to delete?
                </p>}
                
              </div>
            </div>
          </div>
          <div className="flex">
            <button
              onClick={() => deleteBlog(blog, access_token, target)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-red"
            >
              Delete Forever
            </button>
          </div>
        </div>
      ))
}

export const ManageBlogCard = ({blog}) => {

    let {banner, blog_id, title, publishedAt, activity} = blog;

    let {userAuth : {access_token}} = useContext(UserContext);

    let [showStats, setShowStats] = useState(false);

    return (
        <>  
            <Toaster />
            <div className="flex gap-10 border-b mb-6 max-md:px-4 border-grey pb-6 items-center">
                <img className="max-md:hidden lg:hidden xl:block w-28 h-28 flex-none bg-grey object-cover rounded-md" src={banner}/>

                <div className="flex flex-col justify-between py-2 w-full min-w-[300px]">
                    <div>
                        <Link to={`/blogs/${blog_id}`} className="blog-title mb-4 hover:underline">{title}</Link>

                        <p className="line-clamp-1">Published on {getDay(publishedAt)}</p>
                    </div>
                    <div className="flex gap-6 mt-3">
                        <Link className="pr-4 py-2 underline" to={`/editor/${blog_id}`}>
                            Edit
                        </Link>

                        <button onClick={() => setShowStats(preVal => !preVal)} className="lg:hidden pr-4 py-2 underline">
                            Insights
                        </button>

                        <button onClick={(e) => deleteToast({type: "blog", blog, access_token, target:e.target})} className="pr-4 py-2 underline text-red">
                            Delete
                        </button>
                    </div>

                </div>
                <div className="max-lg:hidden">
                    <BlogStats stats={activity}/>

                </div>
            </div>
            {
                showStats ? 
                <div>
                    <BlogStats stats={activity}/>
                </div> : ""
            }
        </>
    )
}

export const ManageDraftCard = ({blog}) => {

    let {banner, blog_id, title, publishedAt, activity, des, index} = blog;

    let {userAuth : {access_token}} = useContext(UserContext);

    index++;

    return (
       <div className="flex gap-5 lg:gap-10 pb-5 border-b mb-5 border-grey">
            <h1 className="blog-index text-center pl-4 md:pl-6 flex-none">
               {index < 10 ? "0" + index : index} 
            </h1>
            <div>
                <h1 className="blog-title mb-3">{title}</h1>

                <p className="-mt-5 line-clamp-2 font-gelasio">
                    {des.length ? des : "No Description"}
                </p>

                <div className="flex gap-6 mt-3">
                    <Link className="pr-4 py-2 underline" to={`/editor/${blog_id}`}>
                        Edit
                    </Link>

                    <button onClick={(e) => deleteToast({type: "draft", blog, access_token, target: e.target})} className="pr-4 py-2 underline text-red">
                            Delete
                    </button>
                </div>

            </div>
       </div>
    )
}

const deleteBlog = (blog, access_token, target) => {

    let {index, blog_id, setStateFunc} = blog;

    target.setAttribute("disabled", true);

    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/delete-blog", {blog_id}, {
        headers : {
            'Authorization' : `Bearer ${access_token}`
        }
        
    })
    .then(({data}) => {
        target.removeAttribute("disabled")
        toast.success("Blog deleted successfully")
        setStateFunc(preVal => {
            let {deletedDocCount, totalDocs, results} = preVal;

            results.splice(index, 1);

            if(!deletedDocCount){
                deletedDocCount = 0;
            }

            if(!results.length && totalDocs - 1 > 0){
                return null;
            }
            return {...preVal, totalDocs: totalDocs-1, deletedDocCount : deletedDocCount + 1}
        })
    })
    .catch(err =>{
        console.log(err)
    })

}