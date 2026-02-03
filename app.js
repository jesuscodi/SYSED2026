// app.js
let usuarioActual = null;
let alumnos = [];
let maestros = [];

// Cargar usuario desde localStorage
window.onload = async function() {
  const user = localStorage.getItem("usuarioActual");
  if(!user) {
    window.location.href = "login.html";
    return;
  }
  usuarioActual = JSON.parse(user);
  document.getElementById("bienvenida").innerText = `Bienvenido, ${usuarioActual.nombre}`;

  if(usuarioActual.rol !== "admin") {
    document.getElementById("adminMenu").style.display = "none";
  }

  await cargarAlumnos();
  if(usuarioActual.rol === "admin") await cargarMaestros();
  mostrarDashboard();
};

// LOGOUT
function logout() {
  auth.signOut();
  localStorage.removeItem("usuarioActual");
  window.location.href = "login.html";
}

// SECCIONES
function mostrarDashboard() {
  document.getElementById("dashboardDiv").style.display = "block";
  document.getElementById("alumnosDiv").style.display = "none";
  document.getElementById("asistenciasDiv").style.display = "none";
  document.getElementById("maestrosDiv").style.display = "none";
  renderDashboard();
}

function mostrarAlumnos() {
  document.getElementById("dashboardDiv").style.display = "none";
  document.getElementById("alumnosDiv").style.display = "block";
  document.getElementById("asistenciasDiv").style.display = "none";
  document.getElementById("maestrosDiv").style.display = "none";
  llenarSelectEditar();
  mostrarListaAlumnos();
}

function mostrarAsistencias() {
  document.getElementById("dashboardDiv").style.display = "none";
  document.getElementById("alumnosDiv").style.display = "none";
  document.getElementById("asistenciasDiv").style.display = "block";
  document.getElementById("maestrosDiv").style.display = "none";
  renderAsistencias();
}

function mostrarMaestros() {
  document.getElementById("dashboardDiv").style.display = "none";
  document.getElementById("alumnosDiv").style.display = "none";
  document.getElementById("asistenciasDiv").style.display = "none";
  document.getElementById("maestrosDiv").style.display = "block";
  renderMaestros();
}

// CARGAR ALUMNOS
async function cargarAlumnos() {
  const snapshot = await db.collection("alumnos").get();
  let todos = snapshot.docs.map(d => ({id: d.id, ...d.data()}));

  alumnos = usuarioActual.rol === "admin" 
    ? todos 
    : todos.filter(a => a.aula_id === usuarioActual.aula_id);
}

// GUARDAR ALUMNO
async function guardarAlumno() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const aula = usuarioActual.rol==="admin" ? parseInt(document.getElementById("aulaAlumno").value) : usuarioActual.aula_id;
  const select = document.getElementById("editarAlumnoSelect");

  if(select.value === "") {
    await db.collection("alumnos").add({nombre, edad, aula_id: aula});
    alert("Alumno agregado");
  } else {
    await db.collection("alumnos").doc(select.value).update({nombre, edad, aula_id: aula});
    alert("Alumno actualizado");
  }

  await cargarAlumnos();
  llenarSelectEditar();
  mostrarListaAlumnos();
}

// LLENAR SELECT EDITAR
function llenarSelectEditar() {
  const select = document.getElementById("editarAlumnoSelect");
  select.innerHTML = "<option value=''>Nuevo Alumno</option>";
  alumnos.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.text = a.nombre;
    select.add(opt);
  });

  select.onchange = () => {
    const id = select.value;
    if(id === "") {
      document.getElementById("nombreAlumno").value = "";
      document.getElementById("edadAlumno").value = "";
    } else {
      const alum = alumnos.find(x => x.id===id);
      document.getElementById("nombreAlumno").value = alum.nombre;
      document.getElementById("edadAlumno").value = alum.edad;
    }
  };
}

// MOSTRAR LISTA DE ALUMNOS
function mostrarListaAlumnos() {
  const div = document.getElementById("listaAlumnos");
  div.innerHTML = "";
  alumnos.forEach(a => {
    const p = document.createElement("p");
    p.innerText = `Nombre: ${a.nombre}, Edad: ${a.edad}, Aula: ${a.aula_id}`;
    div.appendChild(p);
  });
}

// RENDER ASISTENCIAS
function renderAsistencias() {
  const div = document.getElementById("asistenciasLista");
  div.innerHTML = "";
  alumnos.forEach(a => {
    const row = document.createElement("div");
    row.className = "asistencia-row";
    row.innerHTML = `
      <span>${a.nombre}</span>
      <input type="checkbox" data-id="${a.id}">
    `;
    div.appendChild(row);
  });
}

// GUARDAR ASISTENCIAS
async function guardarAsistencias() {
  const fecha = document.getElementById("fechaAsistencia").value;
  if(!fecha) { alert("Selecciona una fecha"); return; }

  const checkboxes = document.querySelectorAll("#asistenciasLista input[type=checkbox]");
  for(const cb of checkboxes){
    const id = cb.dataset.id;
    const asistio = cb.checked;
    await db.collection("asistencias").add({alumno_id: id, fecha, asistio});
  }
  alert("Asistencias guardadas");
}

// ADMIN: CARGAR MAESTROS
async function cargarMaestros() {
  const snapshot = await db.collection("usuarios").get();
  maestros = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
}

// RENDER MAESTROS
function renderMaestros() {
  const div = document.getElementById("maestrosLista");
  div.innerHTML = "";
  maestros.forEach(m => {
    const p = document.createElement("p");
    p.innerText = `Nombre: ${m.nombre}, Email: ${m.email}, Aula: ${m.aula_id}, Rol: ${m.rol}`;
    div.appendChild(p);
  });
}

// DASHBOARD
function renderDashboard() {
  const div = document.getElementById("dashboardCards");
  div.innerHTML = "";
  const totalAlumnos = alumnos.length;
  const totalAsistencias = "Función por implementar"; // Puedes agregar lógica de asistencias
  const card1 = `<div class="card">Total Alumnos: ${totalAlumnos}</div>`;
  const card2 = `<div class="card">Total Asistencias: ${totalAsistencias}</div>`;
  div.innerHTML = card1 + card2;
}
