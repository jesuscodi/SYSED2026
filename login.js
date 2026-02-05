// login.js
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const btn = document.getElementById("btnLogin");
const msg = document.getElementById("mensaje");

btn.addEventListener("click", async () => {
    const email = email.value;
    const password = password.value;

    if (!email || !password) {
        msg.textContent = "Completa todos los campos";
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "dashboard.html";
    } catch (e) {
        msg.textContent = "Correo o contraseña incorrectos";
    }
});
