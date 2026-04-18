const loginView = document.getElementById('loginView');
const registerView = document.getElementById('registerView');
const forgotPasswordView = document.getElementById('forgotPasswordView');
const trabajadorView = document.getElementById('trabajadorView');
const jefeView = document.getElementById('jefeView');

const loginForm = document.getElementById('loginForm');
const loginMensaje = document.getElementById('loginMensaje');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const showForgotBtn = document.getElementById('showForgotBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');

const registerForm = document.getElementById('registerForm');
const registerMensaje = document.getElementById('registerMensaje');

const forgotForm = document.getElementById('forgotForm');
const forgotMensaje = document.getElementById('forgotMensaje');

const solicitudForm = document.getElementById('solicitudForm');
const workerMensaje = document.getElementById('workerMensaje');
const miSolicitud = document.getElementById('miSolicitud');

const solicitudesLista = document.getElementById('solicitudesLista');
const recargarBtn = document.getElementById('recargarBtn');

const workerInfo = document.getElementById('workerInfo');
const bossInfo = document.getElementById('bossInfo');

let currentUser = null;
let currentToken = null;

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      loginMensaje.textContent = data.error || 'Error al iniciar sesión';
      loginMensaje.style.color = 'red';
      return;
    }

    currentUser = data.user;
    currentToken = data.token;

    loginMensaje.textContent = '';
    mostrarVistaPorRol();
  } catch (error) {
    loginMensaje.textContent = 'Error de conexión con el servidor';
    loginMensaje.style.color = 'red';
  }
});

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('registerNombre').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const rol = document.getElementById('registerRol').value;

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, rol })
    });

    const data = await res.json();

    if (!res.ok) {
      registerMensaje.textContent = data.error || 'Error al registrar el usuario';
      registerMensaje.style.color = 'red';
      return;
    }

    registerMensaje.textContent = data.message || 'Usuario registrado correctamente';
    registerMensaje.style.color = 'green';
    registerForm.reset();

    setTimeout(() => {
      mostrarLogin();
    }, 1000);
  } catch (error) {
    registerMensaje.textContent = 'Error de conexión con el servidor';
    registerMensaje.style.color = 'red';
  }
});

forgotForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('forgotEmail').value;

  try {
    const res = await fetch('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      forgotMensaje.textContent = data.error || 'No se pudo enviar el correo';
      forgotMensaje.style.color = 'red';
      return;
    }

    forgotMensaje.textContent = data.message || 'Correo de recuperación enviado';
    forgotMensaje.style.color = 'green';
    forgotForm.reset();
  } catch (error) {
    forgotMensaje.textContent = 'Error de conexión con el servidor';
    forgotMensaje.style.color = 'red';
  }
});

showRegisterBtn?.addEventListener('click', mostrarRegistro);
showLoginBtn?.addEventListener('click', mostrarLogin);
showForgotBtn?.addEventListener('click', mostrarRecuperacion);
backToLoginBtn?.addEventListener('click', mostrarLogin);

function mostrarLogin() {
  loginView.classList.remove('hidden');
  registerView.classList.add('hidden');
  forgotPasswordView.classList.add('hidden');
  trabajadorView.classList.add('hidden');
  jefeView.classList.add('hidden');

  loginMensaje.textContent = '';
  registerMensaje.textContent = '';
  forgotMensaje.textContent = '';
}

function mostrarRegistro() {
  loginView.classList.add('hidden');
  registerView.classList.remove('hidden');
  forgotPasswordView.classList.add('hidden');
  trabajadorView.classList.add('hidden');
  jefeView.classList.add('hidden');

  loginMensaje.textContent = '';
  registerMensaje.textContent = '';
  forgotMensaje.textContent = '';
}

function mostrarRecuperacion() {
  loginView.classList.add('hidden');
  registerView.classList.add('hidden');
  forgotPasswordView.classList.remove('hidden');
  trabajadorView.classList.add('hidden');
  jefeView.classList.add('hidden');

  loginMensaje.textContent = '';
  registerMensaje.textContent = '';
  forgotMensaje.textContent = '';
}

function mostrarVistaPorRol() {
  loginView.classList.add('hidden');
  registerView.classList.add('hidden');
  forgotPasswordView.classList.add('hidden');
  trabajadorView.classList.add('hidden');
  jefeView.classList.add('hidden');

  if (!currentUser) {
    mostrarLogin();
    return;
  }

  if (currentUser.rol === 'TRABAJADOR') {
    trabajadorView.classList.remove('hidden');
    workerInfo.textContent = `Bienvenido, ${currentUser.nombre}`;
    cargarMiSolicitud();
  } else if (currentUser.rol === 'JEFE') {
    jefeView.classList.remove('hidden');
    bossInfo.textContent = `Bienvenido, ${currentUser.nombre}`;
    cargarSolicitudes();
  }
}

function cerrarSesion() {
  currentUser = null;
  currentToken = null;

  loginForm?.reset();
  registerForm?.reset();
  forgotForm?.reset();
  solicitudForm?.reset();

  workerMensaje.textContent = '';
  loginMensaje.textContent = '';
  registerMensaje.textContent = '';
  forgotMensaje.textContent = '';
  miSolicitud.innerHTML = '';
  if (solicitudesLista) solicitudesLista.innerHTML = '';

  mostrarLogin();
}

solicitudForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const data = {
      user_id: currentUser.id,
      fecha_inicio: document.getElementById('fecha_inicio').value,
      fecha_fin: document.getElementById('fecha_fin').value,
      comentario: document.getElementById('comentario').value
    };

    const res = await fetch('/solicitudes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      workerMensaje.textContent = result.error || 'No se pudo crear la solicitud';
      workerMensaje.style.color = 'red';
      return;
    }

    workerMensaje.textContent = result.message || 'Solicitud enviada';
    workerMensaje.style.color = 'green';
    solicitudForm.reset();
    cargarMiSolicitud();
  } catch (error) {
    workerMensaje.textContent = 'Error al enviar la solicitud';
    workerMensaje.style.color = 'red';
  }
});

async function cargarMiSolicitud() {
  try {
    const res = await fetch('/solicitudes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      }
    });
    const solicitudes = await res.json();

    const misSolicitudes = solicitudes.filter((s) => s.user_id === currentUser.id);

    if (misSolicitudes.length === 0) {
      miSolicitud.innerHTML = '<p>No tienes solicitudes registradas.</p>';
      return;
    }

    const solicitud = misSolicitudes[0];

    miSolicitud.innerHTML = `
      <div class="solicitud-card">
        <h3>Solicitud #${solicitud.id}</h3>
        <span class="estado ${solicitud.estado.toLowerCase()}">${solicitud.estado}</span>
        <p class="info"><strong>Inicio:</strong> ${formatearFecha(solicitud.fecha_inicio)}</p>
        <p class="info"><strong>Fin:</strong> ${formatearFecha(solicitud.fecha_fin)}</p>
        <p class="info"><strong>Comentario:</strong> ${solicitud.comentario || 'Sin comentario'}</p>
        ${
          solicitud.motivo_rechazo
            ? `<p class="info"><strong>Motivo rechazo:</strong> ${solicitud.motivo_rechazo}</p>`
            : ''
        }
      </div>
    `;
  } catch (error) {
    miSolicitud.innerHTML = '<p>Error al cargar la solicitud.</p>';
  }
}

async function cargarSolicitudes() {
  try {
    const res = await fetch('/solicitudes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      }
    });
    const solicitudes = await res.json();

    const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE');

    solicitudesLista.innerHTML = '';

    if (pendientes.length === 0) {
      solicitudesLista.innerHTML = '<p>No hay solicitudes pendientes.</p>';
      return;
    }

    pendientes.forEach((solicitud) => {
      const card = document.createElement('div');
      card.className = 'solicitud-card';

      card.innerHTML = `
        <h3>Solicitud #${solicitud.id}</h3>
        <span class="estado pendiente">${solicitud.estado}</span>
        <p class="info"><strong>Trabajador:</strong> ${solicitud.nombre || solicitud.user_id}</p>
        <p class="info"><strong>Correo:</strong> ${solicitud.email || 'No disponible'}</p>
        <p class="info"><strong>Inicio:</strong> ${formatearFecha(solicitud.fecha_inicio)}</p>
        <p class="info"><strong>Fin:</strong> ${formatearFecha(solicitud.fecha_fin)}</p>
        <p class="info"><strong>Comentario:</strong> ${solicitud.comentario || 'Sin comentario'}</p>
        <div>
          <button class="btn aprobar" onclick="aprobarSolicitud(${solicitud.id})">Aprobar</button>
          <button class="btn rechazar" onclick="rechazarSolicitud(${solicitud.id})">Rechazar</button>
        </div>
      `;

      solicitudesLista.appendChild(card);
    });
  } catch (error) {
    solicitudesLista.innerHTML = '<p>Error al cargar solicitudes.</p>';
  }
}

async function aprobarSolicitud(id) {
  try {
    const res = await fetch(`/solicitudes/${id}/aprobar`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || 'No se pudo aprobar');
      return;
    }

    alert(result.message || 'Solicitud aprobada');
    cargarSolicitudes();
  } catch (error) {
    alert('Error al aprobar la solicitud');
  }
}

async function rechazarSolicitud(id) {
  const motivo = prompt('Ingrese el motivo del rechazo:');

  if (!motivo) return;

  try {
    const res = await fetch(`/solicitudes/${id}/rechazar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ motivo })
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || 'No se pudo rechazar');
      return;
    }

    alert(result.message || 'Solicitud rechazada');
    cargarSolicitudes();
  } catch (error) {
    alert('Error al rechazar la solicitud');
  }
}

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleDateString('es-CL');
}

recargarBtn?.addEventListener('click', cargarSolicitudes);