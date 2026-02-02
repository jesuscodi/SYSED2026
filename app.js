let usuarioActual = null;
let alumnos = [];

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    const snapshot = await db.collection("usuarios").where("email","==",email).get();

    if(snapshot.empty){
      document.getElementById("loginError").innerText = "No tienes perfil en Firestore";
      return;
    }

    usuarioActual = snapshot.docs[0].data();

    document.getElementById("loginDiv").style.display = "none";
    document.getElementById("appDiv").style.display = "block";
    document.getElementById("welcome").innerText = `Bienvenido, ${usuarioActual.nombre}`;

    cargarAlumnos();
  } catch(e) {
    console.log(e);
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
  const select = document.getElementById("alumnoSelect");
  select.innerHTML = "";
  alumnos.forEach(a => {
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
  }
}

// GUARDAR ALUMNO
async function guardarAlumno() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const select = document.getElementById("editarAlumnoSelect");
  const aula = usuarioActual.rol==="admin"?1:usuarioActual.aula_id;

  if(select.value === "") {
    await db.collection("alumnos").add({nombre, edad, aula_id: aula});
    alert("Alumno agregado");
  } else {
    await db.collection("alumnos").doc(select.value).update({nombre, edad});
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
    p.innerText = `Nombre: ${a.nombre}, Edad: ${a.edad}, Aula: ${a.aula_id}`;
    div.appendChild(p);
  });
}

// REGISTRAR ASISTENCIA
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

// MOSTRAR HISTORIAL
async function mostrarHistorial() {
  document.getElementById("historialDiv").style.display = "block";
  const div = document.getElementById("historialLista");
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
    p.innerText = `${alum.nombre} - ${a.fecha} - ${a.asistio ? "Asistió" : "No asistió"}`;
    div.appendChild(p);
  });
}
