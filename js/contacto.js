// contacto.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-contacto");

  const nombre   = document.getElementById("nombre");
  const apellido = document.getElementById("apellido");
  const correo   = document.getElementById("correo");
  const mensaje  = document.getElementById("mensaje");

  const eNombre   = document.getElementById("error-nombre");
  const eApellido = document.getElementById("error-apellido");
  const eCorreo   = document.getElementById("error-correo");
  const eMensaje  = document.getElementById("error-mensaje");

  // Regex para correos válidos
  const emailDominios = /^[\w.+-]+@(duocuc\.com|profesorduocuc\.com|gmail\.com)$/i;

  function limpiarErrores() {
    [eNombre, eApellido, eCorreo, eMensaje].forEach(el => el.textContent = "");
  }

  function setRequerido(errorEl) {
    errorEl.textContent = "*Campo obligatorio";
    errorEl.style.color = "red";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    limpiarErrores();

    let ok = true;

    if ((nombre.value || "").trim() === "") { setRequerido(eNombre); ok = false; }
    if ((apellido.value || "").trim() === "") { setRequerido(eApellido); ok = false; }
    if ((correo.value || "").trim() === "") { setRequerido(eCorreo); ok = false; }
    if ((mensaje.value || "").trim() === "") { setRequerido(eMensaje); ok = false; }

    // Validación correo
    const vCorreo = (correo.value || "").trim();
    if (vCorreo && !emailDominios.test(vCorreo)) {
      eCorreo.textContent = "Solo @duocuc.com, @profesorduocuc.com o @gmail.com";
      eCorreo.style.color = "red";
      ok = false;
    }

    if (!ok) return;

    // 🚀 Mostrar datos en la consola
    console.log("===== Datos del formulario =====");
    console.log("Nombre: ", nombre.value);
    console.log("Apellido: ", apellido.value);
    console.log("Correo: ", correo.value);
    console.log("Mensaje: ", mensaje.value);

    // Mensaje bonito con SweetAlert2
    Swal.fire({
      icon: "success",
      title: "¡Mensaje enviado con éxito!",
      text: "Gracias por contactarnos. Te responderemos pronto.",
      confirmButtonText: "OK"
    });

    form.reset();
    limpiarErrores();
  });
});
