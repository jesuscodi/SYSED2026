let usuarioActual = null;
let alumnos = [];
let asistenciasHoy = [];

/* ===================== LOGIN ===================== */
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);

    const snap = await db
      .collection("usuarios")
      .where("email", "==", email)
      .get();

    if (snap.empty) {
      alert("No tienes perfil en Firestore");
      return;
    }

    usuarioActual = { id: snap.docs[0].id, ...snap.docs[0].data() };

    document.getElementById("loginDiv").style.display = "none";
    document.getElementById("appDiv").style.display = "flex";

    document.getElementById("welcome").innerText =
      `Bienvenido, ${usuarioActual.nombre}`;

    document.getElementById("miAula").innerText =
      usuarioActual.rol === "admin" ? "Todas" : usuarioActual.aula_id;

    cargarAlumnos();
    mostrarSeccion("dashboard");
  } catch (e) {
    document.getElementById("loginError").innerText =
      "Correo o contraseña incorrecta";
  }
}

/* ===================== LOGOUT ===================== */
function logout() {
  auth.signOut();
  location.reload();
}

/* ===================== SECCIONES ===================== */
function mostrarSeccion(id) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}

/* ===================== ALUMNOS ===================== */
async function cargarAlumnos() {
  const snap = await db.collection("alumnos").get();
  let todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  alumnos = usuarioActual.rol === "admin"
    ? todos
    : todos.filter(a => a.aula_id == usuarioActual.aula_id);

  renderTablaAlumnos();
  renderTablaAsistencia();
  actualizarDashboard();
}

function renderTablaAlumnos() {
  const tbody = document.getElementById("tablaAlumnos");
  tbody.innerHTML = "";

  alumnos.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.nombre}</td>
      <td>${a.edad}</td>
      <td>${a.aula_id}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ===================== GUARDAR ALUMNO ===================== */
async function guardarAlumno() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const aula = usuarioActual.rol === "admin"
    ? parseInt(document.getElementById("aulaAlumno").value)
    : usuarioActual.aula_id;

  if (!nombre || !edad) {
    alert("Complete los campos");
    return;
  }

  await db.collection("alumnos").add({
    nombre,
    edad,
    aula_id: aula,
    creado_por: usuarioActual.nombre
  });

  document.getElementById("nombreAlumno").value = "";
  document.getElementById("edadAlumno").value = "";

  cargarAlumnos();
}

/* ===================== ASISTENCIA ===================== */
function renderTablaAsistencia() {
  const tbody = document.getElementById("tablaAsistencia");
  tbody.innerHTML = "";
  asistenciasHoy = [];

  alumnos.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.nombre}</td>
      <td>
        <input type="checkbox" onchange="marcarAsistencia('${a.id}', this.checked)">
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function marcarAsistencia(idAlumno, asistio) {
  const index = asistenciasHoy.findIndex(a => a.alumno_id === idAlumno);
  if (index >= 0) {
    asistenciasHoy[index].asistio = asistio;
  } else {
    asistenciasHoy.push({ alumno_id: idAlumno, asistio });
  }
}

async function guardarAsistencias() {
  const fecha = new Date().toISOString().slice(0, 10);

  for (let a of asistenciasHoy) {
    await db.collection("asistencias").add({
      alumno_id: a.alumno_id,
      asistio: a.asistio,
      fecha,
      aula_id: usuarioActual.aula_id,
      registrado_por: usuarioActual.nombre
    });
  }

  alert("Asistencia guardada");
}

/* ===================== DASHBOARD ===================== */
async function actualizarDashboard() {
  document.getElementById("totalAlumnos").innerText = alumnos.length;

  const snap = await db.collection("asistencias").get();
  let asistencias = snap.docs.map(d => d.data());

  if (usuarioActual.rol !== "admin") {
    asistencias = asistencias.filter(a => a.aula_id == usuarioActual.aula_id);
  }

  document.getElementById("totalAsistencias").innerText = asistencias.length;
}
