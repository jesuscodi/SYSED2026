let usuarioActual = null;
let alumnos = [];

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await firebase.auth().signInWithEmailAndPassword(email,password);
    const snapshot = await firebase.firestore().collection("usuarios").where("email","==",email).get();
    if(snapshot.empty) throw "Usuario no encontrado";
    usuarioActual = snapshot.docs[0].data();
    usuarioActual.uid = snapshot.docs[0].id;

    document.getElementById("loginDiv").style.display = "none";
    document.getElementById("appDiv").style.display = "block";
    document.getElementById("welcome").innerText = `Bienvenido, ${usuarioActual.nombre}`;

    // Mostrar sección admin
    if(usuarioActual.rol === "admin") document.getElementById("adminBtn").style.display = "inline";

    cargarAlumnos();
  } catch(e) {
    document.getElementById("loginError").innerText = "Correo o clave incorrecta";
  }
}

// LOGOUT
function logout() {
  firebase.auth().signOut();
  usuarioActual = null;
  document.getElementById("appDiv").style.display = "none";
  document.getElementById("loginDiv").style.display = "block";
}

// Mostrar secciones
function mostrarSeccion(id) {
  ["alumnosDiv","asistenciasDiv","maestrosDiv"].forEach(d => document.getElementById(d).style.display="none");
  document.getElementById(id).style.display = "block";

  if(id==="alumnosDiv" || id==="asistenciasDiv") cargarAlumnos();
}

// CARGAR ALUMNOS
async function cargarAlumnos() {
  const snapshot = await firebase.firestore().collection("alumnos").get();
  let todosAlumnos = snapshot.docs.map(d=>({id:d.id,...d.data()}));

  alumnos = usuarioActual.rol === "admin"
            ? todosAlumnos
            : todosAlumnos.filter(a => Number(a.aula_id) === Number(usuarioActual.aula_id));

  llenarSelectAlumnos();
  llenarSelectEditar();
  mostrarListaAlumnos();
}

// LLENAR SELECT ASISTENCIA
function llenarSelectAlumnos() {
  const select = document.getElementById("alumnoSelect");
  select.innerHTML = "";
  alumnos.forEach(a=>{
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.text = a.nombre;
    select.add(opt);
  });
}

// LLENAR SELECT EDITAR
function llenarSelectEditar() {
  const select = document.getElementById("editarAlumnoSelect");
  select.innerHTML = "<option value=''>Nuevo Alumno</option>";
  alumnos.forEach(a=>{
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.text = a.nombre;
    select.add(opt);
  });

  select.onchange = ()=>{
    const id = select.value;
    if(id===""){
      document.getElementById("nombreAlumno").value="";
      document.getElementById("edadAlumno").value="";
    } else {
      const alum = alumnos.find(x=>x.id===id);
      document.getElementById("nombreAlumno").value = alum.nombre;
      document.getElementById("edadAlumno").value = alum.edad;
    }
  }

  // Mostrar selector aula solo admin
  document.getElementById("aulaAlumno").style.display = usuarioActual.rol==="admin" ? "inline" : "none";
}

// GUARDAR ALUMNO
async function guardarAlumno() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const select = document.getElementById("editarAlumnoSelect");

  let aula;
  if(usuarioActual.rol==="admin") {
    aula = Number(document.getElementById("aulaAlumno").value);
  } else {
    aula = usuarioActual.aula_id;
  }

  if(select.value==="") {
    await firebase.firestore().collection("alumnos").add({
      nombre,
      edad,
      aula_id: aula,
      registrado_por: usuarioActual.nombre,
      maestro_id: usuarioActual.uid
    });
    alert("Alumno agregado");
  } else {
    await firebase.firestore().collection("alumnos").doc(select.value).update({nombre,edad});
    alert("Alumno actualizado");
  }

  cargarAlumnos();
}

// MOSTRAR LISTA
function mostrarListaAlumnos() {
  const div = document.getElementById("listaAlumnos");
  div.innerHTML = "";
  alumnos.forEach(a=>{
    const p = document.createElement("p");
    p.innerText = `Nombre: ${a.nombre}, Edad: ${a.edad}, Aula: ${a.aula_id}, Registrado por: ${a.registrado_por}`;
    div.appendChild(p);
  });
}

// REGISTRAR ASISTENCIA
async function registrarAsistenciaUI() {
  const id = document.getElementById("alumnoSelect").value;
  const asistio = document.getElementById("asistioCheck").checked;
  const fecha = new Date().toISOString().slice(0,10);
  const alumno = alumnos.find(a=>a.id===id);

  await firebase.firestore().collection("asistencias").add({
    alumno_id: id,
    alumno_nombre: alumno.nombre,
    fecha,
    asistio,
    aula_id: alumno.aula_id,
    maestro_id: usuarioActual.uid,
    maestro_nombre: usuarioActual.nombre
  });

  alert("Asistencia registrada");
  mostrarHistorial();
}

// HISTORIAL
async function mostrarHistorial() {
  const div = document.getElementById("historialLista");
  div.innerHTML = "";
  const snapshot = await firebase.firestore().collection("asistencias").get();
  let asistencias = snapshot.docs.map(d=>d.data());

  if(usuarioActual.rol!=="admin") {
    const idsAula = alumnos.map(a=>a.id);
    asistencias = asistencias.filter(a=>idsAula.includes(a.alumno_id));
  }

  asistencias.forEach(a=>{
    const p = document.createElement("p");
    p.innerText = `${a.alumno_nombre} - ${a.fecha} - ${a.asistio?"Asistió":"No asistió"} - Registrado por: ${a.maestro_nombre}`;
    div.appendChild(p);
  });
}

// REGISTRAR MAESTRO (solo admin)
async function registrarMaestro() {
  const nombre = document.getElementById("nombreMaestro").value;
  const email = document.getElementById("emailMaestro").value;
  const pass = document.getElementById("passMaestro").value;
  const aula = Number(document.getElementById("aulaMaestro").value);

  const cred = await firebase.auth().createUserWithEmailAndPassword(email, pass);
  await firebase.firestore().collection("usuarios").doc(cred.user.uid).set({
    nombre,
    email,
    rol: "maestro",
    aula_id: aula
  });

  alert("Maestro registrado");
}
