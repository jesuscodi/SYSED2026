// app.js

const db = firebase.firestore();

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error");

    try {
        // Iniciar sesión
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Obtener rol del usuario
        const doc = await db.collection("usuarios").doc(user.uid).get();
        if (!doc.exists) throw new Error("Usuario no encontrado en la base de datos");

        const data = doc.data();
        if (data.rol === "admin") {
            window.location.href = "dashboard.html?rol=admin";
        } else if (data.rol === "maestro") {
            window.location.href = "dashboard.html?rol=maestro";
        } else {
            throw new Error("Rol no definido para este usuario");
        }

    } catch (error) {
        console.error(error);
        errorMsg.textContent = error.message;
    }
}
