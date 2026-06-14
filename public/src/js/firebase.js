// src/js/firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyAME4iXR6U1snGQIugOkk7GCc55W_Zl0T8",
    authDomain: "floriculturaweb.firebaseapp.com",
    projectId: "floriculturaweb",
    storageBucket: "floriculturaweb.appspot.com",
    messagingSenderId: "217126481556",
    appId: "1:217126481556:web:2f0322392775ac70dfce81"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Variáveis globais
window.auth = firebase.auth();
window.db = firebase.firestore();

console.log("✅ Firebase inicializado");