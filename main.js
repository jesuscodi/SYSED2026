let usuarioActual = null;
let alumnos = [];

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    const snapshot = await db.collection("usuarios").where("email","==",email).get();
    usuarioActual = snapshot.docs[0].data();
    usuarioActual.id = snapshot.docs[0].id;

    document.querySelector(".login-container").style.display = "none";
    document.getElementById("app").style.display = "flex";

    cargarAlumnos();
    mostrarSeccion("dashboard");
  } catch(e) {
    document.getElementById("loginError").innerText = "Correo o clave incorrecta";
  }
}

function logout() {
  auth.signOut();
  usuarioActual = null;
  document.getElementById("app").style.display = "none";
  document.querySelector(".login-container").style.display = "block";
}

function mostrarSeccion(id) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}
