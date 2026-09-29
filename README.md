# 3. Documentación funcional, diseño, mantenimiento y despliegue

## 1. Funcionalidad – Análisis funcional

### 1.1. Descripción general

El proyecto **ZentrixWeb** es una aplicación web desarrollada con **React + TypeScript + Vite**. El proyecto se encuentra organizado como un monorepo mediante **npm Workspaces** y contiene la aplicación principal `landing_partners` y el paquete reutilizable `partner-dashboard`.

La aplicación tiene dos grandes áreas funcionales:

1. **Landing pública**
   - Página principal.
   - Presentación de la propuesta de valor.
   - Secciones de cómo funciona el servicio.
   - Misión y visión.
   - Características del servicio.
   - Registro/invitación de socios.
   - Preguntas frecuentes.
   - Descarga de la aplicación móvil.
   - Acceso mediante WhatsApp.
   - Pie de página.

2. **Portal de socios y administradores**
   - Inicio de sesión.
   - Recuperación y restablecimiento de contraseña.
   - Panel principal.
   - Gestión de pedidos.
   - Gestión de productos.
   - Directorio de socios.
   - Métricas.
   - Perfil del socio.
   - Visualización administrativa de un socio.
   - Cierre de sesión.
   - Manejo de sesiones no autorizadas.

### 1.2. Flujo funcional de acceso

El flujo principal de autenticación es:

```text
Usuario
   |
   v
/partners
   |
   v
Ingresa email + contraseña
   |
   v
Zustand - partner_session_store
   |
   v
PartnerAuthRepositoryImpl
   |
   v
partner_auth_client
   |
   +--> POST /auth/login-partner
   |
   +--> si falla, POST /auth/login
   |
   v
Access Token + Refresh Token + Usuario
   |
   v
Almacenamiento de sesión
   |
   v
Validación del rol
   |
   +--> Partner ---> /partners/panel
   |
   +--> Admin -----> /partners/directory
```

La pantalla de acceso valida inicialmente que el correo tenga un formato válido y que exista una contraseña. Posteriormente, la autenticación se delega al store de sesión.

El cliente HTTP intenta primero el endpoint `/auth/login-partner`. Si este proceso falla, se intenta el endpoint `/auth/login`, permitiendo atender cuentas que son gestionadas mediante el mecanismo de autenticación general del backend.

Después de obtener el token, la aplicación recupera la información del usuario y valida que el rol tenga autorización para utilizar el portal.

### 1.3. Landing pública

La ruta `/` carga `LandingPage`, que organiza los principales componentes públicos:

- `Header`
- `Hero`
- `LandingHowItWorks`
- `LandingMissionVision`
- `LandingFeatures`
- `LandingPartnerSignup`
- `WhatsAppButton`
- `LandingFooter`

La página también soporta navegación mediante hash para desplazarse a determinadas secciones.

### 1.4. Portal de socios

El portal utiliza React Router para separar las funcionalidades por rutas:

| Ruta | Funcionalidad |
|---|---|
| `/partners` | Inicio de sesión |
| `/partners/recover` | Solicitud de recuperación de contraseña |
| `/partners/recover/reset` | Restablecimiento de contraseña |
| `/partners/recover/success` | Confirmación del proceso |
| `/partners/panel` | Dashboard principal |
| `/partners/orders` | Gestión/consulta de pedidos |
| `/partners/products` | Gestión de productos |
| `/partners/directory` | Directorio de socios |
| `/partners/metrics` | Métricas |
| `/partners/profile` | Perfil del socio |

### 1.5. Dashboard

El dashboard se implementa principalmente mediante el paquete reutilizable:

```text
packages/partner-dashboard/
```

Este paquete contiene el componente `PartnerDashboard` y componentes relacionados con:

- KPIs.
- Pedidos recientes.
- Gráfico de ventas.
- Gráfico de tipos.
- Navegación lateral.
- Herramientas del encabezado.
- Estados de carga.
- Mensajes de error.

Los datos reales se obtienen desde el API mediante repositorios y clientes HTTP. Cuando no se suministran determinados datos, el componente contempla valores mock definidos en el paquete.

### 1.6. Métricas

El hook `usePartnerDashboardMetrics` coordina:

1. Obtención del socio efectivo.
2. Filtros de fecha.
3. Consulta al repositorio de métricas.
4. Control de carga.
5. Control de errores.
6. Cancelación de solicitudes mediante `AbortController`.
7. Conversión de la respuesta del API a los modelos que consume el dashboard.

El flujo simplificado es:

```text
Filtros
   |
   v
usePartnerDashboardMetrics
   |
   v
AdminDashboardMetricsRepositoryImpl
   |
   v
Cliente HTTP
   |
   v
GET /partners/dashboard/metrics
   |
   v
Respuesta API
   |
   v
Mapper
   |
   +--> KPIs
   +--> Ventas semanales
   +--> Tipos de productos
```

### 1.7. Manejo de sesión

La sesión se centraliza mediante Zustand:

```text
usePartnerSessionStore
        |
        +-- refreshSession()
        +-- signInWithEmailPassword()
        +-- signOut()
```

El repositorio de autenticación se encarga de:

- Consultar la sesión.
- Ejecutar el inicio de sesión.
- Obtener información del usuario.
- Ejecutar el cierre de sesión.
- Limpiar la sesión local.

El sistema también contempla la situación de una sesión no autorizada y dispone de componentes específicos para comunicar este estado al usuario.

---

# 2. Diseño – Arquitectura y funcionamiento del código

## 2.1. Arquitectura general

La aplicación está organizada siguiendo una separación por responsabilidades cercana a una arquitectura por capas:

```text
ZentrixWeb
|
+-- apps/
|   |
|   +-- landing_partners/
|       |
|       +-- src/
|           |
|           +-- data/
|           +-- domain/
|           +-- presentation/
|           +-- main.tsx
|           +-- vite.config.ts
|
+-- packages/
    |
    +-- partner-dashboard/
```

La aplicación `landing_partners` contiene la implementación principal y `partner-dashboard` funciona como un paquete reutilizable de presentación del dashboard.

## 2.2. Capa de presentación

Ubicación:

```text
apps/landing_partners/src/presentation/
```

Contiene la interfaz que utiliza directamente el usuario.

Se divide principalmente en:

```text
presentation/
|
+-- app/
+-- components/
+-- contexts/
+-- hooks/
+-- mappers/
+-- pages/
+-- stores/
+-- styles/
+-- utils/
```

### `app`

Contiene la configuración principal de React Router y define las rutas de la aplicación.

El archivo:

```text
presentation/app/app.tsx
```

crea el `BrowserRouter` y registra las rutas públicas y privadas del portal.

### `pages`

Representa las páginas completas de la aplicación.

Ejemplos:

```text
pages/landing/landing_page.tsx
pages/partners/partners_panel_page.tsx
pages/partners/partners_orders_page.tsx
pages/partners/partners_products_page.tsx
pages/partners/partners_profile_page.tsx
```

### `components`

Contiene componentes reutilizables de interfaz.

Ejemplos:

- Modales.
- Selectores.
- Formularios.
- Componentes de navegación.
- Componentes de notificaciones.
- Componentes de la landing.
- Componentes del portal.

### `hooks`

Los hooks concentran lógica reutilizable de presentación.

Ejemplos:

```text
use_partner_dashboard_metrics.ts
use_partner_dashboard_filters.ts
use_admin_orders_list.ts
use_partner_profile_dictionaries.ts
```

Esto evita colocar toda la lógica directamente dentro de las páginas.

### `stores`

La gestión de estado global se realiza principalmente mediante **Zustand**.

El store más importante es:

```text
partner_session_store.ts
```

que administra:

- Usuario autenticado.
- Estado de carga.
- Errores de autenticación.
- Inicio de sesión.
- Cierre de sesión.
- Actualización de sesión.

## 2.3. Capa de dominio

Ubicación:

```text
apps/landing_partners/src/domain/
```

Esta capa contiene los conceptos propios del negocio.

### Entidades

Ubicación:

```text
domain/entities/
```

Ejemplos:

```text
partner.ts
partner_dashboard.ts
partner_order_validation.ts
partner_product.ts
partner_profile.ts
admin_order.ts
admin_dashboard_metrics.ts
```

Las entidades permiten representar la información del negocio independientemente de cómo sea obtenida desde el API.

### Repositorios

Ubicación:

```text
domain/repositories/
```

Los repositorios definen contratos para operaciones como:

- Autenticación.
- Perfil.
- Dashboard.
- Pedidos.
- Productos.
- Socios.

La capa de dominio no necesita conocer detalles específicos de HTTP.

## 2.4. Capa de datos

Ubicación:

```text
apps/landing_partners/src/data/
```

Se encarga de comunicarse con el backend y convertir las respuestas externas a modelos internos.

Se divide principalmente en:

```text
data/
|
+-- auth/
+-- http/
+-- mocks/
+-- repositories/
```

### Cliente HTTP

Los archivos de `data/http` construyen las solicitudes al backend.

Por ejemplo:

```text
partner_auth_client.ts
partner_dashboard_client.ts
partner_dashboard_metrics_client.ts
admin_orders_client.ts
admin_partners_client.ts
```

El cliente de autenticación determina la URL final del backend mediante:

```text
VITE_AUTH_API_URL
```

En producción genera URLs absolutas.

En desarrollo, las rutas pueden ser relativas para que Vite utilice el proxy implementado en `vite.config.ts`.

## 2.5. Proxy de desarrollo

`vite.config.ts` contiene un middleware que intercepta determinadas rutas del frontend y las reenvía al backend.

Entre las rutas contempladas se encuentran:

```text
/auth/*
/partners/me
/partners/photo
/partners/dashboard/*
/partners/orders/*
/partners/applications/*
/bank-accounts/*
/products/*
/admin/*
/mobile/dictionaries
```

El objetivo es permitir que durante el desarrollo el navegador consuma rutas relativas como:

```text
/auth/login-partner
```

mientras Vite las reenvía al backend configurado en:

```text
VITE_AUTH_API_URL
```

Esto facilita el desarrollo y evita depender de una URL fija en el código fuente.

## 2.6. Variables de entorno

El proyecto incluye:

```text
apps/landing_partners/.env.example
```

Las variables principales son:

```env
VITE_AUTH_API_URL=
VITE_ADMIN_API_URL=
VITE_GOOGLE_API_KEY=
VITE_GOOGLE_MAP_ID=
VITE_APP_STORE_URL=
VITE_GOOGLE_PLAY_URL=
```

### `VITE_AUTH_API_URL`

Define la URL base del backend de autenticación y de las principales operaciones del portal.

### `VITE_ADMIN_API_URL`

Permite definir una URL específica para endpoints administrativos.

Si no está definida, la aplicación puede utilizar `VITE_AUTH_API_URL` como base.

### `VITE_GOOGLE_API_KEY`

Se utiliza para funcionalidades relacionadas con Google Maps.

La clave debe restringirse en Google Cloud mediante dominios/referrers autorizados.

### Variables de tiendas

```text
VITE_APP_STORE_URL
VITE_GOOGLE_PLAY_URL
```

definen los destinos de los botones de descarga de la aplicación móvil.

## 2.7. Paquete `partner-dashboard`

Ubicación:

```text
packages/partner-dashboard/
```

Es un paquete reutilizable para presentar el dashboard.

Su componente principal es:

```text
PartnerDashboard.tsx
```

El componente recibe propiedades como:

```text
partnerName
partnerPhotoSrc
partnerRole
kpis
orders
weeklySalesChart
bagTypesChart
dashboardLoading
dashboardError
onSignOut
onNavItemClick
```

Esto permite que la interfaz del dashboard sea independiente de la fuente de datos.

La aplicación principal obtiene los datos y se los entrega al componente.

```text
API
 |
 v
Repositorio
 |
 v
Hook
 |
 v
Mapper
 |
 v
PartnerDashboard
```

Esta separación facilita reemplazar la fuente de datos o reutilizar el componente en otra aplicación.

## 2.8. Flujo completo de una consulta al backend

Ejemplo para métricas:

```text
Usuario
  |
  v
PartnersPanelPage
  |
  v
usePartnerDashboardMetrics()
  |
  v
AdminDashboardMetricsRepositoryImpl
  |
  v
Cliente HTTP
  |
  v
resolveAuthApiPath()
  |
  v
/partners/dashboard/metrics
  |
  v
Backend
  |
  v
JSON
  |
  v
Mapper
  |
  v
Dashboard
```

La aplicación utiliza interfaces de repositorio para desacoplar la lógica de negocio de los detalles de infraestructura.

---

# 3. Mantenimiento

## 3.1. Mantenimiento preventivo

Se recomienda realizar periódicamente:

- Actualización de dependencias npm.
- Revisión de vulnerabilidades mediante `npm audit`.
- Verificación de que la aplicación compile correctamente.
- Revisión de variables de entorno.
- Revisión de rutas del backend.
- Validación de permisos y roles.
- Verificación de las claves de Google Maps.
- Limpieza de código y componentes que ya no se utilizan.
- Revisión de logs de desarrollo.

Comandos básicos:

```bash
npm install
npm audit
npm run build
```

## 3.2. Actualización de dependencias

El proyecto utiliza npm Workspaces. Las dependencias se administran desde el `package.json` raíz y desde los `package.json` de cada workspace.

Antes de actualizar una dependencia importante:

1. Crear una rama de trabajo.
2. Ejecutar una instalación limpia.
3. Ejecutar el build.
4. Probar autenticación.
5. Probar landing.
6. Probar dashboard.
7. Probar rutas del portal.
8. Verificar integración con el backend.

No se recomienda actualizar React, Vite, TypeScript o React Router simultáneamente sin realizar pruebas completas.

## 3.3. Mantenimiento de variables de entorno

No se deben colocar credenciales privadas directamente en los archivos `.tsx`, `.ts` o `.css`.

El archivo:

```text
.env.example
```

debe utilizarse como referencia para conocer las variables requeridas.

El archivo `.env` real debe mantenerse fuera del repositorio cuando contenga valores propios del entorno.

Importante: las variables `VITE_*` son incorporadas al bundle del navegador durante el build. Por ello, **no deben contener secretos que deban permanecer privados**.

## 3.4. Mantenimiento de autenticación

Cuando se modifique el backend de autenticación se deben revisar como mínimo:

```text
data/http/partner_auth_client.ts
data/auth/partner_auth_session_storage.ts
data/auth/partner_session_hydrate.ts
data/repositories/partner_auth_repository_impl.ts
presentation/stores/partner_session_store.ts
```

Si cambia alguno de estos endpoints:

```text
/auth/login-partner
/auth/login
/auth/logout
/partners/me
```

debe verificarse el flujo completo de inicio y cierre de sesión.

## 3.5. Mantenimiento de endpoints

Cuando el backend cambie una ruta, se debe revisar:

1. Cliente HTTP.
2. Repositorio.
3. Entidad.
4. Mapper.
5. Hook.
6. Página que consume los datos.
7. Configuración del proxy de Vite, si corresponde.

Por ejemplo, si cambia:

```text
/partners/dashboard/metrics
```

se debe comprobar:

```text
partner_dashboard_metrics_client.ts
        |
        v
admin_dashboard_metrics_repository_impl.ts
        |
        v
use_partner_dashboard_metrics.ts
        |
        v
partners_panel_page.tsx
```

## 3.6. Mantenimiento visual

Los estilos se encuentran principalmente en:

```text
presentation/styles/
```

y en:

```text
packages/partner-dashboard/src/partner_dashboard.css
```

Al modificar estilos se recomienda comprobar:

- Desktop.
- Tablet.
- Móvil.
- Menús.
- Modales.
- Formularios.
- Dashboard.
- Gráficos.
- Navegación lateral.

## 3.7. Resolución de problemas frecuentes

### Error: falta `VITE_AUTH_API_URL`

Verificar que exista el archivo `.env` y que contenga:

```env
VITE_AUTH_API_URL=https://<backend>
```

Después reiniciar el servidor de desarrollo.

### Error 404 durante login

Verificar:

1. URL del backend.
2. Endpoint `/auth/login-partner`.
3. Endpoint `/auth/login`.
4. Estado del backend.
5. Variable `VITE_AUTH_API_URL`.

### El dashboard no muestra datos

Revisar:

```text
/partners/dashboard/metrics
/partners/dashboard
```

y verificar:

- Token.
- Rol del usuario.
- Identificador del socio.
- Parámetros de fecha.
- Respuesta JSON del backend.

### Las rutas funcionan en desarrollo pero fallan en producción

Si `/partners/panel` genera 404 al recargar la página, revisar la configuración del hosting para que las rutas de React sean redirigidas a:

```text
/index.html
```

Esto es necesario porque React Router gestiona las rutas del lado del cliente.

---

# 4. Informativo para el usuario – Pasos para desplegar el proyecto

## 4.1. Requisitos

Antes de realizar el despliegue se necesita:

- Node.js 20.x.
- npm.
- Acceso al repositorio.
- URL disponible del backend.
- Variables de entorno.
- Cuenta en el servicio de hosting.
- Clave de Google Maps si se utilizará el mapa.

El proyecto declara Node.js `20.x` como versión esperada.

## 4.2. Descargar el proyecto

Clonar el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
```

Ingresar al proyecto:

```bash
cd ZentrixWeb
```

## 4.3. Instalar dependencias

Desde la raíz del proyecto:

```bash
npm install
```

Al utilizar npm Workspaces, la instalación resuelve las dependencias de:

```text
apps/*
packages/*
```

incluyendo:

```text
apps/landing_partners
packages/partner-dashboard
```

## 4.4. Configurar variables de entorno

Crear:

```text
apps/landing_partners/.env
```

tomando como referencia:

```text
apps/landing_partners/.env.example
```

Ejemplo:

```env
VITE_AUTH_API_URL=https://mi-backend.com
VITE_ADMIN_API_URL=
VITE_GOOGLE_API_KEY=
VITE_GOOGLE_MAP_ID=
VITE_APP_STORE_URL=https://testflight.apple.com/join/m4PaxK1j
VITE_GOOGLE_PLAY_URL=https://play.google.com/apps/internaltest/4701022850167899685
```

Los valores deben reemplazarse por los correspondientes al ambiente donde se realizará el despliegue.

## 4.5. Probar localmente

Ejecutar desde la raíz:

```bash
npm run dev
```

El script raíz ejecuta el servidor de desarrollo del workspace `landing_partners`.

Por defecto, Vite utiliza:

```text
http://localhost:5173
```

Validar:

```text
/
 /partners
 /partners/recover
 /partners/panel
 /partners/orders
 /partners/products
 /partners/directory
 /partners/metrics
 /partners/profile
```

## 4.6. Generar el build de producción

Ejecutar:

```bash
npm run build
```

El script raíz ejecuta el build del workspace `landing_partners`.

El resultado se genera en:

```text
apps/landing_partners/dist/
```

Este directorio contiene los archivos estáticos que serán publicados por el hosting.

## 4.7. Despliegue en Render como Static Site

Para publicar el frontend en Render, crear un servicio de tipo **Static Site**.

Configuración recomendada:

### Root Directory

Si Render permite ejecutar los comandos desde la raíz del repositorio, utilizar:

```text
/
```

### Build Command

```bash
npm install && npm run build
```

### Publish Directory

```text
apps/landing_partners/dist
```

### Environment

Agregar las variables de entorno utilizadas por el frontend:

```text
VITE_AUTH_API_URL
VITE_ADMIN_API_URL
VITE_GOOGLE_API_KEY
VITE_GOOGLE_MAP_ID
VITE_APP_STORE_URL
VITE_GOOGLE_PLAY_URL
```

Las variables deben configurarse antes del proceso de build, porque Vite las incorpora al bundle generado.

## 4.8. Configuración de rutas SPA

La aplicación utiliza:

```text
BrowserRouter
```

por lo que el hosting debe devolver `index.html` cuando el navegador solicite una ruta que no corresponde a un archivo físico.

Por ejemplo:

```text
/partners
/partners/panel
/partners/orders
/partners/products
```

deben terminar sirviendo:

```text
/index.html
```

En Render se debe configurar una regla de rewrite para las rutas del frontend:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

La finalidad es permitir que React Router gestione la navegación.

## 4.9. Verificación después del deploy

Después de publicar, comprobar:

### Landing

```text
/
```

Verificar:

- Imágenes.
- Navegación.
- Botones.
- WhatsApp.
- Formularios.
- Enlaces externos.

### Autenticación

```text
/partners
```

Verificar:

- Inicio de sesión.
- Mensajes de error.
- Redirección según rol.
- Cierre de sesión.

### Recuperación

```text
/partners/recover
/partners/recover/reset
/partners/recover/success
```

### Portal

Verificar:

```text
/partners/panel
/partners/orders
/partners/products
/partners/directory
/partners/metrics
/partners/profile
```

### Integración con backend

Comprobar desde el navegador que las peticiones al backend respondan correctamente y que no existan errores de:

```text
CORS
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error
```

## 4.10. Actualización de una versión publicada

Para publicar una nueva versión:

```bash
git pull
npm install
npm run build
```

Si el despliegue está conectado al repositorio, realizar:

```bash
git add .
git commit -m "Actualización del frontend"
git push
```

El hosting ejecutará nuevamente el proceso de build y publicará la nueva versión.

## 4.11. Checklist de despliegue

Antes de considerar finalizado el despliegue:

- [ ] Node.js 20.x disponible.
- [ ] `npm install` ejecutado correctamente.
- [ ] Variables `VITE_*` configuradas.
- [ ] Backend disponible.
- [ ] `npm run build` ejecutado sin errores.
- [ ] Existe `apps/landing_partners/dist`.
- [ ] Publish Directory configurado correctamente.
- [ ] Rewrite de SPA configurado.
- [ ] Landing validada.
- [ ] Login validado.
- [ ] Recuperación de contraseña validada.
- [ ] Dashboard validado.
- [ ] Pedidos validados.
- [ ] Productos validados.
- [ ] Directorio validado.
- [ ] Métricas validadas.
- [ ] Perfil validado.
- [ ] Cierre de sesión validado.
- [ ] Integración con backend validada.
- [ ] Google Maps validado, si corresponde.
- [ ] Enlaces App Store y Google Play validados.

---

## 5. Resumen de arquitectura

```text
                         ZENTRIXWEB
                             |
             +---------------+---------------+
             |                               |
             v                               v
       LANDING PÚBLICA                 PORTAL DE SOCIOS
             |                               |
             |                         React Router
             |                               |
             |                    +----------+----------+
             |                    |          |          |
             |                    v          v          v
             |                 Pages      Hooks      Stores
             |                               |
             |                               v
             |                           Repositories
             |                               |
             |                               v
             |                           HTTP Clients
             |                               |
             +-------------------------------+
                                             |
                                             v
                                      Backend / API
                                             |
                                             v
                                         Respuestas
                                             |
                                             v
                                        Mappers
                                             |
                                             v
                                       Componentes
                                             |
                                             v
                                          Usuario
```

## 6. Tecnologías principales

| Tecnología | Uso |
|---|---|
| React 18 | Construcción de la interfaz |
| TypeScript | Tipado estático |
| Vite 5 | Desarrollo y build |
| React Router | Navegación y rutas SPA |
| Zustand | Estado global y sesión |
| React DOM | Renderizado |
| Google Maps API | Mapa y ubicación del socio |
| npm Workspaces | Organización del monorepo |
| Render Static Site | Alternativa de despliegue del frontend |

