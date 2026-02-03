async function cargarAlumnos() {
  const snapshot = await db.collection("alumnos").get();
  let todosAlumnos = snapshot.docs.map(d => ({id:d.id,...d.data()}));

  alumnos = usuarioActual.rol==="admin" ? todosAlumnos 
          : todosAlumnos.filter(a => a.aula_id==usuarioActual.aula_id);

  llenarSelectEditar();
  mostrarListaAlumnos();
  mostrarTablaAsistencia();
  actualizarDashboard();
}

function llenarSelectEditar() {
  const select = document.getElementById("editarAlumnoSelect");
  select.innerHTML = "<option value=''>Nuevo Alumno</option>";
  alumnos.forEach(a=>{
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.text = a.nombre;
    select.add(opt);
  });

  select.onchange = () => {
    const id = select.value;
    if(id===""){
      document.getElementById("nombreAlumno").value = "";
      document.getElementById("edadAlumno").value = "";
      document.getElementById("aulaAlumno").value = "1";
    } else {
      const a = alumnos.find(x=>x.id===id);
      document.getElementById("nombreAlumno").value = a.nombre;
      document.getElementById("edadAlumno").value = a.edad;
      document.getElementById("aulaAlumno").value = a.aula_id;
    }
  }
}

async function guardarAlumno() {
  const nombre = document.getElementById("nombreAlumno").value;
  const edad = parseInt(document.getElementById("edadAlumno").value);
  const aula_id = parseInt(document.getElementById("aulaAlumno").value);
  const select = document.getElementById("editarAlumnoSelect");

  if(select.value==="") await db.collection("alumnos").add({nombre,edad,aula_id});
  else await db.collection("alumnos").doc(select.value).update({nombre,edad,aula_id});

  cargarAlumnos();
}

function mostrarListaAlumnos() {
  const div = document.getElementById("listaAlumnos");
  div.innerHTML = "";
  alumnos.forEach(a=>{
    const p = document.createElement("p");
    p.innerText = `Nombre: ${a.nombre}, Edad: ${a.edad}, Aula: ${a.aula_id}`;
    div.appendChild(p);
  });
}

// ------------------ ASISTENCIAS ------------------

function mostrarTablaAsistencia() {
  const tbody = document.getElementById("tablaAsistencia");
  tbody.innerHTML = "";
  alumnos.forEach(a=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.nombre}</td>
      <td><input type="checkbox" data-id="${a.id}"></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("fechaAsistencia").onchange = cargarAsistenciasPorFecha;
}

async function cargarAsistenciasPorFecha() {
  const fecha = document.getElementById("fechaAsistencia").value;
  if(!fecha) return;

  const snapshot = await db.collection("asistencias").where("fecha","==",fecha).get();
  const registros = snapshot.docs.map(d=>d.data());

  document.querySelectorAll("#tablaAsistencia input[type=checkbox]").forEach(cb=>{
    const id_alumno = cb.dataset.id;
    const r = registros.find(x=>x.alumno_id===id_alumno);
    cb.checked = r ? r.asistio : false;
  });
}

async function guardarAsistencias() {
  const fecha = document.getElementById("fechaAsistencia").value;
  if(!fecha){ alert("Selecciona fecha"); return; }

  const checkboxes = document.querySelectorAll("#tablaAsistencia input[type=checkbox]");
  for(let cb of checkboxes){
    const id_alumno = cb.dataset.id;
    const asistio = cb.checked;

    const snapshot = await db.collection("asistencias")
      .where("fecha","==",fecha)
      .where("alumno_id","==",id_alumno)
      .get();

    if(snapshot.empty){
      await db.collection("asistencias").add({
        alumno_id:id_alumno,
        fecha,
        asistio,
        registrado_por: usuarioActual.nombre
      });
    } else {
      const docId = snapshot.docs[0].id;
      await db.collection("asistencias").doc(docId).update({asistio});
    }
  }

  alert("Asistencias guardadas");
  actualizarDashboard();
}

// ------------------ DASHBOARD ------------------

async function actualizarDashboard() {
  const statsDiv = document.getElementById("dashboardStats");
  const alumnosSnap = await db.collection("alumnos").get();
  const asistenciasSnap = await db.collection("asistencias").get();

  const totalAlumnos = alumnosSnap.size;
  const asistencias = asistenciasSnap.docs.map(d=>d.data());

  // Contar asistencias por alumno
  const conteo = {};
  alumnosSnap.docs.forEach(d=>{ conteo[d.id]=0; });
  asistencias.forEach(a=>{
    if(a.asistio) conteo[a.alumno_id]++;
  });

  const maxAsistencias = Math.max(...Object.values(conteo));
  const minAsistencias = Math.min(...Object.values(conteo));

  statsDiv.innerHTML = `
    <p>Total alumnos: ${totalAlumnos}</p>
    <p>Mayor asistencia: ${Object.keys(conteo).find(k=>conteo[k]===maxAsistencias)}</p>
    <p>Menor asistencia: ${Object.keys(conteo).find(k=>conteo[k]===minAsistencias)}</p>
  `;
}
