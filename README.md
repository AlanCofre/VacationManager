# VacationManager

# 🚀 Vacation Manager - Setup Rápido

## 📌 Descripción

Sistema básico para gestionar solicitudes de vacaciones:

* Trabajadores crean solicitudes
* Jefes aprueban o rechazan
* Backend en Node.js + Express + MySQL

---

## 🧱 Requisitos

Instalar previamente:

* Node.js (v18 o superior)
* MySQL Server
* npm (incluido con Node)

---

## 📦 Instalación

Clonar el repositorio:

```bash
git clone <repo-url>
cd <repo>
```

Instalar dependencias:

```bash
npm install
```

---

## 🗄️ Base de Datos

1. Abrir MySQL
2. Ejecutar el script:

```sql
CREATE DATABASE vacation_manager;
USE vacation_manager;

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS vacation_manager;
USE vacation_manager;

-- =========================
-- TABLA: users
-- =========================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('TRABAJADOR', 'JEFE') NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABLA: solicitudes
-- =========================
CREATE TABLE solicitudes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado ENUM('PENDIENTE','APROBADA','RECHAZADA','CANCELADA') DEFAULT 'PENDIENTE',
  comentario TEXT,
  motivo_rechazo TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion TIMESTAMP NULL,
  resuelto_por INT NULL,

  CONSTRAINT fk_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_resuelto_por
    FOREIGN KEY (resuelto_por) REFERENCES users(id)
    ON DELETE SET NULL
);
```

---

## ⚙️ Variables de entorno

Crear archivo `.env` en la raíz:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=vacation_manager
JWT_SECRET=supersecreto
PORT=3000
```

---

## ▶️ Ejecutar proyecto

```bash
node server.js
```

Servidor corriendo en:

```
http://localhost:3000
```

---

## 🧪 Endpoints principales

### 🔐 Auth

* POST `/auth/register`
* POST `/auth/login`

### 📄 Solicitudes

* POST `/solicitudes`
* GET `/solicitudes`
* PUT `/solicitudes/:id/aprobar`
* PUT `/solicitudes/:id/rechazar`

---

## ⚠️ Notas importantes

* No hay validación de JWT aún en endpoints
* No hay control de roles implementado completamente
* No hay envío de correos aún (pendiente integración Brevo)

---

## 🎯 Estado del proyecto

MVP funcional:

* ✔ Conexión a BD
* ✔ CRUD básico
* ✔ Autenticación básica

Pendiente:

* 🔲 Emails automáticos
* 🔲 Middleware de seguridad
* 🔲 Frontend

---

## 🧠 Tips

* Usar Postman para probar endpoints
* Revisar errores en consola
* Verificar conexión a MySQL si falla

---
