# 🚀 Vacation Manager

## 📌 Descripción

Sistema para la gestión de solicitudes de vacaciones en organizaciones:

- Trabajadores crean solicitudes de vacaciones  
- Jefes aprueban o rechazan solicitudes  
- Autenticación segura con JWT  
- Control de acceso basado en roles  
- Notificaciones por correo en cada acción relevante  

**Stack actual:**
- Backend: Node.js + Express  
- Base de datos: PostgreSQL (Supabase)  
- Emailing: Brevo
- Frontend: Html + Css  

---

## 🧱 Requisitos

Antes de empezar:

- Node.js (v18 o superior)  
- npm
- Archivo .env para credenciales de Supabase y Brevo

---

## 📦 Instalación

Clonar repositorio:
```bash
git clone <repo-url>
cd <repo>

Instalar dependencias:

npm install
```
## ⚙️ Variables de entorno

Crear archivo .env en la raíz del proyecto:
```bash
# DATABASE LOCAL CONFIGURATION (opcional / legacy)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=vacation_manager

# JWT
JWT_SECRET=tu_secreto_seguro
PORT=3000

# BREVO API
BREVO_API_KEY=tu_api_key_brevo
EMAIL_FROM=tu_correo_remitente

# DATABASE SUPABASE (ACTUAL)
DB_HOST=host_supabase
DB_PORT=puerto_supabase
DB_USER=usuario_supabase
DB_PASSWORD=contraseña_supabase
DB_NAME=nombre_bd_supabase
```
**⚠️ Importante:**
El sistema ahora opera sobre Supabase (PostgreSQL). La configuración local queda solo como referencia.

## ▶️ Ejecutar proyecto
```
node server.js

Servidor disponible en:

http://localhost:3000
```
## 🧪 Endpoints principales

**🔐 Autenticación**
- POST /register → Registro de usuario
- POST /login → Login
- POST /forgot-password → Solicitud de recuperación
- POST /reset-password → Reset de contraseña

**📄 Solicitudes**
- POST /solicitudes → Crear solicitud
- GET /solicitudes → Listar solicitudes
- PUT /:id/aprobar → Aprobar solicitud
- PUT /:id/rechazar → Rechazar solicitud

**🔐 Seguridad**
- Autenticación con JWT en todos los endpoints protegidos
- Middleware de validación de tokens
- Control de acceso por roles (TRABAJADOR / JEFE)

**📧 Sistema de correos**

Integración completa con Brevo:
Se envían emails automáticamente cuando:

- Se crea una solicitud
- Se aprueba una solicitud
- Se rechaza una solicitud
- Se realizan acciones de autenticación (ej: recuperación de contraseña)

**🎯 Estado del proyecto**

Proyecto funcional end-to-end:

- Backend completo
- Integración con Supabase
- Seguridad implementada (JWT + roles)
- Sistema de notificaciones por correo
- Frontend funcional conectado al backend

**⚠️ Debilidades actuales**
- UI/UX básica
- Baja responsividad en frontend
- Falta de optimización visual

**🧠 Consideraciones clave**
Ya no es necesario usar Postman
El sistema puede probarse directamente desde el frontend local
Asegúrate de configurar correctamente las variables de entorno
La persistencia depende 100% de la conexión a Supabase

**🧩 Próximos pasos estratégicos**
Mejorar UI/UX (prioridad alta si esto escala)
Optimizar validaciones y edge cases
Implementar métricas/logs
Preparar despliegue en producción
