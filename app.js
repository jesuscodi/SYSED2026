// app.js
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Login exitoso
        console.log("Usuario conectado:", userCredential.user.email);
        window.location.href = "dashboard.html"; // Redirige a dashboard
    } catch (error) {
        console.error(error);
        errorMsg.textContent = "Correo o contraseña incorrectos";
    }
});
