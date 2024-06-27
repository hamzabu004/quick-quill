import { useContext } from "react"
import { UserContext } from "../App"
import { Navigate } from "react-router-dom"
import { useState } from "react"
import BlogEditor from "../components/blog-editor.component"
import PublishForm from "../components/publish-form.component"
import { createContext } from "react"

export const EditorContext = createContext({});

const blogStructure = {
    title:'',
    banner:'',
    content:[],
    tags:[],
    desc:'',
    author : {
        personal_info: {}
    }
}
const Editor = () => {
    const [ editorState, setEditorState] = useState("editor");
    const [textEditor, setTextEditor] = useState({isReady: false});
    const [blog, setBlog] = useState(blogStructure);
    

    let { userAuth : { access_token }} = useContext(UserContext)

    return (
        <EditorContext.Provider value={{blog, setBlog, editorState, setEditorState, textEditor, setTextEditor}}>
            {
                
                access_token == null ? <Navigate to="/signin"></Navigate> 
                :editorState == "editor" ? <BlogEditor/> : <PublishForm/>
            }
        </EditorContext.Provider>
        
       
       
    )

}

export default Editor