import Embed from "@editorjs/embed"
import List from "@editorjs/list"
import Image from "@editorjs/image"
import Header from "@editorjs/header"
import Quote from "@editorjs/quote"
import Marker from "@editorjs/marker"
import InlineCode from "@editorjs/inline-code"
import uploadImage from "../common/aws"


const uploadByURL = (e) => {

    let link = new Promise((resolve, reject) => {
        try {
            resolve(e)
        }
        catch(err){
            reject(er)
        }
    })

    return link.then(url => {
        return {
            success : 1,
            file: {url}
        }
    })

}

const uploadByFile = (e) => {
    return uploadImage(e).then(url => {
        if(url){
            return {
                success : 1,
                file: {url}
            }
        }
    })
}

const tools = {
    embed: Embed,
    list: {
        class: List,
        inlineToolbar: true
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadByURL,
                uploadByFile : uploadByFile
            }
        }
    },
    header: {
        class: Header,
        config : {
            placeholder: "Heading",
            levels: [2,3],
            defaultLevel: 2

        }
    },
    quote: {
        class: Quote,
        inlineToolbar: true
    },
    marker: Marker,
    inlineCode: InlineCode
}

export default tools