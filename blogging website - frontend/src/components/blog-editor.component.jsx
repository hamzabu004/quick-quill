import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { useContext, useEffect } from "react";
import uploadImage from "../common/aws";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS  from "@editorjs/editorjs";
import tools from "./tools.component"


const BlogEditor = () => {

    
    let { blog, blog : { title, banner, content, tags, des}, setBlog, textEditor, setTextEditor, setEditorState} = useContext(EditorContext)
    

    //useEffect
    useEffect(() =>{
        setTextEditor(
        new EditorJS({
            holderId: "textEditor", 
            data:"", 
            placeholder:"Start writing your blog here!",
            tools: tools
        }))
    }, [])

    const handleBannerUpload = (e) => {
        let img = e.target.files[0];
        if (img) {


            let loadingToast = toast.loading("Uploading banner...")

            uploadImage(img).then((url) => {
                if(url){


                    toast.dismiss(loadingToast);
                    toast.success("Uploaded")
                    


                    setBlog({...blog, banner:url})
                }
            })
            .catch(err => {
                toast.dismiss(loadingToast);
                return toast.error(err);
            })
        }
    }


    const handleTitleDown = (e) => {
        if (e.keyCode == 13) { //enter key
            e.preventDefault();
        }
    }


    const handleTitleChange = (e) => {
        let input = e.target;

        input.style.height = 'auto';
        input.style.height = input.scrollHeight + "px";

        setBlog({ ...blog, title:input.value })
        }
    

    const handleBannerError = (e) => {
        let img = e.target;
        img.src = defaultBanner
    }

    const handlePublishEvent = () =>{
        if(!banner.length ) {
            return toast.error("Please upload a blog banner before publishing")
        }
        if(!title.length){
            return toast.error("Please enter a blog title before publishing")
        }
        if(!title.length){
            return toast.error("Please enter a blog title before publishing")
        }
        if(textEditor.isReady){
            textEditor.save().then(data => {
                if(data.blocks.length){
                    setBlog({...blog, content:data});
                    setEditorState("publish");
                } else {
                    return toast.error("You can't publish an empty blog!")
                }
            })
            .catch((err) => {
                console.log(err)
            })
        }
    }

    return (
        <>
            <nav className="navbar">
            <Link to="/" className="flex-none w-10">
                <img src={logo}/>
            </Link>
            <p className="max-md:hidden text-black line-clamp-1 w-full">
                {title.length ? title : "New Blog"}
            </p>

            <div className="flex gap-4 ml-auto">
                <button className="btn-dark py-2 " onClick={handlePublishEvent}>
                    Publish
                </button>
                <button className="btn-light py-2">
                    Save Draft
                </button>
            </div>
            
            </nav>
            <Toaster/>
            <AnimationWrapper>
                <section>
                    <div className="mx-auto max-w[900px] w-full">
                        <div className="relative aspect-video bg-white border-4 border-grey hover:opacity-80">
                            <label htmlFor="uploadBanner">
                                <img src={banner} className="z-20" onError={handleBannerError}/>
                                <input 
                                id="uploadBanner" type="file" accept=".png, .jpg, .jpeg" hidden onChange={handleBannerUpload}
                                />
                            </label>
                        </div>

                    <textarea placeholder="Blog Title" className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40" onKeyDown={handleTitleDown} onChange={handleTitleChange} >

                    </textarea>
                    
                    <hr className="w-full opacity-20 my-3"/>

                    <div id="textEditor" className="font-roboto"></div>


                    </div>
                </section>
            </AnimationWrapper>

        </>
        


    )
}
export default BlogEditor