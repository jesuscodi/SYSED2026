import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { doc, setDoc }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const msg = document.getElementById("mensaje");

// LOGIN
document.getElementById("btnLogin").onclick = async () => {
    try {
        await signInWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );
        window.location.href = "dashboard.html";
    } catch (e) {
        msg.textContent = "Error al ingresar";
    }
};

// REGISTRO
document.getElementById("btnRegistro").onclick = async () => {
    try {
        const cred = await createUserWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );

        // Guardar datos en Firestore
        await setDoc(doc(db, "usuarios", cred.user.uid), {
            email: email.value,
            rol: rol.value,
            fecha: new Date()
        });

        msg.textContent = "Usuario creado correctamente";
    } catch (e) {
        msg.textContent = "Error al crear usuario";
    }
};
