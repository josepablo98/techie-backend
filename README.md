# Techie – Backend principal (Node.js + Express)

Este módulo implementa el backend principal del sistema Techie. Gestiona la autenticación de usuarios, el manejo de chats y preferencias, la conexión con la base de datos y la integración con el microservicio de IA.

## Tecnologías utilizadas

- Node.js + Express.js
- MariaDB (base de datos relacional)
- JWT (autenticación por tokens)
- Bcrypt (hashing de contraseñas)
- Nodemailer (envío de correos)
- dotenv (gestión de variables de entorno)
- node-cron (tareas programadas)

## Funcionalidades

- Registro de usuarios con verificación por correo electrónico
- Inicio de sesión y autenticación mediante JWT
- Recuperación de contraseña con control de expiración y reuso
- Eliminación automática de cuentas no verificadas tras 7 días
- Creación, edición, consulta y eliminación de chats
- Configuración personalizada del usuario (idioma, tema, nivel de detalle, etc.)
- API RESTful con rutas protegidas
- Gestión de tokens de sesión y verificación seguros

## Scripts

```bash
npm install     # Instalar dependencias
npm run dev     # Ejecutar en modo desarrollo
npm start       # Ejecutar en producción
