# Mantenimiento, Soporte, Despliegue y Operación - ZentrixWeb

## 1. Objetivo del mantenimiento

El mantenimiento de ZentrixWeb tiene como finalidad conservar:

- Disponibilidad.
- Compatibilidad con el backend.
- Seguridad.
- Correcto funcionamiento de la autenticación.
- Integridad de los flujos de socios y administradores.
- Compatibilidad con servicios externos.
- Calidad del código.
- Rendimiento de la aplicación.

## 2. Tipos de mantenimiento

### Correctivo

Atiende errores detectados en producción o durante las pruebas.

Ejemplos:

- Error de autenticación.
- Pantalla que no carga.
- Endpoint incorrecto.
- Error de navegación.
- Fallo de carga de imágenes.
- Problemas con Google Maps.

### Preventivo

Busca evitar incidentes futuros.

Incluye:

- Actualización de dependencias.
- Revisión de logs.
- Validación de variables de entorno.
- Pruebas de endpoints.
- Revisión de compatibilidad del backend.
- Revisión de configuración del hosting.

### Evolutivo

Incorpora nuevas funcionalidades.

Ejemplos:

- Nuevos filtros.
- Nuevos estados de pedidos.
- Nuevos campos de producto.
- Nuevos módulos administrativos.
- Nuevas métricas.

## 3. Dependencias principales

Las dependencias más relevantes se encuentran en:

```text
package.json
apps/landing_partners/package.json
packages/partner-dashboard/package.json
```

Antes de actualizar dependencias:

1. Crear una rama de trabajo.
2. Registrar la versión actual.
3. Actualizar una dependencia a la vez cuando sea posible.
4. Ejecutar instalación.
5. Ejecutar build.
6. Ejecutar pruebas funcionales.
7. Validar integración con el backend.

## 4. Instalación de mantenimiento

Desde la raíz:

```bash
npm install
```

Para validar el build:

```bash
npm run build
```

Para ejecutar localmente:

```bash
npm run dev
```

## 5. Variables de entorno

Las variables principales son:

```env
VITE_AUTH_API_URL=
VITE_ADMIN_API_URL=
VITE_GOOGLE_API_KEY=
VITE_GOOGLE_MAP_ID=
VITE_APP_STORE_URL=
VITE_GOOGLE_PLAY_URL=
```

### Reglas

- No modificar `.env` directamente en producción sin registrar el cambio.
- No almacenar secretos privados en variables `VITE_*`.
- Verificar las variables antes de ejecutar el build.
- Reiniciar el servidor de desarrollo después de modificar `.env`.

## 6. Despliegue

Procedimiento recomendado:

### Paso 1 - Preparar código

Actualizar la rama de despliegue y verificar los cambios.

### Paso 2 - Instalar dependencias

```bash
npm install
```

### Paso 3 - Configurar entorno

Configurar las variables `VITE_*`.

### Paso 4 - Compilar

```bash
npm run build
```

### Paso 5 - Verificar build

Ejecutar:

```bash
npm run preview -w @happy-bags/landing-partners
```

### Paso 6 - Publicar

Subir el resultado generado por Vite al hosting configurado.

### Paso 7 - Validar

Comprobar:

- Página principal.
- Login.
- Logout.
- Recuperación de contraseña.
- Panel.
- Pedidos.
- Productos.
- Perfil.
- Directorio.
- Métricas.
- Google Maps.
- Imágenes.
- API.

## 7. Configuración del hosting

El hosting debe soportar una SPA.

Debido al uso de React Router, solicitudes directas a rutas como:

```text
/partners
/partners/orders
/partners/profile
```

deben devolver el `index.html` de la aplicación cuando la ruta no corresponde a un archivo estático.

Sin esta configuración, el navegador puede mostrar un error 404 al refrescar una ruta interna.

## 8. Monitoreo y diagnóstico

Durante desarrollo existe un mecanismo de logs HTTP para registrar:

- Peticiones.
- Respuestas.
- Métodos HTTP.
- Código de estado.
- Errores de conexión.

Los módulos relevantes son:

```text
dev_http_log.ts
vite_dev_api_log.ts
```

Estos mecanismos son especialmente útiles para diagnosticar:

- URLs incorrectas.
- Errores 401.
- Errores 404.
- Errores 422.
- Errores 500.
- Problemas de conexión con el backend.

## 9. Diagnóstico de errores HTTP

### 401 - Unauthorized

Posibles causas:

- Token ausente.
- Token expirado.
- Sesión inválida.
- Backend rechazó las credenciales.

Acciones:

1. Cerrar sesión.
2. Volver a iniciar sesión.
3. Verificar disponibilidad del endpoint.
4. Revisar la respuesta del backend.

### 404 - Not Found

Posibles causas:

- Endpoint incorrecto.
- Backend no disponible en la URL configurada.
- Ruta SPA no configurada en el hosting.

### 422 - Unprocessable Entity

Generalmente indica que el backend rechazó la estructura o contenido enviado.

Revisar:

- Nombre de los campos.
- Tipos.
- Campos obligatorios.
- Valores permitidos.

### 500 - Internal Server Error

Normalmente requiere revisión del backend.

El frontend debe registrar la operación que provocó el error y comunicarla al equipo responsable del API.

### 502 - Bad Gateway

En desarrollo puede producirse cuando el proxy de Vite no consigue comunicarse con el backend.

Verificar:

- `VITE_AUTH_API_URL`.
- Disponibilidad del backend.
- Conectividad.
- Certificados HTTPS.

## 10. Mantenimiento de autenticación

Si se modifica el contrato del login, revisar:

```text
partner_auth_client.ts
partner_auth_session_storage.ts
partner_session_store.ts
partner_auth_repository_impl.ts
```

Si cambian los nombres de los tokens o el formato de respuesta, deben actualizarse conjuntamente el parser y el almacenamiento de sesión.

## 11. Mantenimiento de pedidos

Si el backend cambia el contrato de pedidos, revisar:

```text
partner_orders_list_client.ts
partner_orders_status_client.ts
partner_order_validation.ts
admin_orders_client.ts
admin_orders_mapper.ts
```

Validar especialmente:

- Parámetros de filtros.
- Estados.
- Identificador de pedido.
- Estructura de respuesta.
- Paginación.

## 12. Mantenimiento de productos

Si cambia el modelo de producto, revisar:

```text
partner_products_client.ts
partner_product.ts
partner_products_repository_impl.ts
partners_products_page.tsx
```

Prestar especial atención a:

- `id`
- `name`
- `description`
- `price_original`
- `price_offer`
- `stock`
- `category_id`
- `image_main`
- `images`
- `is_active`

## 13. Mantenimiento de Google Maps

Revisar periódicamente:

- Vigencia de la API key.
- Restricciones por dominio.
- APIs habilitadas.
- Cuotas.
- `VITE_GOOGLE_API_KEY`.
- `VITE_GOOGLE_MAP_ID`.

No colocar una clave privada de Google en el código fuente.

## 14. Seguridad

Buenas prácticas:

- HTTPS obligatorio en producción.
- No publicar `.env`.
- No almacenar contraseñas.
- No registrar tokens en logs.
- Mantener las dependencias actualizadas.
- Validar permisos en backend.
- Aplicar CORS correctamente en el servidor.
- Restringir las claves de servicios externos.
- No confiar en controles de acceso implementados únicamente en React.

## 15. Gestión de cambios

Para cambios funcionales importantes:

1. Identificar el módulo afectado.
2. Revisar el modelo de dominio.
3. Revisar el cliente HTTP.
4. Revisar el repositorio.
5. Revisar hooks/stores.
6. Actualizar componentes.
7. Actualizar estilos si corresponde.
8. Ejecutar build.
9. Realizar pruebas funcionales.
10. Documentar el cambio.

## 16. Checklist previo a producción

```text
[ ] npm install ejecutado correctamente
[ ] npm run build sin errores
[ ] Variables VITE_* configuradas
[ ] Backend disponible
[ ] Login validado
[ ] Logout validado
[ ] Recuperación de contraseña validada
[ ] Panel validado
[ ] Pedidos validados
[ ] Productos validados
[ ] Perfil validado
[ ] Directorio validado
[ ] Métricas validadas
[ ] Google Maps validado
[ ] Imágenes validadas
[ ] Rutas SPA configuradas en hosting
[ ] HTTPS activo
[ ] Claves externas restringidas
[ ] No existen secretos en el bundle
```

## 17. Rollback

Ante un incidente posterior al despliegue:

1. Identificar la versión estable anterior.
2. Restaurar el artefacto anterior del frontend.
3. Mantener las variables de entorno compatibles.
4. Verificar conexión con el backend.
5. Validar login y operaciones críticas.
6. Registrar el incidente.
7. Corregir el problema en una rama de desarrollo antes de realizar un nuevo despliegue.

## 18. Soporte operativo

Al reportar un incidente se recomienda incluir:

- Fecha y hora.
- Usuario afectado, sin compartir contraseña.
- Pantalla o ruta.
- Acción realizada.
- Mensaje de error.
- Código HTTP si está disponible.
- Navegador.
- Ambiente: desarrollo, QA o producción.
- Evidencia visual si corresponde.

No incluir en el reporte:

- Contraseñas.
- Access tokens.
- Refresh tokens.
- Claves privadas.
- Información sensible innecesaria.

## 19. Responsabilidades

### Desarrollo frontend

Responsable de:

- Componentes.
- Routing.
- Estado.
- Integraciones HTTP.
- Validaciones de interfaz.
- Build.

### Backend

Responsable de:

- Autenticación.
- Autorización.
- Reglas de negocio.
- Persistencia.
- Contratos API.
- Seguridad del servidor.

### Operaciones / DevOps

Responsable de:

- Hosting.
- Variables de entorno.
- Despliegue.
- Certificados.
- Disponibilidad.
- Configuración de SPA.
- Monitoreo.

## 20. Nota de mantenimiento

El frontend y el backend deben mantenerse sincronizados respecto a los contratos API. Cualquier cambio en endpoints, nombres de campos, estados, autenticación o estructura de respuestas debe evaluarse en conjunto para evitar incompatibilidades.
