// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {GoogleAuthProvider, getAuth, signInWithPopup} from "firebase/auth"


const firebaseConfig = {
  apiKey: "AIzaSyAmFDMEOV96otcEIm_S2cCPGfqqRb2Md-Y",
  authDomain: "blogging-website-88ff8.firebaseapp.com",
  projectId: "blogging-website-88ff8",
  storageBucket: "blogging-website-88ff8.appspot.com",
  messagingSenderId: "58904808482",
  appId: "1:58904808482:web:fc48f08b2d469342c6ce7b",
  measurementId: "G-YKGYXBR3V9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();

const auth = getAuth();

const authWithGoogle = async () => {
    
    let user = null;

    await signInWithPopup(auth, provider).then((result) => {
        user = result.user
    })


    return user;
    


}