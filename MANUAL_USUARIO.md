# Manual de Usuario - ZentrixWeb

## 1. Introducción

Este manual describe el uso funcional de ZentrixWeb para usuarios externos, socios y administradores.

La plataforma dispone de una zona pública y de un portal protegido mediante autenticación.

## 2. Acceso a la página principal

Al ingresar a:

```text
/
```

se muestra el landing público.

El landing contiene principalmente:

- Encabezado y navegación.
- Presentación principal.
- Información de cómo funciona la plataforma.
- Misión y visión.
- Características.
- Formulario de registro de socios.
- Botón de contacto por WhatsApp.
- Pie de página.

El usuario puede desplazarse por las diferentes secciones desde la navegación.

## 3. Solicitud para convertirse en socio

Desde el landing se puede acceder al formulario de registro de socio.

El formulario solicita información como:

- Nombre del negocio.
- Nombre de contacto.
- Correo electrónico.
- Teléfono.
- Tipo de negocio.
- Mensaje opcional.

Al enviar la solicitud, la aplicación utiliza:

```text
POST /partners/applications
```

La solicitud es enviada al backend para su procesamiento.

Si el backend devuelve un error, la interfaz muestra el mensaje correspondiente.

## 4. Acceso al portal

Para ingresar al portal:

```text
/partners
```

se debe introducir:

- Correo electrónico.
- Contraseña.

Después de seleccionar **Iniciar sesión**, el sistema valida las credenciales mediante el backend.

El sistema puede utilizar:

```text
/auth/login-partner
```

o:

```text
/auth/login
```

según el tipo de cuenta.

## 5. Sesión de usuario

Después de autenticarse, el frontend guarda la información de sesión en el almacenamiento de sesión del navegador.

La sesión incluye:

- Access token.
- Refresh token, cuando está disponible.
- Tipo de token.
- Información básica del usuario.

Las peticiones protegidas utilizan:

```http
Authorization: Bearer <access_token>
```

Al cerrar sesión se solicita la invalidación de la sesión en el backend y se limpia la sesión local.

## 6. Panel principal

Un socio autenticado es dirigido al panel:

```text
/partners/panel
```

Desde este espacio puede acceder a las funciones disponibles según su rol.

Entre las opciones principales se encuentran:

- Panel.
- Pedidos.
- Productos.
- Directorio.
- Métricas.
- Perfil.

## 7. Gestión de pedidos

En:

```text
/partners/orders
```

el socio puede consultar sus pedidos.

La consulta permite utilizar filtros como:

- Número o identificador de pedido.
- Estado.
- Fecha inicial.
- Fecha final.
- Paginación.

La aplicación consume:

```text
GET /partners/orders
```

Para consultar el detalle:

```text
GET /partners/orders/{order_id}
```

## 8. Actualización del estado de un pedido

Cuando el flujo de negocio lo permite, el socio puede avanzar o actualizar el estado de un pedido.

La operación utiliza:

```text
PATCH /partners/orders/{order_id}/status
```

El sistema envía un cuerpo similar a:

```json
{
  "status": "PREPARING",
  "notes": "Pedido preparado"
}
```

Los estados válidos dependen del contrato definido por el backend.

## 9. Gestión de productos

La sección:

```text
/partners/products
```

permite consultar y administrar los productos asociados al socio.

La información manejada por la interfaz incluye:

- Nombre.
- Descripción.
- Imagen.
- Precio original.
- Precio de oferta.
- Descuento.
- Stock.
- Categoría.
- Estado activo/inactivo.
- Horario de recojo, cuando corresponde.

Las operaciones se realizan contra los endpoints de productos del backend.

## 10. Perfil del socio

La sección:

```text
/partners/profile
```

permite consultar y actualizar información del perfil.

Dependiendo de los datos entregados por el backend, puede incluir:

- Datos del negocio.
- Información personal o de contacto.
- Ubicación.
- Información geográfica.
- Datos bancarios.
- Fotografía de perfil.
- Contraseña.

La fotografía se actualiza mediante una solicitud multipart hacia:

```text
PATCH /partners/photo
```

La información general del perfil utiliza el recurso:

```text
/partners/me
```

## 11. Ubicación mediante mapa

El perfil incorpora funcionalidades relacionadas con Google Maps.

El usuario puede utilizar el mapa para seleccionar o verificar la ubicación del negocio.

La funcionalidad requiere una clave configurada mediante:

```env
VITE_GOOGLE_API_KEY=
```

Si la clave no está configurada o no tiene permisos, la funcionalidad de mapa puede no estar disponible.

## 12. Recuperación de contraseña

Si el usuario olvidó su contraseña, desde el acceso puede seleccionar:

**¿Olvidaste tu contraseña?**

Esto dirige a:

```text
/partners/recover
```

El proceso utiliza:

```text
POST /auth/forgot-password
```

con el correo del usuario.

Cuando el usuario recibe el mecanismo de recuperación, puede ingresar a:

```text
/partners/recover/reset
```

El restablecimiento utiliza:

```text
POST /auth/reset-password
```

con:

- Token.
- Nueva contraseña.
- Confirmación de contraseña.

Después de completar correctamente el proceso se muestra la pantalla:

```text
/partners/recover/success
```

## 13. Administradores

El sistema diferencia el acceso de socios y administradores mediante el rol asociado a la sesión.

Las operaciones administrativas utilizan rutas como:

```text
/admin/dashboard
/admin/partners
/admin/orders
```

El administrador puede acceder a funcionalidades específicas, como:

- Consulta de socios.
- Consulta y gestión administrativa de pedidos.
- Métricas administrativas.
- Visualización de información de socios.

Las autorizaciones definitivas deben ser controladas por el backend.

## 14. Cierre de sesión

Para cerrar sesión:

1. Utilizar la opción correspondiente del portal.
2. El frontend intenta notificar al backend mediante:
   ```text
   POST /auth/logout
   ```
3. Se eliminan los datos almacenados en `sessionStorage`.
4. El usuario debe volver a autenticarse para acceder a las funciones protegidas.

## 15. Mensajes de error

Ante errores del backend, la aplicación intenta mostrar mensajes provenientes de campos habituales como:

```text
message
detail
error
errors
```

Si el servidor no proporciona un mensaje legible, se muestra un mensaje genérico basado en el código HTTP.

## 16. Recomendaciones para el usuario

- No compartir las credenciales.
- Cerrar sesión al utilizar equipos compartidos.
- Mantener actualizados los datos del perfil.
- Verificar los datos de los pedidos antes de cambiar su estado.
- Utilizar fotografías y datos de negocio válidos.
- En caso de error persistente, informar al soporte indicando la pantalla y operación realizada.
