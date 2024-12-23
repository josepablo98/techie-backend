### Catálogo de Requisitos

#### Requisitos Funcionales
1. El sistema debe permitir a los usuarios registrarse proporcionando un nombre, correo electrónico y contraseña.
2. El sistema debe permitir a los usuarios autenticarse mediante su correo electrónico y contraseña.
3. Los usuarios deben poder solicitar un enlace para restablecer su contraseña desde la página de inicio de sesión.
4. El sistema debe enviar un correo electrónico con un enlace para restablecer la contraseña cuando un usuario lo solicite.
5. El enlace de restablecimiento de contraseña debe expirar después de 2 horas y ser válido solo una vez.
6. El sistema debe permitir a los usuarios cambiar su contraseña solo si es diferente de las últimas cinco utilizadas.
7. Los usuarios deben permanecer autenticados durante un máximo de 2 horas a través de un token de sesión (JWT).
8. El sistema debe invalidar automáticamente los enlaces de restablecimiento de contraseña después de ser utilizados.
9. El sistema debe registrar el historial de contraseñas del usuario para evitar repeticiones.

#### Requisitos No Funcionales
1. El sistema debe manejar un tiempo de respuesta inferior a 3 segundos en operaciones críticas como el inicio de sesión y el restablecimiento de contraseñas.
2. La aplicación debe ser capaz de manejar al menos 100 usuarios concurrentes en su entorno de desarrollo.
3. Los datos sensibles, como las contraseñas, deben cifrarse utilizando algoritmos seguros (bcrypt).
4. El sistema debe ser compatible con los navegadores modernos como Chrome, Firefox, y Edge en sus últimas versiones.
5. El sistema debe operar correctamente tanto en dispositivos móviles como de escritorio.

#### Requisitos Técnicos
1. El backend debe implementarse en Node.js utilizando Express como framework principal.
2. El frontend debe desarrollarse con React.js, utilizando TypeScript para tipado estático.
3. La persistencia de datos debe realizarse con una base de datos MariaDB.
4. La gestión del estado global del frontend debe manejarse mediante Redux Toolkit.
5. La aplicación debe usar TailwindCSS para la estilización de la interfaz de usuario.
6. Los correos electrónicos deben enviarse utilizando Nodemailer con configuración SMTP.
7. Los tokens de sesión deben generarse y verificarse utilizando la biblioteca jsonwebtoken.
8. La validación de contraseñas debe realizarse mediante bcrypt para garantizar seguridad.
9. El sistema debe usar JSON para almacenar el historial de contraseñas en la base de datos.

#### Requisitos de Usabilidad
1. La interfaz debe ser intuitiva, permitiendo que los usuarios realicen acciones básicas como registro y restablecimiento de contraseñas sin necesidad de conocimientos técnicos.
2. El diseño debe ser responsive y adaptarse a pantallas de dispositivos móviles, tablets y ordenadores.
3. Los formularios deben validar los datos de entrada en tiempo real y mostrar mensajes de error claros en caso de que la información sea incorrecta.
4. Las notificaciones, como las relacionadas con el restablecimiento de contraseña o inicio de sesión fallido, deben mostrarse mediante mensajes visuales destacados en la interfaz.
5. El tiempo de carga inicial de la página principal debe ser menor a 2 segundos en una conexión estándar de 4G.
6. La interfaz debe ser visualmente atractiva, utilizando colores y tipografías consistentes para garantizar una experiencia agradable al usuario.
