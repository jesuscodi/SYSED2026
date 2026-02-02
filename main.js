// 🔹 Configuración Firebase
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

let usuarioActual = null;
let alumnos = [];

// 🔹 LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    const doc = await db.collection("usuarios").doc(uid).get();
    usuarioActual = doc.data();

    document.getElementById("loginDiv").style.display = "none";
    document.getElementById("appDiv").style.display = "block";
    document.getElementById("welcome").innerText = `Bienvenido, ${usuarioActual.nombre}`;

    cargarAlumnos();
  } catch(e) {
    document.getElementById("loginError").innerText = "Correo o clave incorrecta";
  }
}

function logout() {
  auth.signOut();
  usuarioActual = null;
  document.getElementById("appDiv").style.display = "none";
  document.getElementById("loginDiv").style.display = "block";
}

// 🔹 ALUMNOS
async function cargarAlumnos() {
  const snapshot = await db.collection("alumnos").get();
  alumnos = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
  llenarSelectAlumnos();
}

function llenarSelectAlumnos() {
  const select = document.getElementById("alumnoSelect");
  select.innerHTML = "";
  const lista = usuarioActual.aula_id == 0 ? alumnos : alumnos.filter(a => a.aula_id == usuarioActual.aula_id);
  lista.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.text = a.nombre;
    select.add(opt);
  });
}

// 🔹 AGREGAR ALUMNO
function mostrarAgregarAlumno() {
  document.getElementById("agregarAlumnoDiv").style.display = "block";
  document.getElementById("asistenciaDiv").style.display = "none";
}

async function agregarAlumnoUI() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const aula = document.getElementById("aulaAlumno").value;

  const doc = await db.collection("alumnos").add({nombre, edad, aula_id: aula});
  alert("Alumno agregado");
  cargarAlumnos();
}

// 🔹 REGISTRAR ASISTENCIA
function mostrarAsistencia() {
  document.getElementById("agregarAlumnoDiv").style.display = "none";
  document.getElementById("asistenciaDiv").style.display = "block";
  llenarSelectAlumnos();
}

async function registrarAsistenciaUI() {
  const id = document.getElementById("alumnoSelect").value;
  const asistio = document.getElementById("asistioCheck").checked;
  const fecha = new Date().toISOString().slice(0,10);

  await db.collection("asistencias").add({
    alumno_id: id,
    fecha,
    asistio
  });

  alert("Asistencia registrada");
}
