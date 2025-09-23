/* ======================== STORAGE HELPERS ======================== */
const KS = { productos: "sf_admin_productos", usuarios: "sf_admin_usuarios" };
const getArr = (k) => JSON.parse(localStorage.getItem(k) || "[]");
const setArr = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ======================== DATOS BASE ============================= */
const CATEGORIAS = ["Poleras","Polerones","Pantalones","Zapatillas","Accesorios"];
const REGIONES = [
  { nombre:"Metropolitana", comunas:["Santiago","Providencia","Puente Alto","Maipú"] },
  { nombre:"Valparaíso", comunas:["Valparaíso","Viña del Mar","Quilpué"] },
];

/* ======================== UTIL & TOAST =========================== */
function $(s, r=document){ return r.querySelector(s); }
function ce(tag, attrs={}){ const el = document.createElement(tag); Object.assign(el, attrs); return el; }
function toast(msg, ms=2200){
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), ms);
}

/* ======================== VALIDACIONES =========================== */
const correoValido = (c) => /^[\w.+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i.test(c);

function validarRUN(run) {
  const r = (run || "").toUpperCase().replace(/\./g,"").replace(/-/g,"").trim();
  if (!/^[0-9]{7,8}[0-9K]$/.test(r)) return false;
  const body = r.slice(0,-1), dv = r.slice(-1);
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) { sum += parseInt(body[i], 10) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const res = 11 - (sum % 11);
  const dvCalc = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return dv === dvCalc;
}

function validarProducto(p) {
  const errs = [];
  if (!p.codigo || p.codigo.trim().length < 3) errs.push("Código: mínimo 3 caracteres.");
  if (!p.nombre || p.nombre.trim().length === 0) errs.push("Nombre es requerido.");
  if (p.descripcion && p.descripcion.length > 500) errs.push("Descripción: máx. 500.");
  const precio = Number(p.precio); if (!(precio >= 0)) errs.push("Precio debe ser ≥ 0.");
  const stock = Number.isInteger(Number(p.stock)) ? Number(p.stock) : NaN; if (!(stock >= 0)) errs.push("Stock entero ≥ 0.");
  if (p.stockCritico !== "" && !(Number.isInteger(Number(p.stockCritico)) && Number(p.stockCritico) >= 0))
    errs.push("Stock crítico entero ≥ 0.");
  if (!p.categoria) errs.push("Seleccione una categoría.");
  return errs;
}

function validarUsuario(u) {
  const errs = [];
  if (!u.run || !validarRUN(u.run)) errs.push("RUN inválido (sin puntos ni guion, con dígito verificador).");
  if (!u.nombre) errs.push("Nombre es requerido.");
  if (!u.apellidos) errs.push("Apellidos son requeridos.");
  if (!u.correo || !correoValido(u.correo)) errs.push("Correo inválido (duoc.cl, profesor.duoc.cl o gmail.com).");
  if (!u.rol) errs.push("Seleccione tipo de usuario.");
  if (!u.region) errs.push("Seleccione región.");
  if (!u.comuna) errs.push("Seleccione comuna.");
  if (!u.direccion) errs.push("Dirección es requerida.");
  return errs;
}

/* ======================== PAGINACIÓN GENÉRICA ==================== */
function paginator(items, page, perPage){
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p-1)*perPage, end = start + perPage;
  return { slice: items.slice(start, end), total, pages, page: p };
}
function renderPager(container, page, pages, onGo){
  const c = $(container); if (!c) return;
  c.innerHTML = "";
  const btn = (txt, disabled, go)=>{ const b = ce("button"); b.textContent = txt; if(disabled){b.disabled=true;} b.onclick=()=>onGo(go); return b; };
  c.append(btn("«", page<=1, 1), btn("‹", page<=1, page-1));
  // simple: página actual + 2
  for (let i=Math.max(1,page-2); i<=Math.min(pages,page+2); i++){
    const b = btn(String(i), false, i); if (i===page) b.classList.add("current"); c.append(b);
  }
  c.append(btn("›", page>=pages, page+1), btn("»", page>=pages, pages));
}

/* ======================== PRODUCTOS ============================== */
function initProductos(){
  const tbody = $("#tbody-productos");
  const dlg = $("#dlg-producto");
  const frm = $("#frm-producto");
  const errBox = $("#errors-prod");
  const selCat = frm.elements["categoria"];
  const q = $("#q-prod");
  const pp = $("#pp-prod");
  const pager = $("#pager-prod");

  selCat.innerHTML = `<option value="">Seleccione</option>` + CATEGORIAS.map(c=>`<option>${c}</option>`).join("");

  let productos = getArr(KS.productos);
  // datos de demo si está vacío
  if (productos.length === 0){
    productos = [
      {codigo:"POL-001", nombre:"Polera Training", precio:12990, stock:5, stockCritico:3, categoria:"Poleras", descripcion:"", imagen:""},
      {codigo:"POL-002", nombre:"Polera Oversize", precio:14990, stock:2, stockCritico:4, categoria:"Poleras", descripcion:"", imagen:""},
      {codigo:"PNT-101", nombre:"Pantalón Cargo", precio:24990, stock:12, stockCritico:"", categoria:"Pantalones", descripcion:"", imagen:""},
      {codigo:"ZAP-300", nombre:"Zapatilla Air Star", precio:59990, stock:0, stockCritico:2, categoria:"Zapatillas", descripcion:"", imagen:""},
    ];
    setArr(KS.productos, productos);
  }

  let state = { page:1, perPage: Number(pp.value), q:"" };

  function filtrar(){
    const t = state.q.trim().toLowerCase();
    return productos.filter(p =>
      p.codigo.toLowerCase().includes(t) || p.nombre.toLowerCase().includes(t)
    );
  }

  function pintar(){
    const data = filtrar();
    const { slice, pages, page } = paginator(data, state.page, state.perPage);
    tbody.innerHTML = slice.map((p, i)=>{
      const critical = p.stockCritico !== "" && Number(p.stock) <= Number(p.stockCritico);
      return `
      <tr class="${critical ? "danger": ""}">
        <td><code>${p.codigo}</code></td>
        <td>${p.nombre}</td>
        <td>$${Number(p.precio).toFixed(2)}</td>
        <td>${p.stock} ${critical ? ' <span class="badge danger">Crítico</span>': ''}</td>
        <td>${p.categoria}</td>
        <td style="text-align:right">
          <button class="btn ghost" data-edit="${encodeURIComponent(p.codigo)}">Editar</button>
          <button class="btn" data-del="${encodeURIComponent(p.codigo)}">Eliminar</button>
        </td>
      </tr>`;
    }).join("");

    renderPager("#pager-prod", page, pages, (go)=>{ state.page = go; pintar(); });
  }
  pintar();

  $("#btn-nuevo").addEventListener("click", ()=>{
    frm.reset(); frm.__editIndex.value = ""; $("#dlg-title").textContent = "Nuevo producto";
    errBox.hidden = true; dlg.showModal();
  });
  $("#btn-cancelar").addEventListener("click", ()=> dlg.close());

  tbody.addEventListener("click", (e)=>{
    const codeDel = e.target.dataset.del;
    const codeEd  = e.target.dataset.edit;
    if (codeDel){
      const idx = productos.findIndex(p=>p.codigo === decodeURIComponent(codeDel));
      if (idx>-1){ productos.splice(idx,1); setArr(KS.productos, productos); pintar(); }
    } else if (codeEd){
      const p = productos.find(x=>x.codigo === decodeURIComponent(codeEd));
      if (!p) return;
      frm.codigo.value = p.codigo; frm.nombre.value = p.nombre; frm.precio.value = p.precio;
      frm.stock.value = p.stock; frm.stockCritico.value = p.stockCritico ?? "";
      frm.categoria.value = p.categoria; frm.descripcion.value = p.descripcion ?? ""; frm.imagen.value = p.imagen ?? "";
      frm.__editIndex.value = p.codigo;
      $("#dlg-title").textContent = "Editar producto"; errBox.hidden = true; dlg.showModal();
    }
  });

  $("#btn-guardar").addEventListener("click", (ev)=>{
    ev.preventDefault();
    const p = {
      codigo: frm.codigo.value.trim(), nombre: frm.nombre.value.trim(),
      precio: frm.precio.value, stock: frm.stock.value, stockCritico: frm.stockCritico.value,
      categoria: frm.categoria.value, descripcion: frm.descripcion.value.trim(), imagen: frm.imagen.value.trim(),
    };
    const errs = validarProducto(p);
    if (errs.length){ errBox.innerHTML = "<ul><li>"+errs.join("</li><li>")+"</li></ul>"; errBox.hidden = false; return; }

    const editKey = frm.__editIndex.value;
    if (editKey){ // update by código original
      const idx = productos.findIndex(x=>x.codigo === editKey);
      if (idx>-1) productos[idx] = p;
      toast("Producto actualizado");
    } else {
      if (productos.some(x=>x.codigo.toLowerCase()===p.codigo.toLowerCase())){
        errBox.textContent = "Ya existe un producto con ese código."; errBox.hidden = false; return;
      }
      productos.push(p); toast("Producto creado");
    }
    setArr(KS.productos, productos); dlg.close(); pintar();

    // alerta si quedó en crítico
    if (p.stockCritico !== "" && Number(p.stock) <= Number(p.stockCritico)){
      toast("⚠ Stock en nivel crítico para " + p.nombre, 2600);
    }
  });

  q.addEventListener("input", ()=>{ state.q = q.value; state.page = 1; pintar(); });
  pp.addEventListener("change", ()=>{ state.perPage = Number(pp.value); state.page = 1; pintar(); });
}

/* ======================== USUARIOS =============================== */
function initUsuarios(){
  const tbody = $("#tbody-usuarios");
  const dlg = $("#dlg-usuario");
  const frm = $("#frm-usuario");
  const errBox = $("#errors-usr");
  const selReg = frm.elements["region"];
  const selCom = frm.elements["comuna"];
  const q = $("#q-usr");
  const pp = $("#pp-usr");
  const pager = $("#pager-usr");

  selReg.innerHTML = `<option value="">Seleccione</option>` + REGIONES.map(r=>`<option>${r.nombre}</option>`).join("");
  selCom.innerHTML = `<option value="">Seleccione</option>`;
  selReg.addEventListener("change", ()=>{
    const r = REGIONES.find(x=>x.nombre===selReg.value);
    selCom.innerHTML = `<option value="">Seleccione</option>` + (r? r.comunas.map(c=>`<option>${c}</option>`).join("") : "");
  });

  let usuarios = getArr(KS.usuarios);
  if (usuarios.length === 0){
    usuarios = [
      {run:"19011022K", nombre:"Benjamín", apellidos:"Palma", correo:"bp@duoc.cl", fechaNac:"", rol:"Administrador", region:"Metropolitana", comuna:"Santiago", direccion:"Alameda 123"},
    ];
    setArr(KS.usuarios, usuarios);
  }

  let state = { page:1, perPage: Number(pp.value), q:"" };

  function filtrar(){
    const t = state.q.trim().toLowerCase();
    return usuarios.filter(u =>
      u.run.toLowerCase().includes(t) || (u.nombre+" "+u.apellidos).toLowerCase().includes(t) || u.correo.toLowerCase().includes(t)
    );
  }

  function pintar(){
    const data = filtrar();
    const { slice, pages, page } = paginator(data, state.page, state.perPage);
    tbody.innerHTML = slice.map((u)=>`
      <tr>
        <td><code>${u.run}</code></td>
        <td>${u.nombre} ${u.apellidos}</td>
        <td>${u.correo}</td>
        <td>${u.rol}</td>
        <td>${u.region}</td>
        <td>${u.comuna}</td>
        <td style="text-align:right">
          <button class="btn ghost" data-edit="${u.run}">Editar</button>
          <button class="btn" data-del="${u.run}">Eliminar</button>
        </td>
      </tr>
    `).join("");

    renderPager("#pager-usr", page, pages, (go)=>{ state.page = go; pintar(); });
  }
  pintar();

  $("#btn-nuevo-usr").addEventListener("click", ()=>{
    frm.reset(); frm.__editIndex.value = ""; $("#dlg-title-usr").textContent = "Nuevo usuario";
    errBox.hidden = true; dlg.showModal();
  });
  $("#btn-cancelar-usr").addEventListener("click", ()=> dlg.close());

  tbody.addEventListener("click",(e)=>{
    const runDel = e.target.dataset.del;
    const runEd  = e.target.dataset.edit;
    if (runDel){
      const idx = usuarios.findIndex(u=>u.run===runDel);
      if (idx>-1){ usuarios.splice(idx,1); setArr(KS.usuarios, usuarios); pintar(); }
    } else if (runEd){
      const u = usuarios.find(x=>x.run===runEd); if (!u) return;
      frm.run.value = u.run; frm.nombre.value = u.nombre; frm.apellidos.value = u.apellidos;
      frm.correo.value = u.correo; frm.fechaNac.value = u.fechaNac || ""; frm.rol.value = u.rol;
      frm.region.value = u.region; selReg.dispatchEvent(new Event("change")); frm.comuna.value = u.comuna;
      frm.direccion.value = u.direccion; frm.__editIndex.value = u.run;
      $("#dlg-title-usr").textContent = "Editar usuario"; errBox.hidden = true; dlg.showModal();
    }
  });

  $("#btn-guardar-usr").addEventListener("click",(ev)=>{
    ev.preventDefault();
    const u = {
      run: frm.run.value.trim(), nombre: frm.nombre.value.trim(), apellidos: frm.apellidos.value.trim(),
      correo: frm.correo.value.trim(), fechaNac: frm.fechaNac.value || "", rol: frm.rol.value,
      region: frm.region.value, comuna: frm.comuna.value, direccion: frm.direccion.value.trim(),
    };
    const errs = validarUsuario(u);
    if (errs.length){ errBox.innerHTML = "<ul><li>"+errs.join("</li><li>")+"</li></ul>"; errBox.hidden = false; return; }

    const editKey = frm.__editIndex.value;
    if (editKey){
      const idx = usuarios.findIndex(x=>x.run===editKey);
      if (idx>-1) usuarios[idx] = u; toast("Usuario actualizado");
    } else {
      if (usuarios.some(x=>x.run.toUpperCase()===u.run.toUpperCase())){
        errBox.textContent = "Ya existe un usuario con ese RUN."; errBox.hidden = false; return;
      }
      usuarios.push(u); toast("Usuario creado");
    }
    setArr(KS.usuarios, usuarios); dlg.close(); pintar();
  });

  q.addEventListener("input", ()=>{ state.q = q.value; state.page = 1; pintar(); });
  pp.addEventListener("change", ()=>{ state.perPage = Number(pp.value); state.page = 1; pintar(); });
}

/* ======================== BOOTSTRAP ============================== */
document.addEventListener("DOMContentLoaded", ()=>{
  const page = document.body.dataset.page;
  // marca activo en menú según página
  document.querySelectorAll(".sidebar .nav-item").forEach(a=>{
    const isActive = (page==="home"  && a.href.includes("index.html")) ||
                     (page==="productos" && a.href.includes("productos.html")) ||
                     (page==="usuarios" && a.href.includes("usuarios.html"));
    if (isActive) a.classList.add("active");
  });
  if (page === "productos") return initProductos();
  if (page === "usuarios") return initUsuarios();
});
