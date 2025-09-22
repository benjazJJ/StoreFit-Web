// Helper
const $ = (s, ctx=document) => ctx.querySelector(s);

document.addEventListener("click", (e)=>{
  const btn = e.target.closest(".ver-toggle");
  if(!btn) return;
  const input = document.querySelector(btn.getAttribute("data-toggle"));
  if(!input) return;

  const toText = input.type === "password";
  input.type = toText ? "text" : "password";
  btn.setAttribute("aria-pressed", toText);

  const icon = btn.querySelector("i");
  if(icon){
    icon.classList.toggle("fa-eye", !toText);
    icon.classList.toggle("fa-eye-slash", toText);
  }
});


// --- Datos Región → Comunas (mapeo corto) ---
const regiones = {
  "Región Metropolitana de Santiago": ["Santiago","Puente Alto","Maipú"],
  "Región del Biobío": ["Concepción","Talcahuano","San Pedro de la Paz"],
  "Región del Maule": ["Linares","Longaví","Talca"],
  "Región de Ñuble": ["Chillán","San Carlos","Bulnes"],
  "Región de La Araucanía": ["Temuco","Padre Las Casas","Villarrica"]
};

// Poblar regiones
const selRegion = $("#region");
const selComuna = $("#comuna");
for(const r of Object.keys(regiones)){
  const op = document.createElement("option");
  op.value = r; op.textContent = r;
  selRegion.appendChild(op);
}

selRegion.addEventListener("change", ()=>{
  selComuna.innerHTML = `<option value="">— Seleccione la comuna —</option>`;
  const elegido = selRegion.value;
  if(!elegido){
    selComuna.disabled = true; return;
  }
  regiones[elegido].forEach(c=>{
    const op = document.createElement("option");
    op.value = c; op.textContent = c;
    selComuna.appendChild(op);
  });
  selComuna.disabled = false;
});

// --- Validaciones ---
const form = $("#formRegistro");
const err = {
  nombre: $("#errNombre"),
  correo: $("#errCorreo"),
  pass: $("#errPass"),
  confirmar: $("#errConfirmar"),
  telefono: $("#errTelefono"),
  region: $("#errRegion"),
  comuna: $("#errComuna"),
};

const emailValido = (v)=> /^\S+@\S+\.\S+$/.test(String(v).trim());

function validar() {
  const nombre = $("#nombre").value.trim();
  const correo = $("#correo").value.trim();
  const pass = $("#contrasena").value;
  const confirmar = $("#confirmar").value;
  const tel = $("#telefono").value.trim();
  const region = selRegion.value;
  const comuna = selComuna.value;

  let ok = true;

  if(!nombre){
    err.nombre.textContent = "*Campo obligatorio";
    ok = false;
  } else err.nombre.textContent = "";

  if(!emailValido(correo)){
    err.correo.textContent = "*Campo obligatorio";
    ok = false;
  } else err.correo.textContent = "";

  if(pass.length < 4 || pass.length > 10){
    err.pass.textContent = "*Campo obligatorio";
    ok = false;
  } else err.pass.textContent = "";

  if (!confirmar) {
    err.confirmar.textContent = "*Campo obligatorio";
    ok = false;
  } else if (confirmar !== pass) {
    err.confirmar.textContent = "*Las contraseñas no coinciden";
    ok = false;
  } else {
    err.confirmar.textContent = "";
  }

  if(tel && !/^[0-9+\s-]{8,}$/.test(tel)){
    err.telefono.textContent = "*Campo obligatorio";
    ok = false;
  } else err.telefono.textContent = "";

  if(!region){
    err.region.textContent = "*Campo obligatorio";
    ok = false;
  } else err.region.textContent = "";

  if(!comuna){
    err.comuna.textContent = "*Campo obligatorio";
    ok = false;
  } else err.comuna.textContent = "";

  return ok;
}

form?.addEventListener("input", ()=>{});
form?.addEventListener("submit", (e)=>{
  e.preventDefault();
  if(!validar()) return;


  Swal.fire({
    icon: 'success',
    title: '¡Registro exitoso!',
    text: 'Tu cuenta ha sido creada correctamente.',
    confirmButtonColor: '#3085d6'
  });
  form.reset();
  selComuna.disabled = true;
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-registro");
  const correo = document.getElementById("correo");
  const clave = document.getElementById("clave");
  const nombre = document.getElementById("nombre");

  form.addEventListener("submit", (e) => {
    let valido = true;

    // Validar nombre
    if (nombre.value.trim() === "") {
      document.getElementById("error-nombre").textContent = "El nombre es obligatorio.";
      valido = false;
    } else {
      document.getElementById("error-nombre").textContent = "";
    }

    // Validar correo
    const regexCorreo = /^[\w.-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/;
    if (!regexCorreo.test(correo.value)) {
      document.getElementById("error-correo").textContent = "Correo inválido. Solo se permiten @duoc.cl, @profesor.duoc\.cl o @gmail.com.";
      valido = false;
    } else {
      document.getElementById("error-correo").textContent = "";
    }

    // Validar clave
    if (clave.value.length < 4 || clave.value.length > 10) {
      document.getElementById("error-clave").textContent = "La clave debe tener entre 4 y 10 caracteres.";
      valido = false;
    } else {
      document.getElementById("error-clave").textContent = "";
    }

    if (!valido) e.preventDefault();
  });
});
