import { useEffect, useState } from "react"
import AnimationWrapper from "../common/page-animation"
import InPageNavigation from "../components/inpage-navigation.component"
import axios from "axios"
import Loader from "../components/loader.component"
import BlogPostCard from "../components/blog-post.component"
import MinimalBlogPost from "../components/nobanner-blog-post.component"
import { activeTabLineRef, activeTabRef } from "../components/inpage-navigation.component"
import NoDataMessage from "../components/nodata.component"


const HomePage = () => {

    let [blogs, setBlog] = useState(null);
    let [trendingBlogs, setTrendingBlog] = useState(null);
    let [pageState, setPageState] = useState("home");

    let categories = ["Tech", "Pop Culture", "Social Media", "Finance", "Sports", "Music", "Nature", "Travel"]

    const fetchLatestBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs")
        .then(({data}) =>{
            setBlog(data.blogs);
        })
        .catch(err => {
            console.log(err);
        })
    }

    const fetchTrendingBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
        .then(({data}) =>{
            setTrendingBlog(data.blogs);
        })
        .catch(err => {
            console.log(err);
        })
    }

    const fetchCategoryBlogs = () => {
        console.log('fetching...')
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {tag:pageState})
        .then(({data}) =>{
            setBlog(data.blogs);
        })
        .catch(err => {
            console.log(err);
        })
    }

    const loadBlogbyCategory = (e) =>{

        
        let category = e.target.innerText;

        setBlog(null);
        if(pageState == category){
            setPageState("home");
            return;
        }
        setPageState(category);
    }

    useEffect(() => {

        activeTabRef.current.click();
        if(pageState=="home"){
            fetchLatestBlogs();
        }else{
            fetchCategoryBlogs();
        }
        if(!trendingBlogs) {
        fetchTrendingBlogs();
        }
    }, [pageState])

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                <div className="w-full">
                    <InPageNavigation routes={[pageState, "trending blogs"]} defaultHidden={["trending blogs"]}>
                        <>
                            {
                                blogs == null ? <Loader />: (
                                blogs.length ?
                                blogs.map((blog, i) => {
                                    return (<AnimationWrapper key={i} transition={{duration:1, delay:i*.1}}>
                                        <BlogPostCard content={blog} author={blog.author.personal_info}/>
                                    </AnimationWrapper>)
                                }) : <NoDataMessage message={"No blogs under this category at the moment :("} secondary="Write the first one!"/>
                            )}
                        </>
                        {
                                trendingBlogs == null ? <Loader />: (
                                trendingBlogs.length ?
                                trendingBlogs.map((blog, i) => {
                                    return (<AnimationWrapper key={i} transition={{duration:1, delay:i*.1}}>
                                        <MinimalBlogPost blog={blog} index={i}/>
                                    </AnimationWrapper>) 
                                }) :
                                <NoDataMessage message={"No trending blogs at the moment :("}/> 
                            )}
                    </InPageNavigation>
                </div>
                
                <div className="min-w-[30%] lg:min-w[300px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8 ">Filter what you're looking for!</h1>
                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) =>{
                                        return (
                                        <button onClick={loadBlogbyCategory} className={"tag " + (pageState == category ? " bg-black text-white" : "")} key={i}>
                                            {category}
                                        </button>
                                        );
                                    })
                                }
                            </div>
                        </div>

                    <div>
                        <h1 className="font-medium text-xl mb-8">
                            Trending Posts <i className="fi fi-rs-flame"></i>
                        </h1>

                        {
                                trendingBlogs == null ? <Loader />: (
                                trendingBlogs.length ?
                                trendingBlogs.map((blog, i) => {
                                    return (<AnimationWrapper key={i} transition={{duration:1, delay:i*.1}}>
                                        <MinimalBlogPost blog={blog} index={i}/>
                                    </AnimationWrapper>) 
                                }) :
                                <NoDataMessage message={"No trending blogs at the moment :("}/> 
                            )}

                    </div>
                    </div>
                </div>

            </section>

        </AnimationWrapper>
    )
}

export default HomePage