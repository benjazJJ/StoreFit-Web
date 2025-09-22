/* ===================== CARRITO POR USUARIO ===================== */
/* Siempre toma los helpers desde window.__SF__ en tiempo de ejecución.
   Si por alguna razón sesion.js no está listo, usa “invitado”. */

/* === Opción 2: Mapa centralizado de imágenes en JS ===
   - Si existe window.IMAGENES_PRODUCTO lo usamos (permite sobreescribir desde HTML si quieres).
   - Si no, usamos este mapa local por defecto.
*/
const IMAGENES_PRODUCTO_LOCAL = {
  1: 'img/PoleraStorefit.png',
  2: 'img/PoleronStorefit.png',
  3: 'img/BuzosStoreFit.png',
  4: 'img/TopMujer.png'
};

function leerCarrito() {
  const f = window.__SF__?.leerCarrito;
  if (typeof f === "function") return f();
  return JSON.parse(localStorage.getItem("sf_carrito_invitado") || "[]");
}

function guardarCarrito(arr) {
  const f = window.__SF__?.guardarCarrito;
  if (typeof f === "function") {
    f(arr);
  } else {
    localStorage.setItem("sf_carrito_invitado", JSON.stringify(arr));
    // avisa para refrescar contadores en esta pestaña
    try { window.dispatchEvent(new CustomEvent("sf:carrito-actualizado")); } catch {}
  }
}

// Carga inicial del carrito vigente
let carrito = [];
try { carrito = leerCarrito(); }
catch { guardarCarrito([]); carrito = []; }

/* ================================================================
   STOCK DE EJEMPLO
   - Puedes usar un número (stock global por producto)
   - O un objeto por talla { XS: n, S: n, ... }
   Ajusta a tu realidad.
================================================================ */
const stockProductos = {
  1: { XS: 3, S: 5, M: 5, L: 4, XL: 2, XXL: 1 }, // Polera con stock por talla
  2: 3,                                          // Polerón: stock global
  3: 8,                                          // Buzo: stock global
  4: { XS: 2, S: 3, M: 4, L: 3, XL: 2, XXL: 2 }  // Zapatillas con stock por talla
};

/* Helpers de stock / formato */
function normalizarTalla(t) {
  return (t || "").toString().trim().toUpperCase();
}
function getStockDisponible(idProducto, tallaSeleccionada) {
  const stock = stockProductos[idProducto];
  if (stock == null) return Infinity; // si no definiste stock, no limita
  if (typeof stock === "number") return stock; // stock global
  const t = normalizarTalla(tallaSeleccionada);
  if (!t) return 0; // si se exige talla y no viene, sin stock
  const porTalla = Number(stock[t] ?? 0);
  return Number.isFinite(porTalla) ? porTalla : 0;
}

/* === Imagen por producto (prioridades):
   1) p.imagenUrl (si vino desde el botón/HTML)
   2) window.IMAGENES_PRODUCTO (si lo defines en HTML)
   3) IMAGENES_PRODUCTO_LOCAL (este archivo)
   4) Convención por id en /img/productos/<id>.jpg
*/
function getImagenProducto(p) {
  const mapa = window.IMAGENES_PRODUCTO || IMAGENES_PRODUCTO_LOCAL;
  return p.imagenUrl
      || (mapa && mapa[p.id])
      || `img/productos/${p.id}.jpg`;
}

/* ================================================================
   Agregar al carrito (expuesta en window para usar desde los botones)
   Firma: (idProducto, nombreProducto, precioProducto, tallaSeleccionada, imagenUrl?)
================================================================ */
window.agregarAlCarrito = function (idProducto, nombreProducto, precioProducto, tallaSeleccionada, imagenUrl) {
  // Leer SIEMPRE del origen vigente
  carrito = leerCarrito();

  const tallaNorm = normalizarTalla(tallaSeleccionada) || null;

  // Ítems se agrupan por id + talla
  const existente = carrito.find(p => p.id === idProducto && (p.talla || null) === tallaNorm);

  const stockDisponible = typeof stockProductos[idProducto] === "number"
    ? Number(stockProductos[idProducto])
    : getStockDisponible(idProducto, tallaNorm);

  // Cuántas unidades ya llevo de ESTA combinación id+talla
  const cantidadActual = existente ? existente.cantidad : 0;

  if (cantidadActual >= stockDisponible && Number.isFinite(stockDisponible)) {
    Swal?.fire({
      title: 'Stock insuficiente',
      text: `No puedes agregar más de ${stockDisponible} unidades de "${nombreProducto}"${tallaNorm ? ` (Talla ${tallaNorm})` : ""}.`,
      icon: 'warning', timer: 1600, showConfirmButton: false, timerProgressBar: true
    });
    return;
  }

  if (existente) {
    existente.cantidad += 1;
    if (imagenUrl && !existente.imagenUrl) existente.imagenUrl = imagenUrl;
  } else {
    if (stockDisponible < 1 && Number.isFinite(stockDisponible)) {
      Swal?.fire({
        title: 'Sin stock',
        text: `No hay stock disponible para "${nombreProducto}"${tallaNorm ? ` (Talla ${tallaNorm})` : ""}.`,
        icon: 'error', timer: 1600, showConfirmButton: false, timerProgressBar: true
      });
      return;
    }
    carrito.push({
      id: idProducto,
      nombre: nombreProducto,
      talla: tallaNorm,                       // ← guardamos la talla (o null)
      cantidad: 1,
      precio: Number(precioProducto) || 0,
      imagenUrl: imagenUrl || null
    });
  }

  guardarCarrito(carrito);

  Swal?.fire({
    title: '¡Producto añadido!',
    text: `${nombreProducto}${tallaNorm ? ` (Talla ${tallaNorm})` : ""} fue agregado al carrito`,
    icon: 'success', timer: 1300, showConfirmButton: false, timerProgressBar: true
  }) ?? alert(`${nombreProducto}${tallaNorm ? ` (Talla ${tallaNorm})` : ""} añadido al carrito`);

  // Si estás en la página de carrito, vuelve a pintar
  if (document.getElementById("lista-carrito")) mostrarCarrito();
};

/* ================================================================
   Render del carrito si estás en carrito.html (con cajitas grises)
   Requiere el CSS de carrito (clases: carrito-item, thumb, info, qty, price, actions)
================================================================ */
function mostrarCarrito() {
  const lista = document.getElementById("lista-carrito");
  const total = document.getElementById("total-carrito");
  if (!lista || !total) return;

  const data = leerCarrito(); // ← carrito del usuario ACTUAL
  lista.innerHTML = "";
  let suma = 0;

  data.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "carrito-item";

    const imgSrc = getImagenProducto(p);
    const metaTxt = p.talla ? `Talla ${p.talla}` : "";

    li.innerHTML = `
      <div class="thumb">
        <img src="${imgSrc}" alt="${p.nombre}${metaTxt ? " — " + metaTxt : ""}" onerror="this.src='img/productos/placeholder.jpg'">
      </div>

      <div class="info">
        <div class="title">${p.nombre}</div>
        <div class="meta">${metaTxt}</div>
      </div>

      <div class="qty">
        <button type="button" class="btn-qty menos" aria-label="Disminuir">−</button>
        <input type="number" class="qty-value" value="${p.cantidad}" min="1" />
        <button type="button" class="btn-qty mas" aria-label="Aumentar">+</button>
      </div>

      <div class="price">$${(p.precio * p.cantidad).toLocaleString("es-CL")}</div>

      <div class="actions">
        <button type="button" class="btn-remove eliminar">Eliminar</button>
      </div>
    `;

    // MENOS
    li.querySelector('.menos').onclick = () => {
      const arr = leerCarrito();
      if (arr[i].cantidad > 1) arr[i].cantidad -= 1;
      else arr.splice(i, 1);
      guardarCarrito(arr);
      mostrarCarrito();
    };

    // INPUT directo
    li.querySelector('.qty-value').onchange = (e) => {
      const val = Math.max(1, Number(e.target.value) || 1);
      const arr = leerCarrito();

      const stockDisp = typeof stockProductos[arr[i].id] === "number"
        ? Number(stockProductos[arr[i].id])
        : getStockDisponible(arr[i].id, arr[i].talla);

      if (Number.isFinite(stockDisp) && val > stockDisp) {
        Swal?.fire({ title:'Stock insuficiente', text:`Máximo ${stockDisp} unidades.`, icon:'warning', timer:1400, showConfirmButton:false, timerProgressBar:true });
        arr[i].cantidad = stockDisp;
      } else {
        arr[i].cantidad = val;
      }
      guardarCarrito(arr);
      mostrarCarrito();
    };

    // MÁS
    li.querySelector('.mas').onclick = () => {
      const arr = leerCarrito();
      const stockDisp = typeof stockProductos[arr[i].id] === "number"
        ? Number(stockProductos[arr[i].id])
        : getStockDisponible(arr[i].id, arr[i].talla);

      if (!Number.isFinite(stockDisp) || arr[i].cantidad < stockDisp) {
        arr[i].cantidad += 1;
        guardarCarrito(arr);
        mostrarCarrito();
      } else {
        Swal?.fire({ title:'Stock insuficiente', text:`No puedes agregar más de ${stockDisp} unidades.`, icon:'warning', timer:1600, showConfirmButton:false, timerProgressBar:true });
      }
    };

    // ELIMINAR
    li.querySelector('.eliminar').onclick = () => {
      const arr = leerCarrito();
      arr.splice(i, 1);
      guardarCarrito(arr);
      mostrarCarrito();
    };

    lista.appendChild(li);
    suma += p.precio * p.cantidad;
  });

  total.textContent = "Total: $" + suma.toLocaleString("es-CL");
}

/* Pintar al cargar si corresponde */
document.addEventListener("DOMContentLoaded", mostrarCarrito);

/* Si otro script actualiza el carrito, vuelve a pintar esta vista */
window.addEventListener("sf:carrito-actualizado", mostrarCarrito);
window.addEventListener("storage", (e) => {
  // si cambió la clave del carrito actual en otra pestaña, repinta
  if (typeof window.__SF__?.claveCarritoActual === "function" &&
      e.key === window.__SF__.claveCarritoActual()) {
    mostrarCarrito();
  }
});
