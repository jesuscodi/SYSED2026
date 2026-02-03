let usuarioActual = null;
let alumnos = [];
let maestros = [];

// ===== LOGIN =====
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    const snapshot = await db.collection("usuarios").where("email", "==", email).get();
    usuarioActual = snapshot.docs[0].data();

    document.getElementById("loginDiv").style.display = "none";
    document.getElementById("appDiv").style.display = "block";
    cargarDashboard();
    cargarAlumnos();
    cargarMaestros();
  } catch (e) {
    document.getElementById("loginError").innerText = "Correo o contraseña incorrecta";
    console.error(e);
  }
}

function logout() {
  auth.signOut();
  usuarioActual = null;
  document.getElementById("appDiv").style.display = "none";
  document.getElementById("loginDiv").style.display = "block";
}

// ===== CARGAR ALUMNOS =====
async function cargarAlumnos() {
  const snapshot = await db.collection("alumnos").get();
  let todosAlumnos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  alumnos = usuarioActual.rol === "admin" 
            ? todosAlumnos 
            : todosAlumnos.filter(a => a.aula_id == usuarioActual.aula_id);

  mostrarListaAlumnos();
  llenarSelectAlumnos();
  llenarSelectEditar();
}

// ===== CARGAR MAESTROS =====
async function cargarMaestros() {
  if(usuarioActual.rol !== "admin") return;
  const snapshot = await db.collection("usuarios").where("rol","==","maestro").get();
  maestros = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  mostrarListaMaestros();
}

// ===== LLENAR SELECT PARA ASISTENCIA =====
function llenarSelectAlumnos() {
  const select = document.getElementById("alumnoSelect");
  if(!select) return;
  select.innerHTML = "";
  alumnos.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.text = a.nombre;
    select.add(opt);
  });
}

// ===== LLENAR SELECT PARA EDITAR =====
function llenarSelectEditar() {
  const select = document.getElementById("editarAlumnoSelect");
  if(!select) return;
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
      document.getElementById("aulaAlumno").value = usuarioActual.aula_id || "1";
    } else {
      const alum = alumnos.find(x => x.id === id);
      document.getElementById("nombreAlumno").value = alum.nombre;
      document.getElementById("edadAlumno").value = alum.edad;
      document.getElementById("aulaAlumno").value = alum.aula_id;
    }
  }
}

// ===== GUARDAR ALUMNO =====
async function guardarAlumno() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const aula = usuarioActual.rol==="admin" ? parseInt(document.getElementById("aulaAlumno").value) : usuarioActual.aula_id;
  const select = document.getElementById("editarAlumnoSelect");

  if(select.value === "") {
    await db.collection("alumnos").add({ nombre, edad, aula_id: aula });
    alert("Alumno agregado");
  } else {
    await db.collection("alumnos").doc(select.value).update({ nombre, edad, aula_id: aula });
    alert("Alumno actualizado");
  }

  cargarAlumnos();
}

// ===== MOSTRAR LISTA DE ALUMNOS =====
function mostrarListaAlumnos() {
  const div = document.getElementById("listaAlumnos");
  if(!div) return;
  div.innerHTML = "";
  alumnos.forEach(a => {
    const p = document.createElement("p");
    p.innerText = `Nombre: ${a.nombre}, Edad: ${a.edad}, Aula: ${a.aula_id}`;
    div.appendChild(p);
  });
}

// ===== REGISTRAR ASISTENCIA =====
async function registrarAsistenciaUI() {
  const id = document.getElementById("alumnoSelect").value;
  const asistio = document.getElementById("asistioCheck").checked;
  const fecha = new Date().toISOString().slice(0,10);

  await db.collection("asistencias").add({
    alumno_id: id,
    fecha,
    asistio,
    registrado_por: usuarioActual.nombre
  });

  alert("Asistencia registrada");
}

// ===== MOSTRAR HISTORIAL DE ASISTENCIAS =====
async function mostrarHistorial() {
  const div = document.getElementById("historialLista");
  if(!div) return;
  div.innerHTML = "";

  const snapshot = await db.collection("asistencias").get();
  let asistencias = snapshot.docs.map(d => d.data());

  if(usuarioActual.rol !== "admin") {
    const idsAula = alumnos.map(a => a.id);
    asistencias = asistencias.filter(a => idsAula.includes(a.alumno_id));
  }

  asistencias.forEach(a => {
    const alum = alumnos.find(x => x.id === a.alumno_id);
    const p = document.createElement("p");
    p.innerText = `${alum.nombre} - ${a.fecha} - ${a.asistio ? "Asistió" : "No asistió"} - Registrado por: ${a.registrado_por}`;
    div.appendChild(p);
  });
}

// ===== DASHBOARD =====
function cargarDashboard() {
  const div = document.getElementById("dashboardDiv");
  if(!div) return;

  const totalAlumnos = alumnos.length;
  const totalAsistencias = alumnos.reduce((acc,a)=>{
    return acc + 0; // Podemos agregar cálculo de asistencias por alumno
  },0);

  div.innerHTML = `
    <div class="card">Total Alumnos: ${totalAlumnos}</div>
    <div class="card">Total Asistencias: ${totalAsistencias}</div>
  `;
}

// ===== ADMIN: MOSTRAR MAESTROS =====
function mostrarListaMaestros() {
  const div = document.getElementById("listaMaestros");
  if(!div) return;
  div.innerHTML = "";
  maestros.forEach(m => {
    const p = document.createElement("p");
    p.innerText = `Nombre: ${m.nombre}, Email: ${m.email}, Aula: ${m.aula_id}`;
    div.appendChild(p);
  });
}
