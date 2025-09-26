/* =========================================================
   StoreFit Admin (versión simple y humana, SIN paginación)
   SIN expresiones regulares
   ---------------------------------------------------------
   Este archivo maneja:
   - Guardado/lectura en localStorage
   - Datos base (categorías y regiones)
   - Utilidades de DOM y avisos (toast)
   - Validaciones de Producto y Usuario
   - Pantalla de Productos (CRUD básico)
   - Pantalla de Usuarios (CRUD básico)
   ========================================================= */

/* ===================== ALMACENAMIENTO ==================== */
// Claves únicas para guardar listas en el navegador
const CLAVES = {
  productos: "sf_admin_productos",
  usuarios: "sf_admin_usuarios",
};

// Lee una lista desde localStorage. Si no existe o está mal formada, devuelve []
function leerLista(clave) {
  const texto = localStorage.getItem(clave);
  if (!texto) return [];
  try { return JSON.parse(texto); } catch { return []; }
}

// Guarda una lista (array) en localStorage como texto JSON
function guardarLista(clave, arreglo) {
  localStorage.setItem(clave, JSON.stringify(arreglo));
}

/* ===================== DATOS BASE ========================= */
// Categorías disponibles para los productos (combo del formulario)
const CATEGORIAS = ["Poleras", "Polerones", "Pantalones", "Zapatillas", "Accesorios"];

// Regiones y comunas (para el formulario de usuarios)
const REGIONES = [
  { nombre: "Metropolitana", comunas: ["Santiago", "Providencia", "Puente Alto", "Maipú"] },
  { nombre: "Valparaíso", comunas: ["Valparaíso", "Viña del Mar", "Quilpué"] },
];

/* ===================== UTILIDADES ========================= */
// Atajo para buscar un elemento del DOM (como document.querySelector)
function $(sel, raiz = document) { return raiz.querySelector(sel); }

// Crea un elemento del DOM y le aplica propiedades de una vez
function crear(tag, props = {}) {
  const el = document.createElement(tag);
  Object.assign(el, props);
  return el;
}

// Muestra un mensaje temporal (tipo "toast") en pantalla
function mostrarToast(msg, ms = 2200) {
  const t = $("#toast");
  if (!t) return;                 // Si no hay contenedor, no hace nada
  t.textContent = msg;            // Texto del aviso
  t.classList.add("show");        // Lo muestra con la clase .show (CSS)
  setTimeout(() => t.classList.remove("show"), ms); // Lo oculta luego de ms
}

/* ===================== VALIDACIONES (sin regex) =========== */
/*
  Las validaciones están pensadas para ser fáciles de explicar:
  - Se usan split, bucles y comparaciones.
  - No hay expresiones regulares.
*/

// Valida que el correo tenga un '@' y pertenezca a un dominio permitido
function correoValido(correo) {
  const v = String(correo || "").trim().toLowerCase();
  if (v.length === 0 || v.length > 100) return false;

  const partes = v.split("@");            // Separa nombre y dominio
  if (partes.length !== 2) return false;

  const nombre = partes[0];              // Antes de '@'
  const dominio = partes[1];              // Después de '@'
  if (nombre.length === 0) return false;

  const permitidos = ["duoc.cl", "profesor.duoc.cl", "gmail.com"];
  for (let i = 0; i < permitidos.length; i++) {
    if (dominio === permitidos[i]) return true; // Dominio válido
  }
  return false;
}

// Quita puntos y guion del RUN para trabajar siempre con el mismo formato
function limpiarRun(run) {
  let s = String(run || "").toUpperCase().trim();
  let limpio = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== "." && c !== "-") limpio += c; // Ignora . y -
  }
  return limpio;
}

// Valida RUN chileno: tamaño, que el cuerpo sea numérico y que el DV sea correcto (módulo 11)
function runValido(run) {
  const r = limpiarRun(run);
  if (r.length < 7 || r.length > 9) return false;

  const cuerpo = r.slice(0, -1); // Todo menos el último carácter
  const dv = r.slice(-1);    // Dígito verificador

  // Verifica que el cuerpo tenga solo números
  for (let i = 0; i < cuerpo.length; i++) {
    const c = cuerpo[i];
    if (c < "0" || c > "9") return false;
  }

  // DV debe ser 0..9 o 'K'
  const dvMayus = dv.toUpperCase();
  if (!(dvMayus === "K" || (dvMayus >= "0" && dvMayus <= "9"))) return false;

  // Cálculo del DV con la serie 2..7
  let suma = 0, mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mul;
    mul = (mul === 7) ? 2 : (mul + 1);
  }
  const resto = suma % 11;
  const res = 11 - resto;
  const dvCalc = res === 11 ? "0" : (res === 10 ? "K" : String(res));

  return dvMayus === dvCalc; // DV correcto
}

// Revisa que un producto cumpla con lo mínimo para guardarse
function validarProducto(p) {
  const errores = [];

  if (!p.codigo || p.codigo.trim().length < 3) errores.push("Código: mínimo 3 caracteres.");
  if (!p.nombre || p.nombre.trim().length === 0) errores.push("Nombre es requerido.");

  if (p.descripcion && String(p.descripcion).length > 500) errores.push("Descripción: máx. 500.");

  // Precio: número >= 0
  const precio = Number(String(p.precio).trim());
  if (!Number.isFinite(precio) || precio < 0) errores.push("Precio debe ser un número ≥ 0.");

  // Stock: entero >= 0
  const stock = Number(String(p.stock).trim());
  if (!Number.isInteger(stock) || stock < 0) errores.push("Stock debe ser entero ≥ 0.");

  // Stock crítico: puede venir vacío; si viene, debe ser entero >= 0
  const scTexto = String(p.stockCritico ?? "").trim();
  if (scTexto !== "") {
    const sc = Number(scTexto);
    if (!Number.isInteger(sc) || sc < 0) errores.push("Stock crítico entero ≥ 0.");
  }

  if (!p.categoria) errores.push("Seleccione una categoría.");

  return errores; // Devuelve array de mensajes; vacío = válido
}

// Revisa que un usuario tenga datos mínimos válidos
function validarUsuario(u) {
  const errores = [];

  if (!u.run || !runValido(u.run)) errores.push("RUN inválido (sin puntos ni guion, con dígito verificador).");

  const nombre = String(u.nombre || "").trim();
  if (nombre.length === 0) errores.push("Nombre es requerido.");

  const apellidos = String(u.apellidos || "").trim();
  if (apellidos.length === 0) errores.push("Apellidos son requeridos.");

  if (!correoValido(u.correo)) errores.push("Correo inválido (duoc.cl, profesor.duoc.cl o gmail.com).");

  if (!u.rol) errores.push("Seleccione tipo de usuario.");
  if (!u.region) errores.push("Seleccione región.");
  if (!u.comuna) errores.push("Seleccione comuna.");

  const direccion = String(u.direccion || "").trim();
  if (direccion.length === 0) errores.push("Dirección es requerida.");

  return errores;
}

/* ===================== PRODUCTOS (sin paginación) ========= */
// Lógica de la página de Productos (listar, buscar, crear, editar, eliminar)
function iniciarProductos() {
  // Referencias a elementos del DOM
  const cuerpo = $("#tbody-productos");  // <tbody> donde se pintan las filas
  const dialogo = $("#dlg-producto");     // <dialog> del formulario
  const form = $("#frm-producto");     // <form> con los campos del producto
  const cajaErrores = $("#errors-prod");      // contenedor de mensajes de error
  const selCategoria = form.elements["categoria"]; // <select> de categorías
  const campoBuscar = $("#q-prod");           // input de búsqueda

  // Llenar combo de categorías
  selCategoria.innerHTML = `<option value="">Seleccione</option>` + CATEGORIAS.map(c => `<option>${c}</option>`).join("");

  // Carga inicial de productos desde localStorage o datos de demo
  let productos = leerLista(CLAVES.productos);
  if (productos.length === 0) {
    productos = [
      { codigo: "POL-001", nombre: "Polera Training", precio: 12990, stock: 5, stockCritico: 3, categoria: "Poleras", descripcion: "", imagen: "" },
      { codigo: "POL-002", nombre: "Polera Oversize", precio: 14990, stock: 2, stockCritico: 4, categoria: "Poleras", descripcion: "", imagen: "" },
      { codigo: "PNT-101", nombre: "Pantalón Cargo", precio: 24990, stock: 12, stockCritico: "", categoria: "Pantalones", descripcion: "", imagen: "" },
      { codigo: "ZAP-300", nombre: "Zapatilla Air Star", precio: 59990, stock: 0, stockCritico: 2, categoria: "Zapatillas", descripcion: "", imagen: "" },
    ];
    guardarLista(CLAVES.productos, productos); // Persistimos los demo
  }

  // Estado de búsqueda (solo texto)
  const estado = { texto: "" };

  // Devuelve la lista filtrada según lo escrito en el buscador
  function filtrar() {
    const t = String(estado.texto || "").trim().toLowerCase();
    if (!t) return productos;
    const res = [];
    for (let i = 0; i < productos.length; i++) {
      const p = productos[i];
      if (p.codigo.toLowerCase().includes(t) || p.nombre.toLowerCase().includes(t)) res.push(p);
    }
    return res;
  }

  // Dibuja la tabla con la lista actual (se llama al cargar, crear, editar, eliminar, buscar)
  function pintar() {
    const lista = filtrar();
    cuerpo.innerHTML = ""; // Limpia la tabla

    for (let i = 0; i < lista.length; i++) {
      const p = lista[i];

      // Marca filas con stock crítico (si stock <= stockCritico)
      const esCritico = String(p.stockCritico ?? "").trim() !== "" && Number(p.stock) <= Number(p.stockCritico);

      // Crea una fila (<tr>) y sus celdas
      const tr = document.createElement("tr");
      if (esCritico) tr.classList.add("danger"); // Clase CSS para destacar

      // Contenido de la fila con botones de Editar/Eliminar
      tr.innerHTML = `
        <td><code>${p.codigo}</code></td>
        <td>${p.nombre}</td>
        <td>$${Number(p.precio).toFixed(2)}</td>
        <td>${p.stock}${esCritico ? ' <span class="badge danger">Crítico</span>' : ''}</td>
        <td>${p.categoria}</td>
        <td style="text-align:right">
          <button class="btn ghost" data-editar="${encodeURIComponent(p.codigo)}">Editar</button>
          <button class="btn"        data-eliminar="${encodeURIComponent(p.codigo)}">Eliminar</button>
        </td>
      `;

      // Agrega la fila al <tbody>
      cuerpo.appendChild(tr);
    }
  }

  // Pintado inicial
  pintar();

  // Botón "Nuevo" abre el diálogo vacío para crear un producto
  $("#btn-nuevo").addEventListener("click", () => {
    form.reset();                      // Limpia formulario
    form.__editIndex.value = "";       // Vacía el índice de edición (modo crear)
    $("#dlg-title").textContent = "Nuevo producto";
    cajaErrores.hidden = true;         // Oculta errores previos
    dialogo.showModal();               // Abre ventana modal
  });

  // Botón "Cancelar" cierra el diálogo
  $("#btn-cancelar").addEventListener("click", () => dialogo.close());

  // Maneja los clics dentro de la tabla para Editar o Eliminar
  cuerpo.addEventListener("click", (e) => {
    const codDel = e.target.dataset.eliminar;
    const codEd = e.target.dataset.editar;

    // Eliminar producto por código
    if (codDel) {
      const codigo = decodeURIComponent(codDel);
      const pos = productos.findIndex(x => x.codigo === codigo);
      if (pos > -1) {
        productos.splice(pos, 1);                      // Saca el producto del array
        guardarLista(CLAVES.productos, productos);     // Persiste cambios
        mostrarToast("Producto eliminado");            // Aviso visual
        pintar();                                      // Refresca tabla
      }
    }

    // Editar producto: carga datos al formulario y abre el diálogo
    if (codEd) {
      const codigo = decodeURIComponent(codEd);
      const p = productos.find(x => x.codigo === codigo);
      if (!p) return;

      // Llenamos el formulario con los datos del producto
      form.codigo.value = p.codigo;
      form.nombre.value = p.nombre;
      form.precio.value = p.precio;
      form.stock.value = p.stock;
      form.stockCritico.value = String(p.stockCritico ?? "");
      form.categoria.value = p.categoria;
      form.descripcion.value = String(p.descripcion ?? "");
      form.imagen.value = String(p.imagen ?? "");

      form.__editIndex.value = p.codigo;            // Marcamos modo edición
      $("#dlg-title").textContent = "Editar producto";
      cajaErrores.hidden = true;
      dialogo.showModal();
    }
  });

  // Guarda (crear/editar) cuando se presiona el botón del formulario
  $("#btn-guardar").addEventListener("click", (ev) => {
    ev.preventDefault(); // Evita recargar la página

    // Tomamos los valores del formulario
    const p = {
      codigo: String(form.codigo.value).trim(),
      nombre: String(form.nombre.value).trim(),
      precio: form.precio.value,
      stock: form.stock.value,
      stockCritico: String(form.stockCritico.value).trim(),
      categoria: form.categoria.value,
      descripcion: String(form.descripcion.value).trim(),
      imagen: String(form.imagen.value).trim(),
    };

    // Validamos y mostramos errores si los hay
    const errores = validarProducto(p);
    if (errores.length) {
      cajaErrores.innerHTML = "<ul><li>" + errores.join("</li><li>") + "</li></ul>";
      cajaErrores.hidden = false;
      return;
    }

    const claveEdicion = form.__editIndex.value;

    if (claveEdicion) {
      // Modo EDITAR: reemplaza el producto en su posición
      const i = productos.findIndex(x => x.codigo === claveEdicion);
      if (i > -1) productos[i] = p;
      mostrarToast("Producto actualizado");
    } else {
      // Modo CREAR: evita códigos duplicados
      const dup = productos.some(x => String(x.codigo).toLowerCase() === p.codigo.toLowerCase());
      if (dup) {
        cajaErrores.textContent = "Ya existe un producto con ese código.";
        cajaErrores.hidden = false;
        return;
      }
      productos.push(p);
      mostrarToast("Producto creado");
    }

    // Persistimos y refrescamos
    guardarLista(CLAVES.productos, productos);
    dialogo.close();
    pintar();

    // Aviso extra si quedó con stock crítico
    if (p.stockCritico !== "" && Number(p.stock) <= Number(p.stockCritico)) {
      mostrarToast("⚠ Stock en nivel crítico para " + p.nombre, 2600);
    }
  });

  // Búsqueda en vivo: al escribir, se actualiza el estado y se repinta
  campoBuscar.addEventListener("input", () => {
    estado.texto = campoBuscar.value;
    pintar();
  });
}

/* ===================== USUARIOS (sin paginación) ========== */
// Lógica de la página de Usuarios (listar, buscar, crear, editar, eliminar)
function iniciarUsuarios() {
  // Referencias a elementos del DOM
  const cuerpo = $("#tbody-usuarios");
  const dialogo = $("#dlg-usuario");
  const form = $("#frm-usuario");
  const cajaErrores = $("#errors-usr");
  const selRegion = form.elements["region"];
  const selComuna = form.elements["comuna"];
  const campoBuscar = $("#q-usr");

  // Pobla el combo de regiones y deja comunas en blanco hasta que elijan región
  selRegion.innerHTML = `<option value="">Seleccione</option>` + REGIONES.map(r => `<option>${r.nombre}</option>`).join("");
  selComuna.innerHTML = `<option value="">Seleccione</option>`;

  // Cuando cambia la región, actualiza la lista de comunas
  selRegion.addEventListener("change", () => {
    const r = REGIONES.find(x => x.nombre === selRegion.value);
    const opciones = r ? r.comunas.map(c => `<option>${c}</option>`).join("") : "";
    selComuna.innerHTML = `<option value="">Seleccione</option>` + opciones;
  });

  // Carga inicial de usuarios desde localStorage o un usuario de demo
  let usuarios = leerLista(CLAVES.usuarios);
  if (usuarios.length === 0) {
    usuarios = [
      { run: "19011022K", nombre: "Benjamín", apellidos: "Palma", correo: "bp@duoc.cl", fechaNac: "", rol: "Administrador", region: "Metropolitana", comuna: "Santiago", direccion: "Alameda 123" },
    ];
    guardarLista(CLAVES.usuarios, usuarios);
  }

  // Estado de búsqueda (solo texto)
  const estado = { texto: "" };

  // Filtra por RUN, nombre completo o correo
  function filtrar() {
    const t = String(estado.texto || "").trim().toLowerCase();
    if (!t) return usuarios;
    const res = [];
    for (let i = 0; i < usuarios.length; i++) {
      const u = usuarios[i];
      const nombreCompleto = (u.nombre + " " + u.apellidos).toLowerCase();
      if (u.run.toLowerCase().includes(t) || nombreCompleto.includes(t) || u.correo.toLowerCase().includes(t)) {
        res.push(u);
      }
    }
    return res;
  }

  // Dibuja la tabla de usuarios en pantalla
  function pintar() {
    const lista = filtrar();
    cuerpo.innerHTML = ""; // Limpia la tabla

    for (let i = 0; i < lista.length; i++) {
      const u = lista[i];

      // Crea una fila por usuario con botones de editar y eliminar
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><code>${u.run}</code></td>
        <td>${u.nombre} ${u.apellidos}</td>
        <td>${u.correo}</td>
        <td>${u.rol}</td>
        <td>${u.region}</td>
        <td>${u.comuna}</td>
        <td style="text-align:right">
          <button class="btn ghost" data-editar="${u.run}">Editar</button>
          <button class="btn"        data-eliminar="${u.run}">Eliminar</button>
        </td>
      `;
      cuerpo.appendChild(tr);
    }
  }

  // Pintado inicial
  pintar();

  // Abre diálogo vacío para crear usuario nuevo
  $("#btn-nuevo-usr").addEventListener("click", () => {
    form.reset();
    form.__editIndex.value = "";             // Modo crear
    $("#dlg-title-usr").textContent = "Nuevo usuario";
    cajaErrores.hidden = true;
    dialogo.showModal();
  });

  // Cierra diálogo sin cambios
  $("#btn-cancelar-usr").addEventListener("click", () => dialogo.close());

  // Manejo de clics en la tabla (editar/eliminar)
  cuerpo.addEventListener("click", (e) => {
    const runDel = e.target.dataset.eliminar;
    const runEd = e.target.dataset.editar;

    // Eliminar usuario
    if (runDel) {
      const pos = usuarios.findIndex(x => x.run === runDel);
      if (pos > -1) {
        usuarios.splice(pos, 1);
        guardarLista(CLAVES.usuarios, usuarios);
        mostrarToast("Usuario eliminado");
        pintar();
      }
    }

    // Editar usuario: carga datos en el formulario y abre diálogo
    if (runEd) {
      const u = usuarios.find(x => x.run === runEd);
      if (!u) return;

      form.run.value = u.run;
      form.nombre.value = u.nombre;
      form.apellidos.value = u.apellidos;
      form.correo.value = u.correo;
      form.fechaNac.value = u.fechaNac || "";
      form.rol.value = u.rol;

      form.region.value = u.region;
      selRegion.dispatchEvent(new Event("change")); // Rellena comunas según la región
      form.comuna.value = u.comuna;

      form.direccion.value = u.direccion;
      form.__editIndex.value = u.run;                // Modo edición activado

      $("#dlg-title-usr").textContent = "Editar usuario";
      cajaErrores.hidden = true;
      dialogo.showModal();
    }
  });

  // Guardar (crear/editar) usuario desde el formulario
  $("#btn-guardar-usr").addEventListener("click", (ev) => {
    ev.preventDefault();

    // Arma el objeto usuario con los datos del formulario
    const u = {
      run: String(form.run.value).trim(),
      nombre: String(form.nombre.value).trim(),
      apellidos: String(form.apellidos.value).trim(),
      correo: String(form.correo.value).trim(),
      fechaNac: form.fechaNac.value || "",
      rol: form.rol.value,
      region: form.region.value,
      comuna: form.comuna.value,
      direccion: String(form.direccion.value).trim(),
    };

    // Valida y muestra errores si corresponde
    const errores = validarUsuario(u);
    if (errores.length) {
      cajaErrores.innerHTML = "<ul><li>" + errores.join("</li><li>") + "</li></ul>";
      cajaErrores.hidden = false;
      return;
    }

    const claveEdicion = form.__editIndex.value;

    if (claveEdicion) {
      // EDITAR: reemplaza al usuario que coincide con el RUN original
      const i = usuarios.findIndex(x => x.run === claveEdicion);
      if (i > -1) usuarios[i] = u;
      mostrarToast("Usuario actualizado");
    } else {
      // CREAR: evita duplicado por RUN (insensible a mayúsculas/minúsculas)
      const dup = usuarios.some(x => String(x.run).toUpperCase() === u.run.toUpperCase());
      if (dup) {
        cajaErrores.textContent = "Ya existe un usuario con ese RUN.";
        cajaErrores.hidden = false;
        return;
      }
      usuarios.push(u);
      mostrarToast("Usuario creado");
    }

    // Persistimos y refrescamos
    guardarLista(CLAVES.usuarios, usuarios);
    dialogo.close();
    pintar();
  });

  // Búsqueda en vivo
  campoBuscar.addEventListener("input", () => {
    estado.texto = campoBuscar.value;
    pintar();
  });
}

/* ===================== INICIO (en cada página) ============= */
// Detecta qué página es (por data-page en el <body>) y levanta el módulo correcto
document.addEventListener("DOMContentLoaded", () => {
  const pagina = document.body.dataset.page;

  // Marca en el menú lateral la sección activa
  document.querySelectorAll(".sidebar .nav-item").forEach(a => {
    const esActiva =
      (pagina === "home" && a.href.includes("index.html")) ||
      (pagina === "productos" && a.href.includes("productos.html")) ||
      (pagina === "usuarios" && a.href.includes("usuarios.html"));
    if (esActiva) a.classList.add("active");
  });

  // Arranca la lógica según la página
  if (pagina === "productos") { iniciarProductos(); return; }
  if (pagina === "usuarios") { iniciarUsuarios(); return; }
});
