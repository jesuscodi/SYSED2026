// Configura tu proyecto de Firebase aquí
const firebaseConfig = {
  apiKey: "AIzaSyDNd6f8zriP3U-1-zLTD0e_c45H73lEg1o",
  authDomain: "escueladominicalreydereyes.firebaseapp.com",
  projectId: "escueladominicalreydereyes",
  storageBucket: "escueladominicalreydereyes.firebasestorage.app",
  messagingSenderId: "891424130656",
  appId: "1:891424130656:web:8b0e92dd4cf00ab40ce505"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
