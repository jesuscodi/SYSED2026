let usuarioActual = null;
let alumnos = [];
let maestros = [];
let aulas = [];
let asistencias = [];

// ================= LOGIN =================
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        await auth.signInWithEmailAndPassword(email,password);
        const snapshot = await db.collection("usuarios").where("email","==",email).get();
        usuarioActual = snapshot.docs[0].data();
        document.getElementById("welcome").innerText = `Bienvenido, ${usuarioActual.nombre}`;
        cargarDatos();
    } catch(e) {
        document.getElementById("loginError").innerText = "Correo o clave incorrecta";
    }
}

function logout() {
    auth.signOut();
    usuarioActual = null;
    window.location.href = "login.html";
}

// ================= CARGAR DATOS =================
async function cargarDatos() {
    await cargarAulas();
    await cargarAlumnos();
    await cargarMaestros();
    await cargarAsistencias();
    mostrarSeccion('dashboard');
    llenarSelects();
    mostrarDashboard();
}

// ================= SECCIONES =================
function mostrarSeccion(seccion) {
    document.querySelectorAll('.seccion').forEach(div => div.style.display='none');
    document.getElementById(seccion).style.display='block';
    if(seccion=='listaAlumnos') mostrarListaAlumnos();
    if(seccion=='asistencia') mostrarListaAsistencia();
}

// ================= AULAS =================
async function cargarAulas() {
    const snapshot = await db.collection("aulas").get();
    aulas = snapshot.docs.map(d => ({id:d.id,...d.data()}));
    mostrarListaAulas();
}

async function guardarAula() {
    const nombre = document.getElementById("nombreAula").value;
    if(nombre==="") return;
    await db.collection("aulas").add({nombre});
    document.getElementById("nombreAula").value="";
    cargarAulas();
}

function mostrarListaAulas() {
    const div = document.getElementById("listaAulas");
    div.innerHTML="";
    aulas.forEach(a=>{ div.innerHTML+=`<p>${a.nombre}</p>` });
}

// ================= MAESTROS =================
async function cargarMaestros() {
    const snapshot = await db.collection("maestros").get();
    maestros = snapshot.docs.map(d => ({id:d.id,...d.data()}));
    mostrarListaMaestros();
}

async function guardarMaestro() {
    const nombre = document.getElementById("nombreMaestro").value;
    const email = document.getElementById("emailMaestro").value;
    const clave = document.getElementById("claveMaestro").value;
    const aula_id = document.getElementById("aulaMaestro").value;
    if(!nombre||!email||!clave) return;
    await auth.createUserWithEmailAndPassword(email,clave);
    await db.collection("maestros").add({nombre,email,aula_id});
    document.getElementById("nombreMaestro").value="";
    document.getElementById("emailMaestro").value="";
    document.getElementById("claveMaestro").value="";
    cargarMaestros();
}

function mostrarListaMaestros() {
    const div = document.getElementById("listaMaestros");
    div.innerHTML="";
    maestros.forEach(m=>{ div.innerHTML+=`<p>${m.nombre} - Aula: ${getAulaNombre(m.aula_id)}</p>` });
}

// ================= ALUMNOS =================
async function cargarAlumnos() {
    const snapshot = await db.collection("alumnos").get();
    let todos = snapshot.docs.map(d => ({id:d.id,...d.data()}));
    alumnos = usuarioActual.rol=="admin"?todos:todos.filter(a=>a.aula_id==usuarioActual.aula_id);
    mostrarListaAlumnos();
}

async function guardarAlumno() {
    const nombre = document.getElementById("nombreAlumno").value;
    const edad = document.getElementById("edadAlumno").value;
    const aula_id = document.getElementById("aulaAlumno").value;
    await db.collection("alumnos").add({nombre,edad,aula_id});
    document.getElementById("nombreAlumno").value="";
    document.getElementById("edadAlumno").value="";
    cargarAlumnos();
}

function mostrarListaAlumnos() {
    const div = document.getElementById("listaAlumnos");
    div.innerHTML="";
    alumnos.forEach(a=>{ div.innerHTML+=`<p>${a.nombre} - Edad: ${a.edad} - Aula: ${getAulaNombre(a.aula_id)}</p>` });
}

// ================= ASISTENCIA =================
async function cargarAsistencias() {
    const snapshot = await db.collection("asistencias").get();
    asistencias = snapshot.docs.map(d => ({id:d.id,...d.data()}));
}

function mostrarListaAsistencia() {
    const div = document.getElementById("listaAsistencia");
    div.innerHTML="";
    const fecha = document.getElementById("fechaAsistencia").value || new Date().toISOString().slice(0,10);
    alumnos.forEach(a=>{
        div.innerHTML+=`
        <p>
            ${a.nombre} - 
            <input type="checkbox" data-id="${a.id}" ${asistencias.some(x=>x.alumno_id==a.id && x.fecha==fecha) ? "checked" : ""}>
        </p>`;
    });
}

async function guardarAsistencia() {
    const fecha = document.getElementById("fechaAsistencia").value || new Date().toISOString().slice(0,10);
    const checkboxes = document.querySelectorAll('#listaAsistencia input[type=checkbox]');
    for(let c of checkboxes){
        const alumno_id = c.dataset.id;
        const asistio = c.checked;
        await db.collection("asistencias").add({alumno_id,fecha,asistio});
    }
    alert("Asistencias guardadas");
    cargarAsistencias();
}

// ================= DASHBOARD =================
function mostrarDashboard() {
    const div = document.getElementById("estadisticas");
    const totalAlumnos = alumnos.length;
    const totalAsistencias = asistencias.filter(a=>a.asistio).length;
    div.innerHTML = `<p>Total alumnos: ${totalAlumnos}</p>
                     <p>Total asistencias registradas: ${totalAsistencias}</p>`;
}

// ================= UTIL =================
function getAulaNombre(aula_id) {
    const a = aulas.find(x=>x.id==aula_id);
    return a?a.nombre:"Sin Aula";
}

function llenarSelects() {
    const selectAulaAlumno = document.getElementById("aulaAlumno");
    const selectAulaMaestro = document.getElementById("aulaMaestro");
    selectAulaAlumno.innerHTML="";
    selectAulaMaestro.innerHTML="";
    aulas.forEach(a=>{
        selectAulaAlumno.innerHTML+=`<option value="${a.id}">${a.nombre}</option>`;
        selectAulaMaestro.innerHTML+=`<option value="${a.id}">${a.nombre}</option>`;
    });
}
