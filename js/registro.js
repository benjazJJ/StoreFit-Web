// Helper
const $ = (s, ctx = document) => ctx.querySelector(s);

// ---------- OJO mostrar/ocultar contraseña ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".ver-toggle");
  if (!btn) return;
  const input = $(btn.getAttribute("data-toggle"));
  if (!input) return;

  const toText = input.type === "password";
  input.type = toText ? "text" : "password";
  btn.setAttribute("aria-pressed", String(toText));

  const icon = btn.querySelector("i");
  if (icon) {
    icon.classList.toggle("fa-eye", !toText);
    icon.classList.toggle("fa-eye-slash", toText);
  }
});

// ---------- Regiones → Comunas  ----------
const regiones = {
  "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
  "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
  "Antofagasta": [
    "Antofagasta", "Mejillones", "Sierra Gorda", "Taltal",
    "Calama", "Ollagüe", "San Pedro de Atacama",
    "Tocopilla", "María Elena"
  ],
  "Atacama": [
    "Copiapó", "Caldera", "Tierra Amarilla",
    "Chañaral", "Diego de Almagro",
    "Vallenar", "Huasco", "Freirina", "Alto del Carmen"
  ],
  "Coquimbo": [
    "La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paihuano", "Vicuña",
    "Ovalle", "Monte Patria", "Punitaqui", "Río Hurtado",
    "Illapel", "Canela", "Los Vilos", "Salamanca"
  ],
  "Valparaíso": [
    "Valparaíso", "Viña del Mar", "Concón",
    "Quilpué", "Villa Alemana", "Limache", "Olmué",
    "Quillota", "La Calera", "La Cruz", "Nogales", "Hijuelas",
    "San Antonio", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "Algarrobo",
    "San Felipe", "Llaillay", "Putaendo", "Santa María", "Catemu", "Panquehue",
    "Los Andes", "Calle Larga", "Rinconada", "San Esteban",
    "Quintero", "Puchuncaví", "Casablanca",
    "Isla de Pascua", "Juan Fernández",
    "Petorca", "La Ligua", "Cabildo", "Papudo", "Zapallar"
  ],
  "Metropolitana de Santiago": [
    "Santiago", "Vitacura", "Las Condes", "Lo Barnechea", "Providencia", "Ñuñoa",
    "La Reina", "Macul", "Peñalolén", "La Florida",
    "Puente Alto", "San José de Maipo", "Pirque",
    "La Granja", "San Joaquín", "La Cisterna", "San Miguel", "Pedro Aguirre Cerda",
    "Lo Espejo", "San Ramón", "El Bosque", "La Pintana",
    "Huechuraba", "Recoleta", "Independencia", "Conchalí", "Renca",
    "Quilicura", "Pudahuel", "Lo Prado", "Cerro Navia", "Quinta Normal",
    "Estación Central", "Maipú", "Cerrillos",
    "Peñaflor", "Padre Hurtado", "Isla de Maipo", "El Monte", "Talagante",
    "San Bernardo", "Buin", "Paine", "Calera de Tango",
    "Melipilla", "Curacaví", "María Pinto", "San Pedro", "Alhué",
    "Colina", "Lampa", "Tiltil"
  ],
  "O'Higgins": [
    "Rancagua", "Machalí", "Graneros", "Requínoa", "Mostazal",
    "Doñihue", "Coltauco", "Coinco", "Olivar", "Malloa", "Quinta de Tilcoco",
    "Rengo", "San Vicente", "Pichidegua", "Peumo", "Las Cabras",
    "Chimbarongo", "San Fernando", "Nancagua", "Placilla", "Santa Cruz",
    "Palmilla", "Peralillo", "Pumanque", "Lolol",
    "Paredones", "Pichilemu", "Marchigüe", "La Estrella", "Litueche"
  ],
  "Maule": [
    "Talca", "San Clemente", "Pencahue", "Maule", "Pelarco", "Río Claro",
    "Curepto", "Constitución", "Empedrado",
    "Curicó", "Molina", "Sagrada Familia", "Romeral", "Hualañé",
    "Teno", "Licantén", "Vichuquén",
    "Linares", "San Javier", "Villa Alegre", "Yerbas Buenas",
    "Colbún", "Longaví", "Parral", "Retiro",
    "Cauquenes", "Chanco", "Pelluhue"
  ],
  "Ñuble": [
    "Chillán", "Chillán Viejo", "Pinto", "Coihueco", "El Carmen", "San Ignacio",
    "Pemuco", "Yungay", "Quillón", "Bulnes",
    "San Nicolás", "San Carlos", "Ñiquén", "San Fabián",
    "Coelemu", "Trehuaco", "Ránquil", "Cobquecura",
    "Portezuelo", "Ninhue", "Quirihue"
  ],
  "Biobío": [
    "Concepción", "Talcahuano", "Hualpén", "San Pedro de la Paz", "Chiguayante",
    "Penco", "Tomé", "Coronel", "Lota", "Florida", "Hualqui", "Santa Juana",
    "Los Ángeles", "Cabrero", "Yumbel", "Laja", "San Rosendo",
    "Nacimiento", "Negrete", "Mulchén", "Quilaco", "Quilleco", "Santa Bárbara", "Alto Biobío",
    "Arauco", "Lebu", "Cañete", "Los Álamos", "Curanilahue", "Tirúa", "Contulmo"
  ],
  "La Araucanía": [
    "Temuco", "Padre Las Casas", "Cunco", "Melipeuco", "Vilcún",
    "Curarrehue", "Pucón", "Villarrica", "Toltén", "Teodoro Schmidt",
    "Carahue", "Saavedra", "Nueva Imperial", "Freire",
    "Cholchol", "Lautaro", "Perquenco", "Galvarino",
    "Traiguén", "Victoria", "Curacautín", "Lonquimay",
    "Ercilla", "Collipulli", "Angol", "Renaico",
    "Lumaco", "Purén", "Los Sauces"
  ],
  "Los Ríos": [
    "Valdivia", "Mariquina", "Lanco", "Máfil", "Corral",
    "Paillaco", "Los Lagos", "Futrono", "Lago Ranco",
    "Río Bueno", "La Unión", "Panguipulli"
  ],
  "Los Lagos": [
    // Llanquihue
    "Puerto Montt", "Puerto Varas", "Llanquihue", "Frutillar", "Fresia", "Maullín", "Calbuco",
    // Osorno
    "Osorno", "San Pablo", "Purranque", "Río Negro", "Puyehue", "San Juan de la Costa",
    // Chiloé
    "Castro", "Ancud", "Quellón", "Dalcahue", "Quemchi", "Curaco de Vélez", "Puqueldón", "Chonchi", "Queilen",
    // Palena
    "Chaitén", "Futaleufú", "Palena", "Hualaihué"
  ],
  "Aysén": [
    "Coyhaique", "Lago Verde",
    "Aysén", "Cisnes", "Guaitecas",
    "Cochrane", "Tortel", "O'Higgins",
    "Chile Chico", "Río Ibáñez"
  ],
  "Magallanes": [
    "Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio",
    "Natales", "Torres del Paine",
    "Porvenir", "Primavera", "Timaukel",
    "Cabo de Hornos", "Antártica"
  ]
};

// Poblar selects
const selRegion = $("#region");
const selComuna = $("#comuna");
if (selRegion && selComuna) {
  selRegion.innerHTML = `<option value="">— Selecciona la región —</option>`;
  Object.keys(regiones).forEach((r) => {
    const op = document.createElement("option");
    op.value = r;
    op.textContent = r;
    selRegion.appendChild(op);
  });
  selComuna.disabled = true;

  selRegion.addEventListener("change", () => {
    selComuna.innerHTML = `<option value="">— Seleccione la comuna —</option>`;
    const elegido = selRegion.value;
    if (!elegido) {
      selComuna.disabled = true;
      return;
    }
    regiones[elegido].forEach((c) => {
      const op = document.createElement("option");
      op.value = c;
      op.textContent = c;
      selComuna.appendChild(op);
    });
    selComuna.disabled = false;
  });
}

// ---------- Validaciones + guardado ----------
const form = $("#formRegistro");
const err = {
  nombre: $("#errNombre"),
  correo: $("#errCorreo"),
  pass: $("#errPass"),
  confirmar: $("#errConfirmar"),
  telefono: $("#errTelefono"),
  region: $("#errRegion"),
  comuna: $("#errComuna")
};

// Solo duoc.cl, profesor.duoc.cl, gmail.com
const emailValido = (v) =>
  /^[\w.+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i.test(String(v).trim());

function validar() {
  const nombre = $("#nombre")?.value.trim() ?? "";
  const correo = $("#correo")?.value.trim() ?? "";
  const pass = $("#contrasena")?.value ?? "";
  const confirmar = $("#confirmar")?.value ?? "";
  const tel = $("#telefono")?.value.trim() ?? "";
  const region = selRegion?.value ?? "";
  const comuna = selComuna?.value ?? "";

  let ok = true;

  if (!nombre) { err.nombre.textContent = "*Campo obligatorio"; ok = false; } else err.nombre.textContent = "";
  if (!emailValido(correo)) { err.correo.textContent = "*Correo inválido"; ok = false; } else err.correo.textContent = "";
  if (pass.length < 4 || pass.length > 10) { err.pass.textContent = "*Entre 4 y 10 caracteres"; ok = false; } else err.pass.textContent = "";
  if (!confirmar) { err.confirmar.textContent = "*Campo obligatorio"; ok = false; }
  else if (confirmar !== pass) { err.confirmar.textContent = "*Las contraseñas no coinciden"; ok = false; }
  else { err.confirmar.textContent = ""; }

  if (tel && !/^[0-9+\s-]{8,}$/.test(tel)) { err.telefono.textContent = "*Teléfono inválido"; ok = false; } else err.telefono.textContent = "";
  if (!region) { err.region.textContent = "*Campo obligatorio"; ok = false; } else err.region.textContent = "";
  if (!comuna) { err.comuna.textContent = "*Campo obligatorio"; ok = false; } else err.comuna.textContent = "";

  return ok;
}

// Persistencia “mock” para ver en F12
const getUsuarios = () => JSON.parse(localStorage.getItem("usuarios") || "[]");
const setUsuarios = (arr) => localStorage.setItem("usuarios", JSON.stringify(arr));

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validar()) return;

  const nuevo = {
    nombre: $("#nombre").value.trim(),
    correo: $("#correo").value.trim(),
    region: selRegion.value,
    comuna: selComuna.value,
    telefono: $("#telefono").value.trim()
    // OJO: no guardes contraseñas reales en localStorage en un proyecto real.
  };

  const usuarios = getUsuarios();
  usuarios.push(nuevo);
  setUsuarios(usuarios);

  console.log("Usuario creado:");
  console.table([nuevo]);
  console.log("Usuarios guardados en localStorage (Application → Local Storage → localhost):");
  console.table(usuarios);

  Swal.fire({
    icon: "success",
    title: "¡Registro exitoso!",
    text: "Tu cuenta ha sido creada correctamente.",
    confirmButtonColor: "#3085d6"
  });

  form.reset();
  if (selComuna) selComuna.disabled = true;
});
