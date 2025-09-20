let carrito = [];
try {
  carrito = JSON.parse(localStorage.getItem("carrito")) || [];
} catch (e) {
  localStorage.removeItem("carrito");
  carrito = [];
}

const stockProductos = {
  1: 5,   // Polera deportiva: 5 unidades disponibles
  2: 3    // Polerón deportivo: 3 unidades disponibles
};

window.agregarAlCarrito = function (idProducto, nombreProducto, precioProducto) {
  const existente = carrito.find(p => p.id === idProducto);
  const stockDisponible = stockProductos[idProducto];

  if (existente) {
    if (existente.cantidad >= stockDisponible) {
      Swal.fire({
        title: 'Stock insuficiente',
        text: `No puedes agregar más de ${stockDisponible} unidades de "${nombreProducto}".`,
        icon: 'warning',
        timer: 1600,
        showConfirmButton: false,
        timerProgressBar: true
      });
      return;
    }
    existente.cantidad += 1;
  } else {
    if (stockDisponible < 1) {
      Swal.fire({
        title: 'Sin stock',
        text: `No hay stock disponible para "${nombreProducto}".`,
        icon: 'error',
        timer: 1600,
        showConfirmButton: false,
        timerProgressBar: true
      });
      return;
    }
    carrito.push({ id: idProducto, nombre: nombreProducto, cantidad: 1, precio: precioProducto });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));

  if (window.Swal) {
    Swal.fire({
      title: '¡Producto añadido!',
      text: `${nombreProducto} fue agregado al carrito`,
      icon: 'success',
      timer: 1300,
      showConfirmButton: false,
      timerProgressBar: true
    });
  } else {
    alert(`${nombreProducto} Añadido al carrito `);
  }

  console.log('Carrito:', carrito);
};

// (opcional) auto-render si hay una vista carrito
function mostrarCarrito() {
  const lista = document.getElementById("lista-carrito");
  const total = document.getElementById("total-carrito");
  if (!lista || !total) return;

  const data = JSON.parse(localStorage.getItem("carrito")) || [];
  lista.innerHTML = "";
  let suma = 0;

  data.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${p.nombre} 
      <button type="button" class="menos" style="margin:0 4px;">−</button>
      <span>x${p.cantidad}</span>
      <button type="button" class="mas" style="margin:0 4px;">+</button>
      - $${(p.precio * p.cantidad).toLocaleString()}
      <button type="button" class="eliminar" style="margin-left:8px;">Eliminar</button>
    `;

    // Botón menos
    li.querySelector('.menos').onclick = () => {
      if (data[i].cantidad > 1) {
        data[i].cantidad -= 1;
      } else {
        data.splice(i, 1);
      }
      localStorage.setItem("carrito", JSON.stringify(data));
      mostrarCarrito();
    };

    // Botón más
    li.querySelector('.mas').onclick = () => {
      if (data[i].cantidad < stockProductos[data[i].id]) {
        data[i].cantidad += 1;
        localStorage.setItem("carrito", JSON.stringify(data));
        mostrarCarrito();
      } else {
        Swal.fire({
          title: 'Stock insuficiente',
          text: `No puedes agregar más de ${stockProductos[data[i].id]} unidades de "${data[i].nombre}".`,
          icon: 'warning',
          timer: 1600,
          showConfirmButton: false,
          timerProgressBar: true
        });
      }
    };

    // Botón eliminar
    li.querySelector('.eliminar').onclick = () => {
      data.splice(i, 1);
      localStorage.setItem("carrito", JSON.stringify(data));
      mostrarCarrito();
    };

    lista.appendChild(li);
    suma += p.precio * p.cantidad;
  });

  total.textContent = "Total: $" + suma.toLocaleString();
}

document.addEventListener("DOMContentLoaded", mostrarCarrito);
