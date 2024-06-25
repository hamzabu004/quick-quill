import axios from "axios";

const uploadImage = async (img) => {

    let imgUrl = null;
    console.log(await axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/get-upload-url"))
    await axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/get-upload-url")
    .then( async ({data : {uploadURL}}) => {
        console.log('hi')
        console.log(uploadURL)
        await axios({
            method:'PUT',
            url:uploadURL,
            headers: {'Content-Type':"multipart/form-data"},
            data: img
        })
        .then(() => {
            imgUrl = uploadURL.split("?")[0]
        })
        
    } )
    
    return imgUrl;
}

export default uploadImage