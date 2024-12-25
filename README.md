# Catálogo de Requisitos

## Requisitos Funcionales

1. **Registro de usuarios:**
    - El sistema debe permitir a los usuarios registrarse con un nombre, correo electrónico y contraseña.
    - El sistema debe enviar un correo de confirmación tras el registro.
    - Los usuarios deben confirmar su correo electrónico antes de poder iniciar sesión.
    - Si un usuario intenta registrarse o iniciar sesión con un correo no confirmado, el sistema debe informar que está pendiente de confirmación.
    - El sistema debe permitir solicitar el reenvío del correo de confirmación, limitado a una vez cada 10 minutos.

2. **Inicio de sesión:**
    - El sistema debe permitir a los usuarios iniciar sesión con sus credenciales.

3. **Gestión de contraseñas:**
    - Los usuarios deben poder solicitar un restablecimiento de contraseña si la olvidan.
    - El sistema debe enviar un enlace por correo electrónico para restablecer la contraseña, válido durante 2 horas.
    - El usuario debe poder cambiar su contraseña, siempre que no sea igual a las cinco últimas.

4. **Sesión:**
    - El sistema debe permitir la persistencia de la sesión mediante JSON Web Tokens durante un período de 2 horas.

5. **Chatbot:**
    - Los usuarios deben poder iniciar un nuevo chat con el chatbot LLM.
    - El chatbot debe responder preguntas teóricas sobre Python basándose en un modelo LLM.
    - El chatbot debe permitir al usuario solicitar ejemplos prácticos en las respuestas.
    - El chatbot debe recordar el contexto del chat para respuestas coherentes durante una sesión activa.

6. **Gestión de chats:**
    - El sistema debe permitir guardar chats históricos de los usuarios.
    - Los usuarios deben poder ver su historial de chats guardados y seleccionar uno para revisarlo.

7. **Configuraciones del usuario:**
    - La configuración debe permitir habilitar/deshabilitar sugerencias automáticas al escribir en el chat.
    - La configuración debe permitir elegir el nivel de detalle de las respuestas del chatbot (básico o avanzado).
    - La configuración debe incluir la posibilidad de activar o desactivar el almacenamiento automático de chats (chats temporales).
    - La configuración debe permitir cambiar el idioma del chatbot.
    - La configuración debe permitir al usuario elegir entre un tema claro y oscuro.
    - La configuración debe permitir personalizar el tiempo máximo de inactividad antes de cerrar la sesión automáticamente.

8. **Layout:**
    - **Header:**
        - Botón para iniciar un nuevo chat.
        - Menú desplegable con opciones como "Información de cuenta", "Historial de chats", "Configuración", y "Cerrar sesión".
    - **Footer:**
        - Información legal y datos de contacto.

9. **Administración:**
    - El sistema debe permitir a los administradores revisar logs de errores o eventos relevantes.

10. **Cierre de sesión:**
    - Los usuarios deben poder cerrar sesión desde cualquier página.

## Requisitos No Funcionales

1. **Rendimiento:**
    - El sistema debe garantizar una respuesta rápida del chatbot, con un tiempo máximo de respuesta de 2 segundos para cada consulta.

2. **Compatibilidad:**
    - La aplicación debe ser accesible desde dispositivos móviles y de escritorio.

3. **Seguridad:**
    - El sistema debe garantizar la seguridad de los datos mediante contraseñas hash y comunicación segura (HTTPS).

4. **Interfaz:**
    - La interfaz debe ser intuitiva, utilizando React con TypeScript y estilización con TailwindCSS.

5. **Auditoría:**
    - Las operaciones críticas, como restablecer contraseña, deben registrar logs de actividad para auditoría.

## Requisitos Técnicos

1. **Frontend:**
    - Desarrollado en React.js con TypeScript y utilizando React Router DOM para el manejo de rutas.
    - Gestión del estado global mediante Redux Toolkit.

2. **Backend:**
    - Desarrollado en Node.js con Express.
  
3. **Base de datos:**
    - Persistencia de datos utilizando MariaDB.

4. **Seguridad:**
    - Contraseñas almacenadas con hashing seguro (bcrypt).
    - Persistencia de sesión mediante JSON Web Tokens.

5. **Correo:**
    - Envío de correos electrónicos mediante Nodemailer.

6. **Modelo de IA:**
    - Integración de un modelo LLM para responder preguntas sobre Python.

7. **Eficiencia:**
    - Implementación de mecanismos para el manejo eficiente de solicitudes concurrentes al modelo LLM.

8. **Componentes reutilizables:**
    - Diseño del layout como componentes reutilizables en React.

## Requisitos de Usabilidad

1. **Accesibilidad:**
    - La interfaz debe ser fácil de entender para usuarios con conocimientos básicos de tecnología.

2. **Diseño responsivo:**
    - El diseño debe adaptarse a pantallas de distintos tamaños.

3. **Footer:**
    - Debe proporcionar enlaces claros y accesibles a información legal y de contacto.

4. **Header:**
    - Las opciones del header deben estar organizadas y ser fácilmente accesibles.

5. **Retroalimentación:**
    - El sistema debe ofrecer retroalimentación visual para indicar el estado de las acciones (como "Contraseña cambiada exitosamente").

6. **Historial de chats:**
    - Los chats deben estar ordenados cronológicamente en el historial.

7. **Sección de ayuda:**
    - Las preguntas más frecuentes sobre el uso del chatbot deben estar disponibles en una sección de ayuda.

8. **Personalización:**
    - La configuración debe incluir opciones accesibles para personalizar el comportamiento del chatbot, como nivel de detalle o tipo de ejemplos en las respuestas.
