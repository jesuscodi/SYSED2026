// LOGIN
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      alert(error.message);
    });
}

// REGISTRO
function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Usuario creado");
      window.location.href = "login.html";
    })
    .catch(error => {
      alert(error.message);
    });
}

// LOGOUT
function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}
