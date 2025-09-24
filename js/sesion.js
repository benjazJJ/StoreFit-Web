(function () {
  const $ = (s, ctx = document) => ctx.querySelector(s);

  const obtenerSesion = () => {
    try { return JSON.parse(localStorage.getItem("sf_sesion") || "null"); }
    catch { return null; }
  };

  const sanitizarCorreo = (c) => (c || "invitado").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const claveCarritoPorCorreo = (correo) => `sf_carrito_${sanitizarCorreo(correo)}`;
  const claveCarritoActual = () => {
    const s = obtenerSesion();
    return s ? claveCarritoPorCorreo(s.correo) : "sf_carrito_invitado";
  };

  const leerCarrito = () => {
    const k = claveCarritoActual();
    const raw = localStorage.getItem(k);
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  };

  const guardarCarrito = (arr) => {
    localStorage.setItem(claveCarritoActual(), JSON.stringify(arr));
    try { window.dispatchEvent(new CustomEvent("sf:carrito-actualizado")); } catch { }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const barra = $(".navbar");
    let enlaceLogin = $(".login") || $(".btn-salir");
    if (!barra || !enlaceLogin) return;

    const sesion = obtenerSesion();

    // Limpiar elementos anteriores
    $(".btn-usuario")?.remove();
    $(".desplegable-usuario")?.remove();

    if (sesion) {
      // Usuario logueado - reemplazar el botón login
      const primerNombre = (sesion.nombre || sesion.correo || "Usuario").trim().split(" ")[0];

      // Crear contenedor para usuario logueado
      const areaUsuario = document.createElement("div");
      areaUsuario.className = "area-usuario";

      const btnUsuario = document.createElement("button");
      btnUsuario.type = "button";
      btnUsuario.className = "btn-usuario login"; // Usa la clase .login existente
      btnUsuario.innerHTML = `
        <i class="fa-regular fa-circle-user"></i>
        <span class="nombre">Hola, ${primerNombre}</span>`;

      // Crear desplegable - SOLO con cerrar sesión
      const dd = document.createElement("div");
      dd.className = "desplegable-usuario";
      dd.innerHTML = `
        <div class="dp-item">
          <button type="button" class="btn-salir-desplegable">
            <i class="fa-solid fa-right-from-bracket"></i>
            Cerrar sesión
          </button>
        </div>`;

      // Agregar elementos al área de usuario
      areaUsuario.appendChild(btnUsuario);
      areaUsuario.appendChild(dd);

      // Reemplazar el botón login original con el área de usuario
      enlaceLogin.parentNode.replaceChild(areaUsuario, enlaceLogin);

      btnUsuario.addEventListener("click", () => {
        dd.classList.toggle("abierto");
      });

      document.addEventListener("click", (e) => {
        if (!areaUsuario.contains(e.target)) dd.classList.remove("abierto");
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") dd.classList.remove("abierto");
      });

      // Botón salir del desplegable
      dd.querySelector('.btn-salir-desplegable').addEventListener("click", (ev) => {
        ev.preventDefault();
        localStorage.removeItem("sf_sesion");
        window.location.replace("index.html");
      });

      // Redireccionar si está en login/registro
      const ruta = location.pathname.toLowerCase();
      if (ruta.endsWith("/login.html") || ruta.endsWith("/registro.html")) {
        window.location.replace("index.html");
      }
    } else {
      // Usuario no logueado - mantener el botón Login original
      enlaceLogin.className = "login";
      enlaceLogin.href = "login.html";
      enlaceLogin.innerHTML = `<i class="fa-regular fa-circle-user"></i> Login`;
    }
  });

  window.__SF__ = Object.assign(window.__SF__ || {}, {
    claveCarritoPorCorreo,
    claveCarritoActual,
    leerCarrito,
    guardarCarrito
  });
})();