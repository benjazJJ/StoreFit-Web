// ==================== Helpers generales ====================
const $ = (s, ctx = document) => ctx.querySelector(s);

// ===== Carrito por usuario: fusionar INVITADO → USUARIO =====
function sanitizarCorreo(c) {
  return (c || "invitado").toLowerCase().replace(/[^a-z0-9]/g, "_");
}
function claveCarritoPorCorreo(correo) {
  return `sf_carrito_${sanitizarCorreo(correo)}`;
}
function fusionarCarritoInvitado(correoUsuario) {
  const kInv = "sf_carrito_invitado";
  const kUsr = claveCarritoPorCorreo(correoUsuario);

  const invitado = JSON.parse(localStorage.getItem(kInv) || "[]");
  const propio   = JSON.parse(localStorage.getItem(kUsr) || "[]");

  if (!invitado.length) return; // nada que fusionar

  // Unificar por clave de ítem (id/sku o nombre+talla)
  const claveItem = (it) => {
    const base = (it.id ?? it.sku ?? it.nombre ?? it.name ?? JSON.stringify(it)).toString();
    return base + "|" + (it.talla ?? "");
  };

  const mapa = new Map();
  // Cargar carrito del usuario
  for (const it of propio) {
    mapa.set(claveItem(it), { ...it, cantidad: Number(it.cantidad ?? 1) });
  }
  // Sumar carrito de invitado
  for (const it of invitado) {
    const k = claveItem(it);
    const actual = mapa.get(k);
    if (actual) {
      actual.cantidad = Number(actual.cantidad ?? 1) + Number(it.cantidad ?? 1);
      mapa.set(k, actual);
    } else {
      mapa.set(k, { ...it, cantidad: Number(it.cantidad ?? 1) });
    }
  }

  const fusion = Array.from(mapa.values());
  localStorage.setItem(kUsr, JSON.stringify(fusion));
  localStorage.removeItem(kInv); // migrado
}

// ===== Mostrar/ocultar contraseña (botón con .ver-toggle y data-toggle="#id") =====
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".ver-toggle");
  if (!btn) return;
  const input = $(btn.getAttribute("data-toggle"));
  if (!input) return;

  const aTexto = input.type === "password";
  input.type = aTexto ? "text" : "password";

  const icon = btn.querySelector("i");
  if (icon) {
    icon.classList.toggle("fa-eye", !aTexto);
    icon.classList.toggle("fa-eye-slash", aTexto);
  }
});

// ===== Hash SHA-256 para comparar contraseñas =====
async function hash256(str) {
  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback (demo): NO usar en producción
  return "__plain__:" + str;
}

// ===== Validación de correo (OPCIÓN B) =====
const emailValido = (v) =>
  /^[\w.+-]+@(duocuc\.cl|profesorduoc\.cl|gmail\.com)$/i.test(String(v).trim());

// ==================== Elementos del formulario ====================
const form  = $("#formLogin");
const correo = $("#correoLogin");
const clave  = $("#claveLogin");
const errC   = $("#errCorreoLogin");
const errP   = $("#errClaveLogin");
const checkR = $("#recordarme");

function getUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios") || "[]");
}

// Prefill “Recordarme”
(function () {
  const remembered = localStorage.getItem("remember_email");
  if (remembered && correo) correo.value = remembered;
})();

// ==================== Submit Login ====================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validaciones rápidas
  let ok = true;
  if (!emailValido(correo.value)) {
    errC.textContent = "Correo inválido (solo duocuc.cl, profesorduoc.cl o gmail.com).";
    ok = false;
  } else errC.textContent = "";

  if (clave.value.length < 4 || clave.value.length > 10) {
    errP.textContent = "La contraseña debe tener entre 4 y 10 caracteres.";
    ok = false;
  } else errP.textContent = "";

  if (!ok) return;

  // Buscar usuario y comparar hash
  const usuarios = getUsuarios();
  const u = usuarios.find(x => x.correo.toLowerCase() === correo.value.trim().toLowerCase());
  if (!u) {
    errC.textContent = "Este correo no está registrado.";
    return;
  }

  const inputHash = await hash256(clave.value);
  const match =
    u.passHash === inputHash ||
    (u.passHash?.startsWith("__plain__:") && u.passHash === "__plain__:" + clave.value);

  if (!match) {
    errP.textContent = "Contraseña incorrecta.";
    return;
  }

  // Recordarme
  if (checkR.checked) localStorage.setItem("remember_email", correo.value.trim());
  else localStorage.removeItem("remember_email");

  // Crear “sesión” (demo)
  const sesion = { correo: u.correo, nombre: u.nombre, loginAt: new Date().toISOString() };
  localStorage.setItem("sf_sesion", JSON.stringify(sesion));

  // Fusionar carrito de invitado con el del usuario
  fusionarCarritoInvitado(u.correo);

  await Swal.fire({ icon: "success", title: "Bienvenido", text: `Hola, ${u.nombre}!` });

  // Redirigir (sin dejar el login en el historial)
  window.location.replace("index.html");
});
