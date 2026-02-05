import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection, addDoc, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let usuario = null;
let alumnos = [];

// LOGIN
window.login = async function () {
  try {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    await signInWithEmailAndPassword(auth, email, pass);
    window.location = "index.html";
  } catch {
    document.getElementById("loginError").innerText = "Credenciales incorrectas";
  }
};

// LOGOUT
window.logout = async function () {
  await signOut(auth);
  window.location = "login.html";
};

// ALUMNOS
window.guardarAlumno = async function () {
  const nombre = nombreAlumno.value;
  const edad = edadAlumno.value;

  await addDoc(collection(db, "alumnos"), {
    nombre,
    edad
  });
  cargarAlumnos();
};

async function cargarAlumnos() {
  listaAlumnos.innerHTML = "";
  const snap = await getDocs(collection(db, "alumnos"));
  alumnos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  alumnos.forEach(a => {
    listaAlumnos.innerHTML += `<p>${a.nombre} (${a.edad})</p>`;
  });
}

// ASISTENCIA
window.guardarAsistencia = async function () {
  const fecha = document.getElementById("fecha").value;
  for (let a of alumnos) {
    const check = document.getElementById("a_" + a.id);
    await addDoc(collection(db, "asistencias"), {
      alumno: a.nombre,
      fecha,
      asistio: check.checked
    });
  }
  alert("Asistencia guardada");
};

window.verAsistencias = function () {
  listaAsistencia.innerHTML = "";
  alumnos.forEach(a => {
    listaAsistencia.innerHTML += `
      <label>
        <input type="checkbox" id="a_${a.id}">
        ${a.nombre}
      </label><br>`;
  });
};

// MAESTROS (ADMIN)
window.crearMaestro = async function () {
  await addDoc(collection(db, "maestros"), {
    nombre: nombreMaestro.value,
    email: emailMaestro.value
  });
  alert("Maestro creado");
};

window.verDashboard = function () {
  dashboard.classList.remove("hidden");
  alumnos.classList.add("hidden");
  asistencias.classList.add("hidden");
};

window.verAlumnos = function () {
  dashboard.classList.add("hidden");
  alumnos.classList.remove("hidden");
  asistencias.classList.add("hidden");
  cargarAlumnos();
};
