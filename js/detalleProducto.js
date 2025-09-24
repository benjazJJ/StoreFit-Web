/* ======================= Datos base ======================= */
const productos = {
    polera: {
      nombre: "Polera deportiva",
      descripcion: "Polera ligera y cómoda para entrenamientos.",
      precio: 15990,
      imagen: "img/PoleraStorefit.png",
      id: 1
    },
    poleron: {
      nombre: "Polerón deportivo",
      descripcion: "Polerón abrigado ideal para días fríos y entrenamientos al aire libre.",
      precio: 24990,
      imagen: "img/PoleronStorefit.png",
      id: 2
    },
    buzo: {
      nombre: "Buzo deportivo",
      descripcion: "Buzo cómodo y flexible para entrenamientos y uso diario.",
      precio: 29990,
      imagen: "img/BuzosStoreFit.png",
      id: 3
    },
    conjuntomujer: {
      nombre: "Conjunto deportivo mujer",
      descripcion: "Top y Short ligeros y resistentes, ideales para running y entrenamientos de alto rendimiento.",
      precio: 39990,
      imagen: "img/TopMujer.png",
      id: 4
    }
  };
  
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  
  /* ======================= Render ======================= */
  document.addEventListener("DOMContentLoaded", () => {
    const tipo = getQueryParam("tipo");
    const prod = productos[tipo];
    const main = document.querySelector("main");
    if (!prod) {
      main.innerHTML = "<h1>Producto no encontrado.</h1>";
      return;
    }
  
    main.innerHTML = `
      <section class="detalle-producto">
        <div class="dp-col dp-info">
          <h1 class="dp-titulo">${prod.nombre.toUpperCase()}</h1>
          <p class="descripcion">${prod.descripcion}</p>
          <ul class="ficha">
            <li>Material principal: Poliéster transpirable</li>
            <li>Tejido de secado rápido</li>
            <li>Costuras reforzadas</li>
          </ul>
          <div class="tallas" role="group" aria-label="Seleccionar talla">
            <button type="button" class="btn-talla" data-talla="XS">XS</button>
            <button type="button" class="btn-talla" data-talla="S">S</button>
            <button type="button" class="btn-talla" data-talla="M">M</button>
            <button type="button" class="btn-talla" data-talla="L">L</button>
            <button type="button" class="btn-talla" data-talla="XL">XL</button>
            <button type="button" class="btn-talla" data-talla="XXL">XXL</button>
          </div>
          <p class="precio"><strong>Precio:</strong> $${prod.precio.toLocaleString()}</p>
          <button type="button" class="btn btn-add" id="btn-add">
            Añadir al carrito
          </button>
          <div class="dp-links">
            <a class="btn" href="productos.html">← Volver a productos</a>
            <a class="btn" href="carrito.html"><i class="fa-solid fa-cart-shopping"></i> Ir al carrito</a>
          </div>
        </div>
        <div class="dp-col dp-img">
          <img src="${prod.imagen}" alt="${prod.nombre}" />
        </div>
      </section>
    `;
  
    // Toggle de tallas
    document.querySelector(".tallas").addEventListener("click", (e) => {
      if (!e.target.classList.contains("btn-talla")) return;
      document.querySelectorAll(".btn-talla").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
    });
  
    // Añadir al carrito con validación de talla
    document.getElementById("btn-add").addEventListener("click", () => {
      const sel = document.querySelector(".btn-talla.active");
      if (!sel) {
        Swal.fire({ title: "Selecciona una talla", icon: "info", timer: 1300, showConfirmButton: false });
        return;
      }
      const talla = sel.dataset.talla;
      agregarAlCarrito(prod.id, prod.nombre, prod.precio, talla);
    });
  });
  