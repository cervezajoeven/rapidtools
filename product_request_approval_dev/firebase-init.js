// ====================================================================
// Firebase Initialization
// ====================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAfcffroNPQiXxSZmk7ahUJ_5ez9eO3CCQ",
    authDomain: "rapidclean-ba9be.firebaseapp.com",
    projectId: "rapidclean-ba9be",
    storageBucket: "rapidclean-ba9be.firebasestorage.app",
    messagingSenderId: "39304689168",
    appId: "1:39304689168:web:19e9d73377df109270bc95",
    measurementId: "G-PLE91ET2H3"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  