// sesion.js — controla sesión, saludo, salir y carrito POR USUARIO
(function () {
  const $ = (s, ctx = document) => ctx.querySelector(s);

  /* ========= Helpers de sesión ========= */
  const obtenerSesion = () => {
    try { return JSON.parse(localStorage.getItem("sf_sesion") || "null"); }
    catch { return null; }
  };

  // Claves de carrito por usuario: sf_carrito_<correo_sanitizado>
  const sanitizarCorreo = (c) => (c || "invitado").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const claveCarritoPorCorreo = (correo) => `sf_carrito_${sanitizarCorreo(correo)}`;
  const claveCarritoActual = () => {
    const s = obtenerSesion();
    return s ? claveCarritoPorCorreo(s.correo) : "sf_carrito_invitado";
  };

  /* ========= Helpers de carrito (usuario actual) ========= */
  const leerCarrito = () => {
    const k = claveCarritoActual();
    const raw = localStorage.getItem(k);
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  };

  // Además de guardar, emitimos un evento para refrescar contadores en la misma pestaña
  const guardarCarrito = (arr) => {
    localStorage.setItem(claveCarritoActual(), JSON.stringify(arr));
    try { window.dispatchEvent(new CustomEvent("sf:carrito-actualizado")); } catch {}
  };

  /* ========= UI del navbar ========= */
  document.addEventListener("DOMContentLoaded", () => {
    const barra = $(".navbar");
    let enlaceLogin = $(".login") || $(".btn-salir"); // por si ya venía transformado
    if (!barra || !enlaceLogin) return;

    const sesion = obtenerSesion();

    // Contenedor a la derecha
    let areaUsuario = $(".area-usuario");
    if (!areaUsuario) {
      areaUsuario = document.createElement("div");
      areaUsuario.className = "area-usuario";
      barra.appendChild(areaUsuario);
    }

    // Mover el enlace/botón al contenedor derecho
    areaUsuario.appendChild(enlaceLogin);

    // Limpiar restos anteriores
    $(".btn-usuario")?.remove();
    $(".desplegable-usuario")?.remove();

    if (sesion) {
      const primerNombre = (sesion.nombre || sesion.correo || "Usuario").trim().split(" ")[0];

      // Botón “Hola, <nombre>”
      const btnUsuario = document.createElement("button");
      btnUsuario.type = "button";
      btnUsuario.className = "btn-usuario pildora-usuario";
      btnUsuario.innerHTML = `
        <i class="fa-regular fa-circle-user"></i>
        <span class="nombre">Hola, ${primerNombre}</span>`;
      areaUsuario.insertBefore(btnUsuario, enlaceLogin);

      // Dropdown con el enlace “Carrito (N)”
      const dd = document.createElement("div");
      dd.className = "desplegable-usuario";
      dd.innerHTML = `
        <a class="enlace-carro" href="carrito.html">
          <i class="fa-solid fa-cart-shopping"></i>
          <span class="texto">Carrito (<span class="contador-carro">0</span>)</span>
        </a>`;
      areaUsuario.appendChild(dd);

      const actualizarContador = () => {
        const el = dd.querySelector(".contador-carro");
        if (!el) return;
        const total = leerCarrito().reduce((acc, it) => acc + Number(it.cantidad ?? 1), 0);
        el.textContent = String(total);
      };

      // Contador actualizado al crear y al abrir
      actualizarContador();

      btnUsuario.addEventListener("click", () => {
        dd.classList.toggle("abierto");
        if (dd.classList.contains("abierto")) actualizarContador();
      });

      // Cerrar al hacer click fuera o con Escape
      document.addEventListener("click", (e) => {
        if (!areaUsuario.contains(e.target)) dd.classList.remove("abierto");
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") dd.classList.remove("abierto");
      });

      // Refrescar contador si cambia el carrito (otra pestaña) o en esta pestaña
      window.addEventListener("storage", (e) => {
        if (e.key === claveCarritoActual()) actualizarContador();
      });
      window.addEventListener("sf:carrito-actualizado", actualizarContador);

      // Botón “Salir”
      enlaceLogin.className = "btn-salir pildora-usuario";
      enlaceLogin.href = "#";
      enlaceLogin.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Salir`;
      enlaceLogin.addEventListener("click", (ev) => {
        ev.preventDefault();
        localStorage.removeItem("sf_sesion"); // no borramos su carrito
        window.location.replace("index.html");
      }, { once: true });

      // Evitar ver login/registro si ya hay sesión
      const ruta = location.pathname.toLowerCase();
      if (ruta.endsWith("/login.html") || ruta.endsWith("/registro.html")) {
        window.location.replace("index.html");
      }
    } else {
      // Sin sesión: mostrar “Login” con estilo de píldora
      enlaceLogin.className = "btn-login pildora-usuario";
      enlaceLogin.href = "login.html";
      enlaceLogin.innerHTML = `<i class="fa-regular fa-circle-user"></i> Login`;
    }
  });

  /* ========= Exponer helpers para el resto del sitio ========= */
  window.__SF__ = Object.assign(window.__SF__ || {}, {
    claveCarritoPorCorreo,
    claveCarritoActual,
    leerCarrito,
    guardarCarrito
  });
})();
