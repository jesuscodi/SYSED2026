let usuarioActual = null;
let alumnos = [];
let maestros = [];
let asistenciasGuardadas = [];

// LOGIN
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        const snapshot = await db.collection("usuarios").where("email", "==", email).get();
        usuarioActual = snapshot.docs[0].data();

        document.getElementById("loginDiv").style.display = "none";
        document.getElementById("appDiv").style.display = "flex";
        document.getElementById("welcome").innerText = `Bienvenido, ${usuarioActual.nombre}`;

        cargarAlumnos();
        cargarMaestros();
        cargarDashboard();
    } catch (e) {
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

// SECCIONES
function mostrarSeccion(id) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(id).style.display = 'block';

    if(id === 'asistencias') mostrarListaAsistencias();
}

// CARGAR ALUMNOS
async function cargarAlumnos() {
    const snapshot = await db.collection("alumnos").get();
    let todosAlumnos = snapshot.docs.map(d => ({id: d.id, ...d.data()}));

    alumnos = usuarioActual.rol === "admin" 
              ? todosAlumnos 
              : todosAlumnos.filter(a => a.aula_id == usuarioActual.aula_id);

    llenarSelectAlumnos();
    llenarSelectEditar();
    mostrarListaAlumnos();
}

// LLENAR SELECT ASISTENCIA
function llenarSelectAlumnos() {
    // Ya lo usaremos en checklist de asistencias
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
            document.getElementById("aulaSelectAlumno").value = alum.aula_id;
        }
    }
}

// GUARDAR ALUMNO
async function guardarAlumno() {
    const nombre = document.getElementById("nombreAlumno").value;
    const edad = parseInt(document.getElementById("edadAlumno").value);
    const aula = parseInt(document.getElementById("aulaSelectAlumno").value);
    const select = document.getElementById("editarAlumnoSelect");

    if(select.value === "") {
        await db.collection("alumnos").add({nombre, edad, aula_id: aula});
        alert("Alumno agregado");
    } else {
        await db.collection("alumnos").doc(select.value).update({nombre, edad, aula_id: aula});
        alert("Alumno actualizado");
    }

    cargarAlumnos();
}

// MOSTRAR LISTA DE ALUMNOS
function mostrarListaAlumnos() {
    const div = document.getElementById("listaAlumnos");
    div.innerHTML = "";
    alumnos.forEach(a => {
        const p = document.createElement("p");
        p.innerText = `Nombre: ${a.nombre}, Edad: ${a.edad}, Aula: ${aulaTexto(a.aula_id)}`;
        div.appendChild(p);
    });
}

function aulaTexto(id){
    if(id==1) return "Escogidos con Propósito (8-12 años)";
    if(id==2) return "Amigos de Dios (3-7 años)";
    return "Admin";
}

// ASISTENCIAS
async function mostrarListaAsistencias() {
    const fecha = document.getElementById("fechaAsistencia").value || new Date().toISOString().slice(0,10);
    const div = document.getElementById("listaAsistencias");
    div.innerHTML = "";

    const snapshot = await db.collection("alumnos").get();
    const listaAlumnos = snapshot.docs.map(d => ({id: d.id, ...d.data()}))
                        .filter(a => usuarioActual.rol!=="admin" ? a.aula_id==usuarioActual.aula_id : true);

    const asistenciaSnapshot = await db.collection("asistencias")
        .where("fecha","==",fecha).get();
    const asistencias = asistenciaSnapshot.docs.map(d=>d.data());

    asistenciasGuardadas = asistencias;

    listaAlumnos.forEach(a => {
        const p = document.createElement("p");
        const chk = document.createElement("input");
        chk.type="checkbox";
        chk.checked = asistencias.find(x=>x.alumno_id===a.id)?.asistio || false;
        chk.dataset.id = a.id;
        p.appendChild(chk);
        p.append(` ${a.nombre} (${aulaTexto(a.aula_id)})`);
        div.appendChild(p);
    });
}

// GUARDAR ASISTENCIAS
async function guardarAsistencias() {
    const fecha = document.getElementById("fechaAsistencia").value || new Date().toISOString().slice(0,10);
    const checkboxes = document.querySelectorAll("#listaAsistencias input[type=checkbox]");

    for(let chk of checkboxes){
        const id = chk.dataset.id;
        const asistio = chk.checked;

        // Verificar si ya existe
        const existSnapshot = await db.collection("asistencias")
            .where("alumno_id","==",id)
            .where("fecha","==",fecha)
            .get();

        if(existSnapshot.empty){
            await db.collection("asistencias").add({alumno_id:id, fecha, asistio});
        } else {
            await db.collection("asistencias").doc(existSnapshot.docs[0].id).update({asistio});
        }
    }

    alert("Asistencias guardadas");
    mostrarListaAsistencias();
}

// DESCARGAR CSV
function descargarCSV(){
    let csv = "Nombre,Aula,Fecha,Asistió\n";
    const fecha = document.getElementById("fechaAsistencia").value || new Date().toISOString().slice(0,10);
    alumnos.forEach(a=>{
        const chk = document.querySelector(`#listaAsistencias input[data-id='${a.id}']`);
        const asistio = chk ? chk.checked : false;
        csv += `${a.nombre},${aulaTexto(a.aula_id)},${fecha},${asistio}\n`;
    });
    const blob = new Blob([csv], {type: "text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asistencias.csv";
    a.click();
}

// DASHBOARD
async function cargarDashboard(){
    const totalAlumnos = alumnos.length;
    let html = `<p>Total alumnos: ${totalAlumnos}</p>`;

    const snapshot = await db.collection("asistencias").get();
    const asistencias = snapshot.docs.map(d=>d.data());
    const count = {};
    alumnos.forEach(a=>{
        count[a.id] = asistencias.filter(x=>x.alumno_id===a.id && x.asistio).length;
    });
    const max = Math.max(...Object.values(count));
    const min = Math.min(...Object.values(count));
    html += `<p>Más asistencias: ${alumnos.find(a=>count[a.id]===max)?.nombre || "N/A"} (${max})</p>`;
    html += `<p>Menos asistencias: ${alumnos.find(a=>count[a.id]===min)?.nombre || "N/A"} (${min})</p>`;

    document.getElementById("dashboardStats").innerHTML = html;
}

// MAESTROS
async function cargarMaestros(){
    if(usuarioActual.rol!=="admin") return;
    const snapshot = await db.collection("usuarios").get();
    maestros = snapshot.docs.map(d=>({id:d.id,...d.data()}));
    const select = document.getElementById("editarMaestroSelect");
    select.innerHTML = "<option value=''>Nuevo Maestro</option>";
    maestros.forEach(m=>{
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.text = m.nombre;
        select.add(opt);
    });

    select.onchange = () => {
        const id = select.value;
        if(id===""){
            document.getElementById("nombreMaestro").value="";
            document.getElementById("emailMaestro").value="";
            document.getElementById("passwordMaestro").value="";
            document.getElementById("aulaSelectMaestro").value="0";
        } else {
            const m = maestros.find(x=>x.id===id);
            document.getElementById("nombreMaestro").value=m.nombre;
            document.getElementById("emailMaestro").value=m.email;
            document.getElementById("passwordMaestro").value="";
            document.getElementById("aulaSelectMaestro").value=m.aula_id;
        }
    }
}

// GUARDAR MAESTRO
async function guardarMaestro(){
    const nombre = document.getElementById("nombreMaestro").value;
    const email = document.getElementById("emailMaestro").value;
    const password = document.getElementById("passwordMaestro").value;
    const aula = parseInt(document.getElementById("aulaSelectMaestro").value);
    const select = document.getElementById("editarMaestroSelect");

    if(select.value===""){
        const cred = await auth.createUserWithEmailAndPassword(email,password);
        await db.collection("usuarios").doc(cred.user.uid).set({nombre,email,aula_id:aula,rol:aula===0?"admin":"maestro"});
        alert("Maestro agregado");
    } else {
        await db.collection("usuarios").doc(select.value).update({nombre,email,aula_id:aula});
        alert("Maestro actualizado");
    }

    cargarMaestros();
}
