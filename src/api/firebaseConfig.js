// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwXRs12Y-ZnUNcBPUfQ0Xgqx0rSVXO-Pg",
    authDomain: "studysync-3435a.firebaseapp.com",
    projectId: "studysync-3435a",
    storageBucket: "studysync-3435a.firebasestorage.app",
    messagingSenderId: "357180478046",
    appId: "1:357180478046:web:efeb20e045098dff051acf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export { auth };
