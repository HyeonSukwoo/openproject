import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyCESNG3JMbn6fXloA9yLpHC4yEP_JRUehw",
    authDomain: "login-91dc0.firebaseapp.com",
    projectId: "login-91dc0",
    storageBucket: "login-91dc0.appspot.com",
    messagingSenderId: "819514840720",
    appId: "1:819514840720:web:cbd2cabc6f3ef756a9aa15",
    measurementId: "G-T5RPYQL526"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, collection, addDoc, onSnapshot, query, orderBy };