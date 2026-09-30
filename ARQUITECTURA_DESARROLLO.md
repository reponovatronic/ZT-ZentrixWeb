# Arquitectura y Desarrollo - ZentrixWeb

## 1. Visión arquitectónica

ZentrixWeb utiliza una arquitectura frontend modular basada en React + TypeScript y organizada como monorepo.

La solución separa las responsabilidades en capas de:

```text
Presentación
    ↓
Dominio
    ↓
Datos / HTTP
    ↓
API Backend
```

El objetivo de esta separación es evitar que las páginas y componentes dependan directamente de detalles de infraestructura.

## 2. Estructura del monorepo

```text
ZentrixWeb-main/
├── apps/
│   └── landing_partners/
│       ├── public/
│       ├── src/
│       │   ├── data/
│       │   ├── domain/
│       │   ├── presentation/
│       │   ├── main.tsx
│       │   └── vite-env.d.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── .env.example
├── packages/
│   └── partner-dashboard/
│       └── src/
├── package.json
└── package-lock.json
```

## 3. Capa de presentación

Ubicación:

```text
apps/landing_partners/src/presentation/
```

Contiene:

- Páginas.
- Componentes.
- Hooks.
- Stores.
- Contextos.
- Utilidades de interfaz.
- Estilos.

### Páginas principales

```text
presentation/pages/landing/
presentation/pages/partners/
```

Las páginas se conectan mediante React Router.

## 4. Routing

La aplicación utiliza:

```text
react-router-dom
```

Las rutas principales son:

```text
/
 /partners
 /partners/panel
 /partners/orders
 /partners/products
 /partners/directory
 /partners/metrics
 /partners/profile
 /partners/recover
 /partners/recover/reset
 /partners/recover/success
```

El router está definido en:

```text
src/presentation/app/app.tsx
```

## 5. Capa de dominio

Ubicación:

```text
src/domain/
```

Contiene entidades y reglas auxiliares independientes de la interfaz.

Ejemplos:

```text
entities/
repositories/
catalog/
utils/
```

Entre las entidades se encuentran:

- `partner`
- `partner_order_validation`
- `partner_product`
- `partner_profile`
- `partner_bank_account`
- `admin_order`
- `admin_partners_list`
- `partner_dashboard`

Esta capa permite mantener los modelos de negocio separados de los componentes visuales.

## 6. Capa de datos

Ubicación:

```text
src/data/
```

Se divide principalmente en:

```text
data/auth/
data/http/
data/mocks/
data/repositories/
```

### Clientes HTTP

Los clientes encapsulan las llamadas al backend.

Ejemplos:

```text
partner_auth_client.ts
partner_orders_list_client.ts
partner_orders_status_client.ts
partner_products_client.ts
partner_signup_client.ts
partner_password_reset_client.ts
partner_dashboard_client.ts
partner_profile...
partner_bank_accounts_client.ts
```

## 7. Repositorios

Los repositorios implementan la comunicación entre la lógica de dominio y los clientes HTTP.

Ejemplos:

```text
partner_auth_repository_impl.ts
partner_dashboard_repository_impl.ts
partner_profile_repository_impl.ts
partner_signup_repository_impl.ts
partner_bank_account_repository_impl.ts
admin_orders_repository_impl.ts
admin_partners_repository_impl.ts
```

La utilización de repositorios reduce el acoplamiento entre las páginas y la infraestructura HTTP.

## 8. Gestión de estado

La aplicación utiliza **Zustand** para estado global.

Entre los stores se encuentran:

```text
partner_session_store.ts
partner_dashboard_filters_store.ts
admin_partner_view_store.ts
session_unauthorized_ui_store.ts
```

La sesión mantiene información necesaria para conocer el usuario autenticado y controlar la navegación del portal.

## 9. Autenticación

La autenticación utiliza tokens Bearer.

Los tokens se almacenan durante la sesión mediante `sessionStorage`.

Claves utilizadas internamente:

```text
hb_partner_access_token
hb_partner_refresh_token
hb_partner_token_type
hb_partner_user_json
```

Las solicitudes autenticadas incluyen:

```http
Authorization: Bearer <token>
```

El frontend puede interpretar el rol del usuario para decidir la experiencia de navegación.

La autorización definitiva debe mantenerse en el backend.

## 10. Modos de API

La aplicación contempla dos modos:

```text
partner
admin
```

### Socio

Las operaciones utilizan principalmente:

```text
/partners/*
```

El token identifica al socio.

### Administrador

Las operaciones utilizan:

```text
/admin/*
```

Algunos endpoints administrativos pueden recibir:

```text
partner_id
```

para trabajar sobre el socio seleccionado.

## 11. Backend

El frontend no implementa la lógica de negocio principal ni la persistencia.

La comunicación se realiza mediante HTTP/JSON contra un backend externo.

La URL base se configura mediante:

```env
VITE_AUTH_API_URL=
```

En producción, el frontend construye URLs absolutas usando esta variable.

## 12. Proxy de desarrollo

Durante desarrollo, Vite intercepta determinadas rutas API y las reenvía hacia el backend configurado.

Esto permite que el navegador utilice rutas relativas como:

```text
/auth/login-partner
/partners/me
/partners/orders
/products
/admin/partners
```

sin necesidad de configurar manualmente cada URL en el código.

## 13. Configuración de Vite

El archivo:

```text
apps/landing_partners/vite.config.ts
```

configura:

- Plugin React.
- Alias `@`.
- Puerto 5173.
- Variables de entorno.
- Forwarding de API.
- Logs de peticiones/respuestas durante desarrollo.

El alias:

```text
@
```

apunta a:

```text
apps/landing_partners/src
```

Por ejemplo:

```ts
import { App } from "@/presentation/app/app";
```

## 14. Integraciones

### API backend

Responsable de:

- Autenticación.
- Usuarios.
- Socios.
- Pedidos.
- Productos.
- Dashboard.
- Bancos.
- Solicitudes de registro.
- Recuperación de contraseña.

### Google Maps

Utilizado para la selección/visualización de ubicación del socio.

Variables:

```env
VITE_GOOGLE_API_KEY=
VITE_GOOGLE_MAP_ID=
```

### WhatsApp

El landing incluye un componente de contacto mediante WhatsApp.

### App Store y Google Play

El landing permite configurar enlaces de descarga mediante:

```env
VITE_APP_STORE_URL=
VITE_GOOGLE_PLAY_URL=
```

## 15. Dashboard reutilizable

El paquete:

```text
packages/partner-dashboard/
```

contiene componentes reutilizables para el dashboard.

Incluye:

- Gráficos.
- Series.
- Escalas.
- Etiquetas.
- Filtros de rango.
- Datos mock.
- Estilos.

Esto permite mantener funcionalidades del dashboard fuera de la aplicación principal.

## 16. Ambientes

### Desarrollo

```text
Navegador
    ↓
Vite :5173
    ↓
Proxy/forwarder
    ↓
Backend
```

### Producción

```text
Navegador
    ↓
Frontend compilado
    ↓
API Backend
```

En producción las variables `VITE_*` se incorporan durante el build.

## 17. Decisiones de diseño

### Separación por capas

Permite modificar la infraestructura HTTP sin tener que reescribir los componentes de presentación.

### Repositorios

Permiten abstraer el acceso a datos y facilitan las pruebas y mantenimiento.

### Zustand

Se utiliza para evitar pasar manualmente el estado de sesión y filtros a través de múltiples niveles de componentes.

### React Router

Permite implementar una SPA con rutas diferenciadas para landing, socios y administración.

### Variables de entorno

Permiten cambiar el backend y otros servicios entre ambientes sin modificar el código fuente.

## 18. Consideraciones de seguridad

- El frontend no debe considerarse una frontera de seguridad.
- El backend debe validar tokens.
- El backend debe validar roles y permisos.
- Las rutas administrativas deben estar protegidas en servidor.
- Las claves públicas como Google Maps deben tener restricciones.
- No deben almacenarse secretos privados en variables `VITE_*`.
- La aplicación debe utilizar HTTPS en producción.

## 19. Pruebas y validación recomendada

Antes de liberar una versión:

1. Compilar con `npm run build`.
2. Probar inicio y cierre de sesión.
3. Probar recuperación de contraseña.
4. Validar rutas de socio.
5. Validar rutas administrativas.
6. Probar pedidos.
7. Probar productos.
8. Probar edición del perfil.
9. Probar carga de imágenes.
10. Probar Google Maps.
11. Validar comportamiento ante respuestas 401, 404, 422 y 500.
12. Probar el fallback de SPA en el hosting.
