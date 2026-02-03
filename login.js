// login.js
let usuarioActual = null;

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    document.getElementById("loginError").innerText = "Debes completar todos los campos";
    return;
  }

  try {
    // Autenticación Firebase
    await auth.signInWithEmailAndPassword(email, password);

    // Obtener datos del usuario desde Firestore
    const snapshot = await db.collection("usuarios").where("email", "==", email).get();
    if (snapshot.empty) {
      document.getElementById("loginError").innerText = "Usuario no registrado";
      return;
    }

    usuarioActual = snapshot.docs[0].data();
    usuarioActual.id = snapshot.docs[0].id;

    // Guardar en localStorage para usarlo en otras páginas
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));

    // Redirigir al dashboard principal
    window.location.href = "index.html";

  } catch (error) {
    console.error(error);
    document.getElementById("loginError").innerText = "Correo o contraseña incorrecta";
  }
}
