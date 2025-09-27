// Aquí irán las validaciones de formularios con JavaScript
const DOMINIOS_PERMITIDOS = ["duoc.cl", "profesor.duoc.cl", "gmail.com"];

/* ============================
   UTILIDADES DE ERRORES
   ============================ */
function mostrarError(input, mensaje) {
    if (!input) return;
    input.classList.add("is-invalid");
    let ayuda = input.nextElementSibling;
    if (!ayuda || !ayuda.classList || !ayuda.classList.contains("error-msg")) {
        ayuda = document.createElement("div");
        ayuda.className = "error-msg";
        input.insertAdjacentElement("afterend", ayuda);
    }
    ayuda.textContent = mensaje;
}

function limpiarError(input) {
    if (!input) return;
    input.classList.remove("is-invalid");
    const ayuda = input.nextElementSibling;
    if (ayuda && ayuda.classList && ayuda.classList.contains("error-msg")) {
        ayuda.textContent = "";
    }
}

/* ============================
   VALIDADORES BÁSICOS
   ============================ */
function esRequerido(valor) {
    return valor != null && String(valor).trim() !== "";
}
function largoEntre(valor, min, max) {
    const len = (valor ?? "").trim().length;
    return len >= min && len <= max;
}
function esEmail(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || "").trim());
}
function dominioPermitido(valor) {
    const dom = String(valor || "").split("@")[1]?.toLowerCase() || "";
    return DOMINIOS_PERMITIDOS.includes(dom);
}
function esEnteroNoNegativo(valor) {
    if (valor === "" || valor === null || valor === undefined) return false;
    const n = Number(valor);
    return Number.isInteger(n) && n >= 0;
}
function esNumeroNoNegativo(valor) {
    if (valor === "" || valor === null || valor === undefined) return false;
    const n = Number(valor);
    return !Number.isNaN(n) && n >= 0;
}

/* ============================
   RUN/RUT CHILE SEGÚN DOCUMENTO
   - Sin puntos ni guion (ej: 19011022K)
   - Largo: 7 a 9
   - Debe ser válido
   ============================ */
function normalizarRun(run) {
    return String(run || "").replace(/\./g, "").replace(/-/g, "").toUpperCase();
}
function digitoVerificador(num) {
    let s = 1, m = 0;
    for (; num; num = Math.floor(num / 10)) {
        s = (s + (num % 10) * (9 - (m++ % 6))) % 11;
    }
    return s ? String(s - 1) : "K";
}
function runValido(run) {
    const r = normalizarRun(run);
    if (r.length < 7 || r.length > 9) return false;
    const cuerpo = r.slice(0, -1);
    const dv = r.slice(-1);
    if (!/^\d+$/.test(cuerpo)) return false;
    return digitoVerificador(Number(cuerpo)) === dv;
}

/* ============================
   VALIDACIÓN: USUARIO (ADMIN)
   Campos:
   - run (req, 7–9, sin puntos/guion, válido)
   - nombre (req, max 50)
   - apellidos (req, max 100)
   - correo (req, max 100, dominio permitido)
   - fecha_nacimiento (opcional)
   - tipo_usuario (select con Admin/Cliente/Vendedor)
   - región/comuna
   ============================ */
function validarUsuario(form) {
    let ok = true;

    const run = form.querySelector("[name='run']");
    const nombre = form.querySelector("[name='nombre']");
    const apellidos = form.querySelector("[name='apellidos']");
    const correo = form.querySelector("[name='correo']");
    const fecha = form.querySelector("[name='fecha_nacimiento']");
    const tipo = form.querySelector("[name='tipo_usuario']");
    const region = form.querySelector("[name='region']");
    const comuna = form.querySelector("[name='comuna']");

    // RUN
    limpiarError(run);
    if (!esRequerido(run?.value)) {
        mostrarError(run, "RUN requerido.");
        ok = false;
    } else {
        const r = normalizarRun(run.value);
        if (r.includes(".") || r.includes("-")) {
            mostrarError(run, "Ingrese RUN sin puntos ni guion (ej: 19011022K).");
            ok = false;
        } else if (!(r.length >= 7 && r.length <= 9)) {
            mostrarError(run, "RUN entre 7 y 9 caracteres.");
            ok = false;
        } else if (!runValido(r)) {
            mostrarError(run, "RUN inválido.");
            ok = false;
        }
    }

    // Nombre
    limpiarError(nombre);
    if (!esRequerido(nombre?.value) || !largoEntre(nombre.value, 1, 50)) {
        mostrarError(nombre, "Nombre requerido (máx. 50).");
        ok = false;
    }

    // Apellidos
    limpiarError(apellidos);
    if (!esRequerido(apellidos?.value) || !largoEntre(apellidos.value, 1, 100)) {
        mostrarError(apellidos, "Apellidos requeridos (máx. 100).");
        ok = false;
    }

    // Correo
    limpiarError(correo);
    if (!esRequerido(correo?.value) || !largoEntre(correo.value, 1, 100) || !esEmail(correo.value)) {
        mostrarError(correo, "Correo inválido (máx. 100).");
        ok = false;
    } else if (!dominioPermitido(correo.value)) {
        mostrarError(correo, "Dominio permitido: duoc.cl, profesor.duoc.cl o gmail.com.");
        ok = false;
    }


    // Tipo de usuario (select con Admin/Cliente/Vendedor)
    if (tipo) {
        limpiarError(tipo);
        if (!esRequerido(tipo.value)) {
            mostrarError(tipo, "Seleccione tipo de usuario.");
            ok = false;
        }
    }
    return ok;
}

/* ============================
   VALIDACIÓN: REGISTRO (TIENDA)
   "El registro es lo mismo que crear usuario en admin"
   + contraseña 4–10 (del documento de login)
   ============================ */
function validarRegistro(form) {
    let ok = validarUsuario(form); // reutilizamos las mismas reglas
    const clave = form.querySelector("[name='clave']");

    limpiarError(clave);
    if (!esRequerido(clave?.value) || !largoEntre(clave.value, 4, 10)) {
        mostrarError(clave, "Contraseña requerida (4 a 10 caracteres).");
        ok = false;
    }
    return ok;
}

/* ============================
   VALIDACIÓN: LOGIN (TIENDA)
   - Correo req. (máx 100) dominios permitidos
   - Contraseña 4–10
   ============================ */
function validarLogin(form) {
    let ok = true;
    const correo = form.querySelector("[name='correo']");
    const clave = form.querySelector("[name='clave']");

    limpiarError(correo);
    if (!esRequerido(correo?.value) || !largoEntre(correo.value, 1, 100) || !esEmail(correo.value)) {
        mostrarError(correo, "Correo inválido (máx. 100).");
        ok = false;
    } else if (!dominioPermitido(correo.value)) {
        mostrarError(correo, "Dominio permitido: duoc.cl, profesor.duoc.cl o gmail.com.");
        ok = false;
    }

    limpiarError(clave);
    if (!esRequerido(clave?.value) || !largoEntre(clave.value, 4, 10)) {
        mostrarError(clave, "Contraseña 4 a 10 caracteres.");
        ok = false;
    }
    return ok;
}

/* ============================
   VALIDACIÓN: CONTACTO (TIENDA)
   - Nombre req. (máx 100)
   - Correo (máx 100, dominios permitidos)
   - Comentario req. (máx 500)
   ============================ */
function validarContacto(form) {
    let ok = true;
    const nombre = form.querySelector("[name='nombre']");
    const correo = form.querySelector("[name='correo']");
    const mensaje = form.querySelector("[name='mensaje']");

    limpiarError(nombre);
    if (!esRequerido(nombre?.value) || !largoEntre(nombre.value, 1, 100)) {
        mostrarError(nombre, "Nombre requerido (máx. 100).");
        ok = false;
    }

    limpiarError(correo);
    if (!esEmail(correo?.value) || !largoEntre(correo.value, 1, 100)) {
        mostrarError(correo, "Correo inválido (máx. 100).");
        ok = false;
    } else if (!dominioPermitido(correo.value)) {
        mostrarError(correo, "Dominio permitido: duoc.cl, profesor.duoc.cl o gmail.com.");
        ok = false;
    }

    limpiarError(mensaje);
    if (!esRequerido(mensaje?.value) || !largoEntre(mensaje.value, 1, 500)) {
        mostrarError(mensaje, "Comentario requerido (máx. 500).");
        ok = false;
    }
    return ok;
}

/* ============================
   VALIDACIÓN: PRODUCTO (ADMIN)
   - Código: req, texto, min 3 (sin límite máximo)
   - Nombre: req, máx 100
   - Descripción: opcional, máx 500
   - Precio: req, min 0, decimales ok
   - Stock: req, min 0, entero
   - Stock crítico: opcional, min 0, entero
   - Categoría: requerida (select)
   ============================ */
function validarProducto(form) {
    let ok = true;

    const codigo = form.querySelector("[name='codigo']");
    const nombre = form.querySelector("[name='nombre']");
    const descripcion = form.querySelector("[name='descripcion']");
    const precio = form.querySelector("[name='precio']");
    const stock = form.querySelector("[name='stock']");
    const stockCritico = form.querySelector("[name='stock_critico']");
    const categoria = form.querySelector("[name='categoria']");

    // Código
    limpiarError(codigo);
    if (!esRequerido(codigo?.value) || !largoEntre(codigo.value, 3, 10_000)) {
        mostrarError(codigo, "Código requerido (mín. 3 caracteres).");
        ok = false;
    }

    // Nombre
    limpiarError(nombre);
    if (!esRequerido(nombre?.value) || !largoEntre(nombre.value, 1, 100)) {
        mostrarError(nombre, "Nombre requerido (máx. 100).");
        ok = false;
    }

    // Descripción (opcional máx 500)
    if (descripcion && descripcion.value && !largoEntre(descripcion.value, 0, 500)) {
        mostrarError(descripcion, "Descripción: máximo 500 caracteres.");
        ok = false;
    } else {
        limpiarError(descripcion);
    }

    // Precio (req, min 0, decimales ok)
    limpiarError(precio);
    if (!esNumeroNoNegativo(precio?.value)) {
        mostrarError(precio, "Precio requerido (≥ 0). Se permiten decimales.");
        ok = false;
    }

    // Stock (req, min 0, entero)
    limpiarError(stock);
    if (!esEnteroNoNegativo(stock?.value)) {
        mostrarError(stock, "Stock requerido (entero ≥ 0).");
        ok = false;
    }

    // Stock crítico (opcional, entero ≥ 0)
    if (stockCritico && stockCritico.value !== "") {
        if (!esEnteroNoNegativo(stockCritico.value)) {
            mostrarError(stockCritico, "Stock crítico: entero ≥ 0.");
            ok = false;
        } else {
            limpiarError(stockCritico);
        }
    } else {
        limpiarError(stockCritico);
    }

    // Categoría (req)
    if (categoria) {
        limpiarError(categoria);
        if (!esRequerido(categoria.value)) {
            mostrarError(categoria, "Seleccione una categoría.");
            ok = false;
        }
    }

    return ok;
}

/* ============================
   ENGANCHE AUTOMÁTICO
   (si el form existe, lo valido)
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
    const fRegistro = document.getElementById("form-registro");
    const fLogin = document.getElementById("form-login");
    const fContacto = document.getElementById("form-contacto");
    const fProducto = document.getElementById("form-producto");
    const fUsuario = document.getElementById("form-usuario");

    if (fRegistro) {
        fRegistro.addEventListener("submit", (e) => { if (!validarRegistro(fRegistro)) e.preventDefault(); });
        fRegistro.querySelectorAll("input, select, textarea").forEach(el => el.addEventListener("blur", () => validarRegistro(fRegistro)));
    }
    if (fLogin) {
        fLogin.addEventListener("submit", (e) => { if (!validarLogin(fLogin)) e.preventDefault(); });
        fLogin.querySelectorAll("input").forEach(el => el.addEventListener("blur", () => validarLogin(fLogin)));
    }
    if (fContacto) {
        fContacto.addEventListener("submit", (e) => { if (!validarContacto(fContacto)) e.preventDefault(); });
        fContacto.querySelectorAll("input, textarea").forEach(el => el.addEventListener("blur", () => validarContacto(fContacto)));
    }
    if (fProducto) {
        fProducto.addEventListener("submit", (e) => { if (!validarProducto(fProducto)) e.preventDefault(); });
        fProducto.querySelectorAll("input, select, textarea").forEach(el => el.addEventListener("blur", () => validarProducto(fProducto)));
    }
    if (fUsuario) {
        fUsuario.addEventListener("submit", (e) => { if (!validarUsuario(fUsuario)) e.preventDefault(); });
        fUsuario.querySelectorAll("input, select").forEach(el => el.addEventListener("blur", () => validarUsuario(fUsuario)));
    }
});
