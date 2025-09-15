let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function agregarAlCarrito(producto) {
  carrito.push(producto);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  alert("Producto añadido al carrito");
}

function mostrarCarrito() {
  console.log("Carrito:", carrito);
}