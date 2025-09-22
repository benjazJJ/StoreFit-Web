/* ===================== CARRITO POR USUARIO ===================== */
/* Siempre toma los helpers desde window.__SF__ en tiempo de ejecución.
   Si por alguna razón sesion.js no está listo, usa “invitado”. */

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

/* Stock de ejemplo por producto (ajústalo a tu realidad) */
const stockProductos = {
  1: 5,  // Polera deportiva
  2: 3   // Polerón deportivo
};

/* Agregar al carrito (expuesta en window para usar desde los botones) */
window.agregarAlCarrito = function (idProducto, nombreProducto, precioProducto) {
  // Leer SIEMPRE del origen vigente
  carrito = leerCarrito();

  const existente = carrito.find(p => p.id === idProducto);
  const stockDisponible = Number(stockProductos[idProducto] ?? Infinity);

  if (existente) {
    if (existente.cantidad >= stockDisponible) {
      Swal.fire({
        title: 'Stock insuficiente',
        text: `No puedes agregar más de ${stockDisponible} unidades de "${nombreProducto}".`,
        icon: 'warning', timer: 1600, showConfirmButton: false, timerProgressBar: true
      });
      return;
    }
    existente.cantidad += 1;
  } else {
    if (stockDisponible < 1) {
      Swal.fire({
        title: 'Sin stock',
        text: `No hay stock disponible para "${nombreProducto}".`,
        icon: 'error', timer: 1600, showConfirmButton: false, timerProgressBar: true
      });
      return;
    }
    carrito.push({
      id: idProducto,
      nombre: nombreProducto,
      cantidad: 1,
      precio: Number(precioProducto) || 0
    });
  }

  guardarCarrito(carrito);

  if (window.Swal) {
    Swal.fire({
      title: '¡Producto añadido!',
      text: `${nombreProducto} fue agregado al carrito`,
      icon: 'success', timer: 1300, showConfirmButton: false, timerProgressBar: true
    });
  } else {
    alert(`${nombreProducto} añadido al carrito`);
  }

  // Si estás en la página de carrito, vuelve a pintar
  if (document.getElementById("lista-carrito")) mostrarCarrito();
};

/* Render del carrito si estás en carrito.html */
function mostrarCarrito() {
  const lista = document.getElementById("lista-carrito");
  const total = document.getElementById("total-carrito");
  if (!lista || !total) return;

  const data = leerCarrito(); // ← carrito del usuario ACTUAL
  lista.innerHTML = "";
  let suma = 0;

  data.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${p.nombre}
      <button type="button" class="menos" style="margin:0 4px;">−</button>
      <span>x${p.cantidad}</span>
      <button type="button" class="mas" style="margin:0 4px;">+</button>
      - $${(p.precio * p.cantidad).toLocaleString("es-CL")}
      <button type="button" class="eliminar" style="margin-left:8px;">Eliminar</button>
    `;

    // “menos”
    li.querySelector('.menos').onclick = () => {
      const arr = leerCarrito();
      if (arr[i].cantidad > 1) arr[i].cantidad -= 1;
      else arr.splice(i, 1);
      guardarCarrito(arr);
      mostrarCarrito();
    };

    // “más”
    li.querySelector('.mas').onclick = () => {
      const arr = leerCarrito();
      const stockDisp = Number(stockProductos[arr[i].id] ?? Infinity);
      if (arr[i].cantidad < stockDisp) {
        arr[i].cantidad += 1;
        guardarCarrito(arr);
        mostrarCarrito();
      } else {
        Swal.fire({
          title: 'Stock insuficiente',
          text: `No puedes agregar más de ${stockDisp} unidades de "${arr[i].nombre}".`,
          icon: 'warning', timer: 1600, showConfirmButton: false, timerProgressBar: true
        });
      }
    };

    // “eliminar”
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

document.addEventListener("DOMContentLoaded", mostrarCarrito);

// Si otro script actualiza el carrito, vuelve a pintar esta vista
window.addEventListener("sf:carrito-actualizado", mostrarCarrito);
window.addEventListener("storage", (e) => {
  // si cambió la clave del carrito actual en otra pestaña, repinta
  if (typeof window.__SF__?.claveCarritoActual === "function" &&
      e.key === window.__SF__.claveCarritoActual()) {
    mostrarCarrito();
  }
});
  