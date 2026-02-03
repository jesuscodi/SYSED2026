let usuarioActual = null;
let alumnos = [];
let asistenciasTemp = [];

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    const snapshot = await db.collection("usuarios").where("email","==",email).get();
    if(snapshot.empty) throw "No existe usuario";

    usuarioActual = snapshot.docs[0].data();

    document.getElementById("loginDiv").style.display = "none";
    document.getElementById("appDiv").style.display = "flex";
    document.getElementById("welcome").innerText = `Bienvenido, ${usuarioActual.nombre}`;

    cargarAlumnos();
    actualizarDashboard();
  } catch(e) {
    document.getElementById("loginError").innerText = "Correo o clave incorrecta";
    console.log(e);
  }
}

// ================= LOGOUT =================
function logout() {
  auth.signOut();
  usuarioActual = null;
  document.getElementById("appDiv").style.display = "none";
  document.getElementById("loginDiv").style.display = "block";
}

// ================= SECCIONES =================
function mostrarSeccion(id) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}

// ================= ALUMNOS =================
async function cargarAlumnos() {
  const snapshot = await db.collection("alumnos").get();
  let todosAlumnos = snapshot.docs.map(d => ({id: d.id, ...d.data()}));

  alumnos = usuarioActual.rol === "admin" 
            ? todosAlumnos 
            : todosAlumnos.filter(a => a.aula_id == usuarioActual.aula_id);

  mostrarTablaAlumnos();
  mostrarTablaAsistencia();
}

function mostrarTablaAlumnos() {
  const tbody = document.getElementById("tablaAlumnos");
  tbody.innerHTML = "";
  alumnos.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${a.nombre}</td><td>${a.edad}</td><td>${a.aula_id}</td>`;
    tbody.appendChild(tr);
  });
}

// ================= GUARDAR ALUMNO =================
async function guardarAlumno() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const aula_id = parseInt(document.getElementById("aulaAlumno").value);

  await db.collection("alumnos").add({nombre, edad, aula_id, registrado_por: usuarioActual.nombre});
  document.getElementById("nombreAlumno").value = "";
  document.getElementById("edadAlumno").value = "";
  cargarAlumnos();
}

// ================= ASISTENCIAS =================
function mostrarTablaAsistencia() {
  const tbody = document.getElementById("tablaAsistencia");
  tbody.innerHTML = "";
  asistenciasTemp = [];

  alumnos.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${a.nombre}</td><td><input type="checkbox" data-id="${a.id}"></td>`;
    tbody.appendChild(tr);
  });
}

async function guardarAsistencias() {
  const checkboxes = document.querySelectorAll("#tablaAsistencia input[type=checkbox]");
  const fecha = new Date().toISOString().slice(0,10);

  for(let cb of checkboxes) {
    const id_alumno = cb.dataset.id;
    const asistio = cb.checked;

    await db.collection("asistencias").add({alumno_id: id_alumno, fecha, asistio, registrado_por: usuarioActual.nombre});
  }

  alert("Asistencias registradas");
  cargarAlumnos();
}

// ================= DASHBOARD =================
async function actualizarDashboard() {
  document.getElementById("totalAlumnos").innerText = alumnos.length;

  const snapshot = await db.collection("asistencias").get();
  document.getElementById("totalAsistencias").innerText = snapshot.size;

  document.getElementById("miAula").innerText = usuarioActual.aula_id ? usuarioActual.aula_id : "Admin";
}
