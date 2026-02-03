let usuarioActual = null;
let alumnos = [];
let maestros = [];

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    const snapshot = await db.collection("usuarios").where("email","==",email).get();
    usuarioActual = snapshot.docs[0].data();

    document.getElementById("loginDiv").style.display = "none";
    document.getElementById("appDiv").style.display = "block";

    cargarDashboard();
  } catch(e) {
    document.getElementById("loginError").innerText = "Correo o clave incorrecta";
  }
}

// LOGOUT
function logout() {
  auth.signOut();
  usuarioActual = null;
  document.getElementById("appDiv").style.display = "none";
  document.getElementById("loginDiv").style.display = "block";
}

// CARGAR DASHBOARD
async function cargarDashboard() {
  // Crear HTML del dashboard
  document.getElementById("appDiv").innerHTML = `
    <div class="sidebar">
      <h2>Rey de Reyes</h2>
      <a href="#" onclick="mostrarSeccion('dashboard')">Dashboard</a>
      <a href="#" onclick="mostrarSeccion('alumnos')">Alumnos</a>
      ${usuarioActual.rol==='admin'?'<a href="#" onclick="mostrarSeccion(\'maestros\')">Maestros</a>':''}
      <a href="#" onclick="logout()">Cerrar sesión</a>
    </div>
    <div class="main" id="mainContent"></div>
  `;
  mostrarSeccion('dashboard');
}

// FUNCION PARA MOSTRAR SECCIONES
function mostrarSeccion(seccion) {
  const main = document.getElementById("mainContent");
  if(seccion==='dashboard') {
    main.innerHTML = `<h2>Dashboard</h2><div id="dashboardCards"></div>`;
    cargarDashboardStats();
  } else if(seccion==='alumnos') {
    main.innerHTML = `<h2>Alumnos</h2>
      <button onclick="mostrarFormAlumno()">Agregar Alumno</button>
      <div id="formAlumno" style="display:none;"></div>
      <div id="listaAlumnos" class="table-container"></div>`;
    cargarAlumnos();
  } else if(seccion==='maestros' && usuarioActual.rol==='admin') {
    main.innerHTML = `<h2>Maestros</h2>
      <button onclick="mostrarFormMaestro()">Agregar Maestro</button>
      <div id="formMaestro" style="display:none;"></div>
      <div id="listaMaestros" class="table-container"></div>`;
    cargarMaestros();
  }
}

// DASHBOARD STATS
async function cargarDashboardStats() {
  const dash = document.getElementById("dashboardCards");
  const alumnosSnap = await db.collection("alumnos").get();
  const maestrosSnap = await db.collection("usuarios").where("rol","==","maestro").get();
  const asistenciasSnap = await db.collection("asistencias").get();

  const totalAlumnos = alumnosSnap.size;
  const totalMaestros = maestrosSnap.size;

  // Alumnos con más y menos asistencia
  const asistencias = asistenciasSnap.docs.map(d=>d.data());
  const conteo = {};
  asistencias.forEach(a=>{
    conteo[a.alumno_id] = (conteo[a.alumno_id]||0)+ (a.asistio?1:0);
  });

  let mas = '', menos='';
  if(Object.keys(conteo).length>0){
    const sorted = Object.entries(conteo).sort((a,b)=>b[1]-a[1]);
    mas = sorted[0][0]; menos = sorted[sorted.length-1][0];
  }

  dash.innerHTML = `
    <div class="card">Total Alumnos: ${totalAlumnos}</div>
    <div class="card">Total Maestros: ${totalMaestros}</div>
    <div class="card">Mayor asistencia: ${mas}</div>
    <div class="card">Menor asistencia: ${menos}</div>
  `;
}

// CARGAR ALUMNOS
async function cargarAlumnos() {
  const snap = await db.collection("alumnos").get();
  alumnos = snap.docs.map(d=>({id:d.id,...d.data()}));
  mostrarListaAlumnos();
}

// MOSTRAR LISTA DE ALUMNOS
function mostrarListaAlumnos() {
  const div = document.getElementById("listaAlumnos");
  if(!div) return;
  let html = '<table><tr><th>Nombre</th><th>Edad</th><th>Aula</th><th>Asistencia</th></tr>';
  alumnos.filter(a=>usuarioActual.rol==='admin'?true:a.aula_id===usuarioActual.aula_id)
    .forEach(a=>{
      html+=`<tr>
        <td>${a.nombre}</td>
        <td>${a.edad}</td>
        <td>${a.aula_id}</td>
        <td><input type="checkbox" onchange="registrarAsistencia('${a.id}',this.checked)"></td>
      </tr>`;
    });
  html+='</table>';
  div.innerHTML = html;
}

// REGISTRAR ASISTENCIA
async function registrarAsistencia(id, asistio) {
  await db.collection("asistencias").add({
    alumno_id: id,
    fecha: new Date().toISOString().slice(0,10),
    asistio,
    registradoPor: usuarioActual.nombre
  });
}

// FORMULARIO ALUMNO
function mostrarFormAlumno() {
  const div = document.getElementById("formAlumno");
  div.style.display = div.style.display==='none'?'block':'none';
  div.innerHTML = `
    <input type="text" id="nombreAlumno" placeholder="Nombre">
    <input type="number" id="edadAlumno" placeholder="Edad">
    <select id="aulaAlumno">
      <option value="1">Escogidos con Propósitos (8-12 años)</option>
      <option value="2">Los Amigos de Dios (3-7 años)</option>
    </select>
    <button onclick="guardarAlumno()">Guardar Alumno</button>
  `;
}

// GUARDAR ALUMNO
async function guardarAlumno() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const aula = parseInt(document.getElementById("aulaAlumno").value);

  await db.collection("alumnos").add({nombre, edad, aula_id:aula, registradoPor:usuarioActual.nombre});
  alert("Alumno registrado");
  cargarAlumnos();
}

// FORMULARIO MAESTRO
function mostrarFormMaestro() {
  const div = document.getElementById("formMaestro");
  div.style.display = div.style.display==='none'?'block':'none';
  div.innerHTML = `
    <input type="text" id="nombreMaestro" placeholder="Nombre">
    <input type="email" id="emailMaestro" placeholder="Correo">
    <input type="password" id="passMaestro" placeholder="Contraseña">
    <select id="aulaMaestro">
      <option value="1">Escogidos con Propósitos (8-12 años)</option>
      <option value="2">Los Amigos de Dios (3-7 años)</option>
    </select>
    <button onclick="guardarMaestro()">Guardar Maestro</button>
  `;
}

// GUARDAR MAESTRO
async function guardarMaestro() {
  const nombre = document.getElementById("nombreMaestro").value;
  const email = document.getElementById("emailMaestro").value;
  const pass = document.getElementById("passMaestro").value;
  const aula = parseInt(document.getElementById("aulaMaestro").value);

  const cred = await auth.createUserWithEmailAndPassword(email, pass);
  await db.collection("usuarios").doc(cred.user.uid).set({
    nombre, email, rol:"maestro", aula_id:aula
  });
  alert("Maestro registrado");
  cargarMaestros();
}

// CARGAR MAESTROS
async function cargarMaestros() {
  const snap = await db.collection("usuarios").where("rol","==","maestro").get();
  maestros = snap.docs.map(d=>({id:d.id,...d.data()}));
  const div = document.getElementById("listaMaestros");
  if(!div) return;
  let html = '<table><tr><th>Nombre</th><th>Email</th><th>Aula</th></tr>';
  maestros.forEach(m=>{
    html+=`<tr><td>${m.nombre}</td><td>${m.email}</td><td>${m.aula_id}</td></tr>`;
  });
  html+='</table>';
  div.innerHTML = html;
}
