# AUDITORIA DE SEGURIDAD — Superadmin OrderNow

> **Fecha:** 2026-03-24
> **Proyecto:** Panel Superadmin (Next.js 15 + React 18 + TypeScript)
> **Estado:** Pendiente de remediacion

---

## 1. Resumen Ejecutivo

| Criticidad | Cantidad | Estado |
|------------|----------|--------|
| CRITICA    | 5        | Pendiente |
| ALTA       | 6        | Pendiente |
| MEDIA      | 7        | Pendiente |
| BAJA       | 3        | Pendiente |
| **Total**  | **21**   | |

**Conclusion:** El proyecto presenta vulnerabilidades criticas en la gestion de tokens y sesiones que deben corregirse antes de un despliegue a produccion. La arquitectura de autenticacion almacena credenciales de forma insegura y el logout no invalida tokens en el backend.

---

## 2. Hallazgos Detallados — Ordenados por Prioridad de Ejecucion

---

### V-01: Tokens JWT almacenados en localStorage (XSS)

| Campo | Valor |
|-------|-------|
| **Criticidad** | CRITICA |
| **OWASP** | A07:2021 — Cross-Site Scripting (XSS) |
| **Prioridad** | P0 (inmediata) |
| **Archivos afectados** | `modules/auth/store/auth.ts`, `config/api.axios.ts` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
El store de Zustand persiste tokens (access + refresh) en `localStorage` usando `createJSONStorage(() => localStorage)`. Ademas se duplica en cookies sin flags de seguridad. `localStorage` es accesible desde cualquier JavaScript en la pagina, incluyendo scripts inyectados via XSS.

**Evidencia:**
```typescript
// modules/auth/store/auth.ts:98
{
  name: "auth-storage",
  storage: createJSONStorage(() => localStorage),
}

// modules/auth/store/auth.ts:32
Cookies.set("auth-storage", JSON.stringify(cookieData)); // Sin HttpOnly, Secure, SameSite
```

**Impacto:**
Un atacante que logre inyectar JS (XSS) puede robar access token + refresh token + datos del usuario con `localStorage.getItem("auth-storage")` o `document.cookie`, obteniendo acceso completo al panel de superadmin.

#### Tareas BACKEND

- [ ] **V-01-B1:** Modificar el endpoint `POST /auth/admin/login` para que setee las cookies de autenticacion desde el servidor con los flags de seguridad:
  ```
  Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
  Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh-token; Max-Age=604800
  ```
- [ ] **V-01-B2:** Modificar el endpoint `POST /auth/refresh-token` para que tambien setee las nuevas cookies HttpOnly desde el servidor.
- [ ] **V-01-B3:** Modificar el endpoint `POST /auth/logout` para que elimine las cookies HttpOnly (`Set-Cookie` con `Max-Age=0`).
- [ ] **V-01-B4:** Asegurar que el backend lea el token de la cookie HttpOnly en el header `Cookie` (no solo del header `Authorization`).

#### Tareas FRONTEND

- [ ] **V-01-F1:** Eliminar el almacenamiento de tokens en `localStorage` — quitar `persist` con `createJSONStorage(() => localStorage)` del auth store para datos de token. Solo persistir datos no sensibles (nombre, email, roles) en localStorage.
  - **Archivo:** `modules/auth/store/auth.ts`
- [ ] **V-01-F2:** Eliminar `Cookies.set("auth-storage", ...)` del store de auth — los tokens ya no se manejan desde JS.
  - **Archivo:** `modules/auth/store/auth.ts`
- [ ] **V-01-F3:** Eliminar la clase `TokenManager` del axios config — ya no se necesita leer tokens manualmente; el navegador enviara las cookies HttpOnly automaticamente.
  - **Archivo:** `config/api.axios.ts`
- [ ] **V-01-F4:** Configurar axios con `withCredentials: true` para que envie las cookies HttpOnly automaticamente:
  ```typescript
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
    withCredentials: true, // Envia cookies automaticamente
  });
  ```
  - **Archivo:** `config/api.axios.ts`
- [ ] **V-01-F5:** Eliminar el interceptor de request que agrega `Authorization: Bearer` manualmente — las cookies HttpOnly se envian solas.
  - **Archivo:** `config/api.axios.ts`

> **Nota:** Esta vulnerabilidad requiere coordinacion backend-frontend. El backend debe implementar V-01-B1 a V-01-B4 primero, y luego el frontend aplica V-01-F1 a V-01-F5.

---

### V-02: Refresh token enviado como query parameter en URL

| Campo | Valor |
|-------|-------|
| **Criticidad** | CRITICA |
| **OWASP** | A04:2021 — Insecure Design |
| **Prioridad** | P0 (inmediata) |
| **Archivos afectados** | `config/api.axios.ts:225`, `modules/auth/services/authService.ts:53` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
El refresh token se envia como parametro de URL (`?refreshToken=...`). Las URLs se registran en historial del navegador, logs del servidor, logs de proxies, y headers `Referer`.

**Evidencia:**
```typescript
// config/api.axios.ts:225
const response = await axios.post(
  `${api.defaults.baseURL}/auth/refresh-token?refreshToken=${encodeURIComponent(currentRefreshToken)}`
);

// modules/auth/services/authService.ts:53
const response = await api.post(`/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}`);
```

**Impacto:**
El refresh token (de larga duracion) queda expuesto en multiples registros. Un atacante con acceso a logs puede obtener refresh tokens validos y generar access tokens indefinidamente.

#### Tareas BACKEND

- [ ] **V-02-B1:** Modificar el endpoint `POST /auth/refresh-token` para aceptar el refresh token en el body del request en lugar de como query parameter:
  ```json
  // Request body esperado:
  { "refreshToken": "<token>" }
  ```
- [ ] **V-02-B2:** (Opcional) Mantener compatibilidad temporal con query parameter pero marcar como deprecated con fecha de remocion.

#### Tareas FRONTEND

- [ ] **V-02-F1:** Modificar `refreshTokenService` para enviar el token en el body:
  ```typescript
  // modules/auth/services/authService.ts
  export const refreshTokenService = async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await api.post("/auth/refresh-token", { refreshToken });
    return response.data.data;
  };
  ```
  - **Archivo:** `modules/auth/services/authService.ts`
- [ ] **V-02-F2:** Modificar el interceptor de respuesta en axios para enviar el refresh token en el body:
  ```typescript
  // config/api.axios.ts - dentro del interceptor de respuesta
  const response = await axios.post(
    `${api.defaults.baseURL}/auth/refresh-token`,
    { refreshToken: currentRefreshToken }
  );
  ```
  - **Archivo:** `config/api.axios.ts`

> **Nota:** Coordinar con backend. El backend debe aceptar el body (V-02-B1) antes de que el frontend cambie (V-02-F1, V-02-F2). Si se mantiene compatibilidad temporal (V-02-B2), el frontend puede migrar independientemente.

---

### V-03: Logout no invalida tokens en el backend

| Campo | Valor |
|-------|-------|
| **Criticidad** | CRITICA |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Prioridad** | P0 (inmediata) |
| **Archivos afectados** | `components/layouts/Sidebar.tsx:88-100` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
La funcion `handleLogout` solo limpia cookies y localStorage del cliente pero **nunca llama a `logoutService()`** para invalidar los tokens en el backend. El servicio existe en `authService.ts:62` pero no se usa.

**Evidencia:**
```typescript
// components/layouts/Sidebar.tsx:88-100
const handleLogout = async () => {
  setIsLoggingOut(true);
  try {
    logout(); // Solo limpia estado local — NO llama al backend
    toast.success("Sesion cerrada exitosamente");
    router.push("/login");
  } catch (error) {
    toast.error("Error al cerrar sesion");
  }
};
```

**Impacto:**
Despues de "cerrar sesion", los tokens siguen siendo validos. Un atacante que haya capturado un token puede seguir usandolo hasta que expire.

#### Tareas BACKEND

- [ ] **V-03-B1:** Verificar que el endpoint `POST /auth/logout` realmente invalide/revoque el access token y el refresh token (blacklist o eliminacion en BD).
- [ ] **V-03-B2:** Verificar que el endpoint retorne 200 incluso si el token ya expiro (para no bloquear el logout del frontend).

#### Tareas FRONTEND

- [ ] **V-03-F1:** Modificar `handleLogout` en Sidebar.tsx para llamar a `logoutService()` antes de limpiar el estado local:
  ```typescript
  import { logoutService } from "@/modules/auth/services/authService";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutService(); // Invalida token en el backend
    } catch (error) {
      // Si falla el backend, continuar con limpieza local igualmente
    } finally {
      logout(); // Limpia estado local
      toast.success("Sesion cerrada exitosamente");
      router.push("/login");
      setIsLoggingOut(false);
    }
  };
  ```
  - **Archivo:** `components/layouts/Sidebar.tsx`

> **Nota:** La tarea frontend (V-03-F1) puede implementarse inmediatamente — el servicio `logoutService` ya existe. Las tareas backend son de verificacion.

---

### V-04: Middleware no verifica firma ni expiracion del JWT

| Campo | Valor |
|-------|-------|
| **Criticidad** | CRITICA |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Prioridad** | P0 (inmediata) |
| **Archivos afectados** | `middleware.ts:14-60` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
El middleware solo verifica que exista un token y que el JSON contenga `ROLE_SUPER_ADMIN`. No verifica la firma criptografica del JWT ni su expiracion. Un atacante puede crear una cookie con un JSON fabricado.

**Evidencia:**
```typescript
// middleware.ts:7-8
function isSuperAdmin(authData: any): boolean {
  if (!authData?.user?.roles) return false;
  return authData.user.roles.some((role: any) => role.name === "ROLE_SUPER_ADMIN");
}

// middleware.ts:46-50 — Solo verifica que exista, no que sea valido
const token = parsed?.token;
if (!token) { /* redirect */ }
if (!isSuperAdmin(parsed)) { /* redirect */ }
```

**Impacto:**
Un atacante puede crear manualmente una cookie `auth-storage` con un JWT falso y rol `ROLE_SUPER_ADMIN` para acceder a todas las rutas protegidas del dashboard. Aunque las llamadas API fallarian (el backend si valida), el atacante veria la UI completa y podria descubrir endpoints.

#### Tareas BACKEND

- [ ] **V-04-B1:** Exponer la clave publica (o el secret si es HMAC) del JWT para que el frontend pueda verificar la firma. Opciones:
  - Agregar variable de entorno `JWT_SECRET` (si HMAC/HS256)
  - Exponer endpoint `GET /auth/.well-known/jwks.json` (si RSA/RS256)
- [ ] **V-04-B2:** Documentar el algoritmo de firma usado (HS256, RS256, etc.) y la estructura del payload del JWT (que claims contiene: roles, sub, exp, etc.).

#### Tareas FRONTEND

- [ ] **V-04-F1:** Instalar la libreria `jose` para verificacion de JWT:
  ```bash
  npm install jose
  ```
- [ ] **V-04-F2:** Reescribir el middleware para verificar la firma y expiracion del JWT:
  ```typescript
  import { jwtVerify } from 'jose';
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/server';

  export async function middleware(request: NextRequest) {
    const authData = request.cookies.get('auth-storage')?.value;
    const pathname = request.nextUrl.pathname;

    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname === '/login') {
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const secret = new TextEncoder().encode(process.env.JWT_SECRET);
          await jwtVerify(parsed.token, secret);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch {
          // Token invalido o expirado, permitir acceso al login
        }
      }
      return NextResponse.next();
    }

    if (!authData) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const parsed = JSON.parse(authData);
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(parsed.token, secret);

      // Verificar rol desde el payload verificado, no desde la cookie
      const roles = (payload.roles as any[]) || [];
      const isSuperAdmin = roles.some((r: any) =>
        typeof r === 'string' ? r === 'ROLE_SUPER_ADMIN' : r.name === 'ROLE_SUPER_ADMIN'
      );

      if (!isSuperAdmin) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  ```
  - **Archivo:** `middleware.ts`
- [ ] **V-04-F3:** Agregar `JWT_SECRET` al `.env.local` (NO usar `NEXT_PUBLIC_` — debe ser server-side only):
  ```
  JWT_SECRET=<obtener del equipo de backend>
  ```
  - **Archivo:** `.env.local`

> **Nota:** El backend debe proveer el secret/clave publica (V-04-B1) antes de que el frontend pueda implementar la verificacion. La estructura del payload (V-04-B2) es necesaria para saber como extraer los roles.

---

### V-05: Comunicacion API via HTTP sin cifrar

| Campo | Valor |
|-------|-------|
| **Criticidad** | CRITICA |
| **OWASP** | A02:2021 — Cryptographic Failures |
| **Prioridad** | P0 (inmediata para produccion) |
| **Archivos afectados** | `.env` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
La URL de la API usa HTTP plano, transmitiendo tokens JWT y credenciales sin cifrado.

**Evidencia:**
```
NEXT_PUBLIC_API_URL=http://192.168.0.101:9090/api/v1
```

**Impacto:**
Un atacante en la misma red puede interceptar (MITM) todas las credenciales, tokens y datos sensibles transmitidos.

#### Tareas BACKEND

- [ ] **V-05-B1:** Configurar HTTPS/TLS en el servidor backend (puerto 443 o el que corresponda).
- [ ] **V-05-B2:** Obtener certificados SSL/TLS (Let's Encrypt para produccion, mkcert para desarrollo local).
- [ ] **V-05-B3:** Configurar redireccion HTTP -> HTTPS obligatoria.

#### Tareas FRONTEND

- [ ] **V-05-F1:** Crear archivo `.env.production` con URL HTTPS:
  ```
  NEXT_PUBLIC_API_URL=https://api.ordernow.com/api/v1
  ```
  - **Archivo:** `.env.production` (nuevo)
- [ ] **V-05-F2:** Actualizar `.env` de desarrollo para usar HTTPS local:
  ```
  NEXT_PUBLIC_API_URL=https://localhost:9090/api/v1
  ```
  - **Archivo:** `.env`
- [ ] **V-05-F3:** Eliminar el fallback HTTP hardcodeado en api.axios.ts:
  ```typescript
  // ANTES (inseguro):
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.198:9090/api/v1',
  // DESPUES (seguro):
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Sin fallback HTTP
  ```
  - **Archivo:** `config/api.axios.ts`

> **Nota:** Para desarrollo local, usar `mkcert` para generar certificados locales. El backend debe tener HTTPS habilitado antes de que el frontend cambie la URL.

---

### V-06: Ausencia total de headers de seguridad HTTP

| Campo | Valor |
|-------|-------|
| **Criticidad** | ALTA |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **Prioridad** | P1 (esta semana) |
| **Archivos afectados** | `next.config.js` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
No se configuran Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Referrer-Policy ni Permissions-Policy.

**Impacto:**
Vulnerable a clickjacking (iframe embedding), MIME sniffing, y no hay proteccion CSP contra XSS.

#### Tareas BACKEND

- [ ] **V-06-B1:** Configurar headers CORS en el backend para permitir solo el dominio del frontend:
  ```
  Access-Control-Allow-Origin: https://admin.ordernow.com
  Access-Control-Allow-Credentials: true
  ```

#### Tareas FRONTEND

- [ ] **V-06-F1:** Agregar la funcion `headers()` en `next.config.js`:
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    eslint: { ignoreDuringBuilds: false },
    images: { unoptimized: true },
    async headers() {
      return [{
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://avatar.vercel.sh data:",
              "connect-src 'self' https://api.ordernow.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      }];
    },
  };
  module.exports = nextConfig;
  ```
  - **Archivo:** `next.config.js`

> **Nota:** La tarea frontend (V-06-F1) es independiente del backend y puede ejecutarse inmediatamente. Ajustar `connect-src` con la URL real del API.

---

### V-07: Ausencia de proteccion CSRF

| Campo | Valor |
|-------|-------|
| **Criticidad** | ALTA |
| **OWASP** | A01:2021 — Broken Access Control |
| **Prioridad** | P1 (esta semana) |
| **Archivos afectados** | Todos los formularios y llamadas API |
| **Estado** | [ ] Pendiente |

**Descripcion:**
No existe token CSRF en ningun formulario ni en las peticiones API. Las cookies de autenticacion se envian automaticamente, permitiendo que un sitio malicioso ejecute acciones en nombre del usuario autenticado.

**Impacto:**
Un atacante puede crear una pagina que ejecute acciones administrativas (crear usuarios, eliminar establecimientos) si el superadmin la visita mientras tiene sesion activa.

#### Tareas BACKEND

- [ ] **V-07-B1:** Configurar las cookies de autenticacion con `SameSite=Strict` (mitiga CSRF en navegadores modernos).
- [ ] **V-07-B2:** (Opcional) Implementar generacion de token CSRF en endpoint dedicado y validacion del header `X-CSRF-Token` en endpoints que mutan datos (POST, PUT, DELETE).

#### Tareas FRONTEND

- [ ] **V-07-F1:** Si el backend implementa V-07-B2, agregar el header `X-CSRF-Token` en el interceptor de axios:
  ```typescript
  api.interceptors.request.use((config) => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  });
  ```
  - **Archivo:** `config/api.axios.ts`
- [ ] **V-07-F2:** Si se usa `SameSite=Strict` (V-07-B1), verificar que no rompa flujos de redireccion desde emails u otros sitios.

> **Nota:** La mitigacion principal es `SameSite=Strict` en cookies (tarea backend). El token CSRF es una capa adicional opcional. Si se implementa V-01 (cookies HttpOnly), `SameSite=Strict` se incluye automaticamente.

---

### V-08: Race condition potencial en refresh de token

| Campo | Valor |
|-------|-------|
| **Criticidad** | ALTA |
| **OWASP** | A04:2021 — Insecure Design |
| **Prioridad** | P1 (esta semana) |
| **Archivos afectados** | `config/api.axios.ts:130-254` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
Aunque existe una cola (`failedQueue`) para manejar multiples 401 simultaneos, hay una ventana de tiempo entre `isRefreshing = true` y la resolucion del refresh donde los tokens en storage pueden estar desincronizados entre localStorage y cookies.

**Evidencia:**
```typescript
// api.axios.ts - updateTokens escribe en localStorage Y cookies separadamente
updateTokens(token, refreshToken, tokenExpiresIn): void {
  // Primero localStorage — si falla despues, quedan desincronizados
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
  // Luego cookies
  Cookies.set(STORAGE_KEY, JSON.stringify(parsedCookie));
}
```

**Impacto:**
En escenarios de multiples tabs o peticiones concurrentes, los tokens pueden quedar en estado inconsistente, causando ciclos de refresh infinitos o logout involuntario.

#### Tareas BACKEND

- [ ] **V-08-B1:** No aplica directamente. Se resuelve con V-01 (cookies HttpOnly desde backend) que elimina la duplicacion de storage.

#### Tareas FRONTEND

- [ ] **V-08-F1:** Usar una unica fuente de verdad para tokens. Si se implementa V-01, esta vulnerabilidad se resuelve automaticamente al eliminar `TokenManager`.
- [ ] **V-08-F2:** (Si V-01 no se implementa aun) Unificar el storage: eliminar una de las dos fuentes (cookies O localStorage, no ambas) y usar solo una:
  ```typescript
  // Usar solo cookies como fuente unica
  updateTokens(token: string, refreshToken: string, tokenExpiresIn: number): void {
    const cookieData = { token, refreshToken, tokenExpiresIn };
    Cookies.set(STORAGE_KEY, JSON.stringify(cookieData));
    // NO escribir en localStorage
  }
  ```
  - **Archivo:** `config/api.axios.ts`

> **Nota:** Esta vulnerabilidad se resuelve completamente al implementar V-01. Si V-01 se pospone, aplicar V-08-F2 como mitigacion temporal.

---

### V-09: Datos sensibles expuestos en estado de Zustand (DevTools)

| Campo | Valor |
|-------|-------|
| **Criticidad** | ALTA |
| **OWASP** | A04:2021 — Insecure Design |
| **Prioridad** | P1 (esta semana) |
| **Archivos afectados** | `modules/auth/store/auth.ts`, `modules/admin/store/user.ts`, `modules/admin/store/employees.ts` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
Los stores de Zustand contienen tokens JWT, refresh tokens y datos de usuarios. Con DevTools o la consola del navegador, cualquier persona con acceso fisico al equipo puede extraer estos datos. Ademas, los stores de users y employees persisten PII en localStorage.

**Evidencia:**
```typescript
// Accesible desde consola: useAuthStore.getState()
// Retorna: { user, token, refreshToken, tokenExpiresIn, roles }

// modules/admin/store/user.ts — persiste datos de TODOS los usuarios
persist((set) => ({...}), { name: "users-storage", getStorage: () => localStorage })
```

**Impacto:**
Datos PII de todos los usuarios del sistema accesibles desde localStorage.

#### Tareas BACKEND

- [ ] **V-09-B1:** No aplica directamente. Es un problema de arquitectura frontend.

#### Tareas FRONTEND

- [ ] **V-09-F1:** Eliminar `persist` del store de users — los datos de usuarios deben venir de React Query con `gcTime` apropiado, no persistir en localStorage:
  ```typescript
  // modules/admin/store/user.ts — ANTES:
  export const useUsersStore = create<UsersStore>()(
    persist((set) => ({...}), { name: "users-storage", getStorage: () => localStorage })
  );

  // DESPUES:
  export const useUsersStore = create<UsersStore>()((set) => ({
    users: [],
    totalElements: 0,
    setUsers: (users) => set({ users }),
    setTotalElements: (total) => set({ totalElements: total }),
  }));
  ```
  - **Archivo:** `modules/admin/store/user.ts`
- [ ] **V-09-F2:** Eliminar `persist` del store de employees (misma logica):
  - **Archivo:** `modules/admin/store/employees.ts`
- [ ] **V-09-F3:** Eliminar `persist` del store de roles:
  - **Archivo:** `modules/admin/store/roles.ts`
- [ ] **V-09-F4:** En el auth store, si no se implementa V-01 aun, al menos no persistir los tokens — solo persistir datos no sensibles del usuario:
  ```typescript
  // Solo persistir datos de UI, no tokens
  {
    name: "auth-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      user: state.user ? {
        id: state.user.id,
        email: state.user.email,
        firstName: state.user.firstName,
        lastName: state.user.lastName,
        roles: state.user.roles,
      } : null,
      roles: state.roles,
      // NO incluir: token, refreshToken, tokenExpiresIn
    }),
  }
  ```
  - **Archivo:** `modules/auth/store/auth.ts`

> **Nota:** V-09-F1, V-09-F2 y V-09-F3 son independientes del backend y pueden ejecutarse inmediatamente.

---

### V-10: console.log/error expone datos sensibles

| Campo | Valor |
|-------|-------|
| **Criticidad** | ALTA |
| **OWASP** | A09:2021 — Security Logging and Monitoring Failures |
| **Prioridad** | P1 (esta semana) |
| **Archivos afectados** | `config/api.axios.ts`, `modules/auth/store/auth.ts`, `hooks/useRequireAuth.ts`, multiples services/hooks |
| **Estado** | [ ] Pendiente |

**Descripcion:**
Multiples `console.error` y `console.warn` registran errores completos que pueden incluir tokens, datos de respuesta del API, o informacion del sistema.

**Evidencia:**
```typescript
// config/api.axios.ts:37
console.error('Error al obtener token:', error);
// modules/auth/store/auth.ts:72
console.error('[AuthStore] Error during logout:', error);
```

**Impacto:**
En produccion, los logs de consola son visibles para cualquier usuario que abra DevTools.

#### Tareas BACKEND

- [ ] **V-10-B1:** No aplica. Es un problema exclusivamente frontend.

#### Tareas FRONTEND

- [ ] **V-10-F1:** Agregar `removeConsole` en la configuracion del compilador de Next.js para eliminar todos los `console.*` en produccion:
  ```javascript
  // next.config.js
  const nextConfig = {
    // ... config existente ...
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
  };
  ```
  - **Archivo:** `next.config.js`
- [ ] **V-10-F2:** (Alternativa si se necesitan logs en produccion) Reemplazar `console.*` con un logger que filtre datos sensibles y solo funcione en desarrollo:
  ```typescript
  // lib/logger.ts (nuevo archivo)
  const isDev = process.env.NODE_ENV === 'development';
  export const logger = {
    error: (msg: string, ...args: any[]) => isDev && console.error(msg, ...args),
    warn: (msg: string, ...args: any[]) => isDev && console.warn(msg, ...args),
  };
  ```

> **Nota:** V-10-F1 es la solucion mas rapida y es independiente del backend. Puede ejecutarse inmediatamente.

---

### V-11: Enumeracion de usuarios via mensajes de error diferenciados

| Campo | Valor |
|-------|-------|
| **Criticidad** | ALTA |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Prioridad** | P1 (esta semana) |
| **Archivos afectados** | `modules/auth/hooks/useLogin.ts:35-53` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
Los mensajes de error de login diferencian entre "cuenta deshabilitada", "acceso denegado (403)" y "credenciales incorrectas", permitiendo a un atacante determinar si un email existe en el sistema.

**Evidencia:**
```typescript
if (errorCode === "ACCOUNT_DISABLED") {
  toast.info("Verificacion de email requerida"); // Confirma que el email existe
}
if (error.response?.status === 403) {
  toast.error("No tienes permisos de Super Administrador."); // Confirma que el email existe
} else {
  toast.error("Credenciales incorrectas o no tienes permisos");
}
```

**Impacto:**
Un atacante puede enumerar emails validos probando diferentes direcciones y observando el mensaje de error.

#### Tareas BACKEND

- [ ] **V-11-B1:** Unificar las respuestas de error del endpoint de login para que retornen el mismo codigo HTTP (401) y mensaje generico, sin importar si el usuario no existe, la contrasena es incorrecta, o la cuenta esta deshabilitada.

#### Tareas FRONTEND

- [ ] **V-11-F1:** Unificar todos los mensajes de error en un solo mensaje generico:
  ```typescript
  // modules/auth/hooks/useLogin.ts
  onError: (error: AxiosError<any>) => {
    toast.error("Credenciales incorrectas o acceso no autorizado", {
      description: "Verifica tu email y contrasena e intenta nuevamente.",
    });
  },
  ```
  - **Archivo:** `modules/auth/hooks/useLogin.ts`

> **Nota:** V-11-F1 puede implementarse inmediatamente sin depender del backend. Idealmente el backend tambien unifica (V-11-B1) para no filtrar informacion en los codigos HTTP.

---

### V-12: ESLint deshabilitado en builds de produccion

| Campo | Valor |
|-------|-------|
| **Criticidad** | MEDIA |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **Prioridad** | P2 (este sprint) |
| **Archivos afectados** | `next.config.js` |
| **Estado** | [ ] Pendiente |

**Evidencia:**
```javascript
eslint: { ignoreDuringBuilds: true }
```

**Impacto:**
Errores de linting que podrian indicar vulnerabilidades no se detectan en el proceso de build.

#### Tareas BACKEND

- [ ] **V-12-B1:** No aplica.

#### Tareas FRONTEND

- [ ] **V-12-F1:** Cambiar `ignoreDuringBuilds` a `false`:
  ```javascript
  eslint: { ignoreDuringBuilds: false }
  ```
  - **Archivo:** `next.config.js`
- [ ] **V-12-F2:** Corregir todos los errores de ESLint que aparezcan al hacer build, para que el build no falle.

> **Nota:** Ejecutar `npm run build` despues del cambio para identificar errores de lint existentes. Puede ejecutarse inmediatamente.

---

### V-13: Validacion de contrasena inconsistente (login vs cambio)

| Campo | Valor |
|-------|-------|
| **Criticidad** | MEDIA |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Prioridad** | P2 (este sprint) |
| **Archivos afectados** | `modules/auth/validations/authValidation.ts:3-6` |
| **Estado** | [ ] Pendiente |

**Evidencia:**
```typescript
// Login: min 6, sin complejidad
password: Yup.string().min(6, "...")
// Cambio: min 8, con complejidad
newPassword: Yup.string().min(8, "...").matches(...)
```

#### Tareas BACKEND

- [ ] **V-13-B1:** No aplica directamente (el backend ya tiene la politica de contrasena almacenada).

#### Tareas FRONTEND

- [ ] **V-13-F1:** Alinear el minimo de caracteres del login a 8 por consistencia:
  ```typescript
  password: Yup.string()
    .min(8, "La contrasena debe tener al menos 8 caracteres")
    .required("La contrasena es obligatoria"),
  ```
  - **Archivo:** `modules/auth/validations/authValidation.ts`

---

### V-14: Sin validacion de longitud maxima en campos de texto

| Campo | Valor |
|-------|-------|
| **Criticidad** | MEDIA |
| **OWASP** | A03:2021 — Injection |
| **Prioridad** | P2 (este sprint) |
| **Archivos afectados** | `CreateUserDialog.tsx`, `EstablishmentDialog.tsx`, `PermissionDialog.tsx`, `RoleDialog.tsx`, `PlanDialog.tsx` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
Los schemas de validacion definen `min` pero no `max` para campos de texto. Payloads extremadamente grandes podrian causar problemas de rendimiento.

#### Tareas BACKEND

- [ ] **V-14-B1:** Verificar que el backend tenga validacion de longitud maxima en todos los campos. Si no la tiene, agregarla.

#### Tareas FRONTEND

- [ ] **V-14-F1:** Agregar `.max()` a todos los campos string en los schemas de validacion. Ejemplo para CreateUserDialog:
  ```typescript
  const userSchema = yup.object().shape({
    firstName: yup.string().max(100, "Maximo 100 caracteres").required("El nombre es requerido"),
    lastName: yup.string().max(100, "Maximo 100 caracteres").required("El apellido es requerido"),
    email: yup.string().email("Email invalido").max(255, "Maximo 255 caracteres").required(),
    phoneNumber: yup.string().max(20, "Maximo 20 caracteres").required(),
    roles: yup.array().min(1).required()
  });
  ```
  - **Archivos:** Todos los dialogs con schemas de validacion
- [ ] **V-14-F2:** Agregar atributo `maxLength` a los inputs HTML como segunda capa de proteccion.

---

### V-15: Sin formato de validacion para telefono

| Campo | Valor |
|-------|-------|
| **Criticidad** | MEDIA |
| **OWASP** | A03:2021 — Injection |
| **Prioridad** | P2 (este sprint) |
| **Archivos afectados** | `CreateUserDialog.tsx`, `CreateEmployeeDialog.tsx` |
| **Estado** | [ ] Pendiente |

**Evidencia:**
```typescript
phoneNumber: yup.string().required("El telefono es requerido") // Sin regex de formato
```

#### Tareas BACKEND

- [ ] **V-15-B1:** Verificar que el backend valide formato de telefono en la recepcion de datos.

#### Tareas FRONTEND

- [ ] **V-15-F1:** Agregar validacion de formato al schema:
  ```typescript
  phoneNumber: yup.string()
    .matches(/^\+?[0-9]{7,15}$/, "Formato de telefono invalido")
    .required("El telefono es requerido")
  ```
  - **Archivos:** `CreateUserDialog.tsx`, `CreateEmployeeDialog.tsx`

---

### V-16: Notificaciones sin schema de validacion

| Campo | Valor |
|-------|-------|
| **Criticidad** | MEDIA |
| **OWASP** | A03:2021 — Injection |
| **Prioridad** | P2 (este sprint) |
| **Archivos afectados** | `modules/notifications/components/CreateNotificationDialog.tsx` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
El formulario de creacion de notificaciones usa validacion manual con `if (!title.trim())` en lugar de un schema Yup/Zod.

#### Tareas BACKEND

- [ ] **V-16-B1:** Verificar que el backend valide titulo y cuerpo de notificaciones (longitud, caracteres permitidos).

#### Tareas FRONTEND

- [ ] **V-16-F1:** Crear un schema Zod y usar react-hook-form con zodResolver:
  ```typescript
  import { z } from 'zod';

  const notificationSchema = z.object({
    title: z.string().min(1, "El titulo es requerido").max(150, "Maximo 150 caracteres"),
    body: z.string().min(1, "El contenido es requerido").max(1000, "Maximo 1000 caracteres"),
    type: z.enum(["GLOBAL", "ESTABLISHMENT"]),
    establishmentId: z.number().optional(),
  }).refine(
    (data) => data.type !== "ESTABLISHMENT" || data.establishmentId !== undefined,
    { message: "Selecciona un establecimiento", path: ["establishmentId"] }
  );
  ```
  - **Archivo:** `modules/notifications/components/CreateNotificationDialog.tsx`

---

### V-17: Catch blocks vacios que ocultan errores

| Campo | Valor |
|-------|-------|
| **Criticidad** | MEDIA |
| **OWASP** | A09:2021 — Security Logging and Monitoring Failures |
| **Prioridad** | P2 (este sprint) |
| **Archivos afectados** | `modules/notifications/components/NotificationList.tsx` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
Varios `catch {}` silencian errores completamente, haciendo imposible diagnosticar fallos de seguridad.

#### Tareas BACKEND

- [ ] **V-17-B1:** No aplica.

#### Tareas FRONTEND

- [ ] **V-17-F1:** Reemplazar los catch blocks vacios con manejo de error adecuado:
  ```typescript
  // ANTES:
  } catch {
    // Silently fail
  }

  // DESPUES:
  } catch (error) {
    toast.error("Error al cargar notificaciones");
  }
  ```
  - **Archivo:** `modules/notifications/components/NotificationList.tsx`

---

### V-18: dangerouslySetInnerHTML en componente de charts

| Campo | Valor |
|-------|-------|
| **Criticidad** | MEDIA |
| **OWASP** | A03:2021 — Injection |
| **Prioridad** | P3 (backlog) |
| **Archivos afectados** | `components/ui/chart.tsx:80-98` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
Usa `dangerouslySetInnerHTML` para inyectar CSS inline en un `<style>`. Aunque los valores actuales vienen de configuracion estatica, si `config.color` o `config.theme` llegaran a recibir input dinamico, permitiria CSS injection.

**Impacto:** Bajo en el estado actual (valores hardcoded), pero es un anti-pattern que debe monitorearse.

#### Tareas BACKEND

- [ ] **V-18-B1:** No aplica.

#### Tareas FRONTEND

- [ ] **V-18-F1:** Monitorear que los valores de `config.color` y `config.theme` nunca provengan de input del usuario. Si se requiere refactorizar, usar CSS variables via `style` prop en lugar de `dangerouslySetInnerHTML`.
  - **Archivo:** `components/ui/chart.tsx`

---

### V-19: 13 vulnerabilidades en dependencias (npm audit)

| Campo | Valor |
|-------|-------|
| **Criticidad** | BAJA-MEDIA |
| **OWASP** | A06:2021 — Vulnerable and Outdated Components |
| **Prioridad** | P2 (HIGH) / P3 (MODERATE) |
| **Archivos afectados** | `package.json`, `package-lock.json` |
| **Estado** | [ ] Pendiente |

**Resultados de npm audit:**

| Severidad | Paquete | Vulnerabilidad |
|-----------|---------|----------------|
| HIGH | `flatted <=3.4.1` | DoS via recursion infinita + Prototype Pollution |
| HIGH | `minimatch <=3.1.3` | ReDoS multiple |
| HIGH | `rollup 4.0.0-4.58.0` | Arbitrary File Write |
| HIGH | `undici 7.0.0-7.23.0` | HTTP Smuggling, CRLF Injection, DoS (6 CVEs) |
| MODERATE | `next 9.5.0-15.5.13` | HTTP Request Smuggling + Disk Cache exhaustion |
| MODERATE | `esbuild <=0.24.2` | Dev server request leak |
| MODERATE | `ajv <6.14.0` | ReDoS |

#### Tareas BACKEND

- [ ] **V-19-B1:** No aplica.

#### Tareas FRONTEND

- [ ] **V-19-F1:** Ejecutar `npm audit fix` para resolver vulnerabilidades con fix automatico.
- [ ] **V-19-F2:** Si `npm audit fix` no resuelve todo, ejecutar `npm audit fix --force` con cuidado (puede hacer breaking changes en vite/vitest).
- [ ] **V-19-F3:** Actualizar Next.js a la version mas reciente que resuelva las vulnerabilidades de `undici` y el propio `next`.
- [ ] **V-19-F4:** Integrar `npm audit` en el pipeline de CI/CD para bloquear deploys con vulnerabilidades HIGH.

---

### V-20: URL de avatar externo sin CSP

| Campo | Valor |
|-------|-------|
| **Criticidad** | BAJA |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **Prioridad** | P3 (backlog) |
| **Archivos afectados** | `components/dashboard/RecentActivity.tsx:74` |
| **Estado** | [ ] Pendiente |

**Evidencia:**
```typescript
<AvatarImage src={`https://avatar.vercel.sh/${activity.email}`} />
```

**Impacto:** Bajo. Es un servicio confiable de Vercel, pero la CSP deberia restringir `img-src`.

#### Tareas BACKEND

- [ ] **V-20-B1:** No aplica.

#### Tareas FRONTEND

- [ ] **V-20-F1:** Se resuelve automaticamente con V-06-F1 al incluir `https://avatar.vercel.sh` en `img-src` del CSP.

---

### V-21: jwt-decode importado pero sin verificacion de firma

| Campo | Valor |
|-------|-------|
| **Criticidad** | BAJA |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **Prioridad** | P3 (backlog) |
| **Archivos afectados** | `package.json` |
| **Estado** | [ ] Pendiente |

**Descripcion:**
`jwt-decode` v4.0.0 esta instalado. Esta libreria **solo decodifica** el payload del JWT sin verificar la firma. Si se usa para tomar decisiones de autorizacion, es inseguro.

#### Tareas BACKEND

- [ ] **V-21-B1:** No aplica.

#### Tareas FRONTEND

- [ ] **V-21-F1:** Verificar que `jwt-decode` no se use para decisiones de autorizacion (solo para mostrar datos del usuario en la UI).
- [ ] **V-21-F2:** Si se implementa V-04 (verificacion con `jose`), considerar eliminar `jwt-decode` del proyecto si ya no se necesita:
  ```bash
  npm uninstall jwt-decode
  ```

---

## 3. Tabla Resumen de Hallazgos

| ID | Criticidad | Vulnerabilidad | Archivo Principal | OWASP | Prioridad | Backend | Frontend |
|----|------------|----------------|-------------------|-------|-----------|---------|----------|
| V-01 | CRITICA | Tokens en localStorage | auth.ts | A07 | P0 | 4 tareas | 5 tareas |
| V-02 | CRITICA | Refresh token en URL | api.axios.ts | A04 | P0 | 2 tareas | 2 tareas |
| V-03 | CRITICA | Logout sin invalidar backend | Sidebar.tsx | A07 | P0 | 2 tareas | 1 tarea |
| V-04 | CRITICA | Middleware sin verificar JWT | middleware.ts | A07 | P0 | 2 tareas | 3 tareas |
| V-05 | CRITICA | API via HTTP sin cifrar | .env | A02 | P0 | 3 tareas | 3 tareas |
| V-06 | ALTA | Sin headers de seguridad | next.config.js | A05 | P1 | 1 tarea | 1 tarea |
| V-07 | ALTA | Sin proteccion CSRF | Global | A01 | P1 | 2 tareas | 2 tareas |
| V-08 | ALTA | Race condition en refresh | api.axios.ts | A04 | P1 | 0 tareas | 2 tareas |
| V-09 | ALTA | Datos sensibles en Zustand | Stores | A04 | P1 | 0 tareas | 4 tareas |
| V-10 | ALTA | console.log expone datos | Multiples | A09 | P1 | 0 tareas | 2 tareas |
| V-11 | ALTA | Enumeracion de usuarios | useLogin.ts | A07 | P1 | 1 tarea | 1 tarea |
| V-12 | MEDIA | ESLint deshabilitado | next.config.js | A05 | P2 | 0 tareas | 2 tareas |
| V-13 | MEDIA | Password inconsistente | authValidation.ts | A07 | P2 | 0 tareas | 1 tarea |
| V-14 | MEDIA | Sin maxLength en campos | Dialogs | A03 | P2 | 1 tarea | 2 tareas |
| V-15 | MEDIA | Sin validacion telefono | CreateUserDialog | A03 | P2 | 1 tarea | 1 tarea |
| V-16 | MEDIA | Notificaciones sin schema | CreateNotificationDialog | A03 | P2 | 1 tarea | 1 tarea |
| V-17 | MEDIA | Catch blocks vacios | NotificationList | A09 | P2 | 0 tareas | 1 tarea |
| V-18 | MEDIA | dangerouslySetInnerHTML | chart.tsx | A03 | P3 | 0 tareas | 1 tarea |
| V-19 | BAJA | 13 vulns dependencias | package.json | A06 | P2-P3 | 0 tareas | 4 tareas |
| V-20 | BAJA | Avatar externo sin CSP | RecentActivity.tsx | A05 | P3 | 0 tareas | 1 tarea |
| V-21 | BAJA | jwt-decode sin firma | package.json | A07 | P3 | 0 tareas | 2 tareas |

---

## 4. Plan de Ejecucion — Quick Wins (Solo Frontend, Sin Dependencia de Backend)

Estas tareas pueden ejecutarse **inmediatamente** sin esperar cambios en el backend:

| # | Tarea | Archivo | Esfuerzo | Vuln |
|---|-------|---------|----------|------|
| 1 | Llamar `logoutService()` en handleLogout | `Sidebar.tsx` | S | V-03 |
| 2 | Unificar mensajes de error en login | `useLogin.ts` | S | V-11 |
| 3 | Agregar headers de seguridad | `next.config.js` | S | V-06 |
| 4 | Habilitar ESLint en builds + `removeConsole` | `next.config.js` | S | V-10, V-12 |
| 5 | Eliminar persist de stores con PII | `user.ts`, `employees.ts`, `roles.ts` | S | V-09 |
| 6 | Corregir catch blocks vacios | `NotificationList.tsx` | S | V-17 |
| 7 | Ejecutar `npm audit fix` | Terminal | S | V-19 |
| 8 | Alinear minimo password a 8 chars | `authValidation.ts` | S | V-13 |
| 9 | Agregar `.max()` y regex telefono a schemas | Dialogs | S | V-14, V-15 |
| 10 | Crear schema Zod para notificaciones | `CreateNotificationDialog.tsx` | S | V-16 |

---

## 5. Plan de Ejecucion — Requiere Coordinacion Backend-Frontend

Estas tareas necesitan que el backend implemente cambios primero o en paralelo:

| # | Tarea Backend (primero) | Tarea Frontend (despues) | Esfuerzo | Vuln |
|---|------------------------|--------------------------|----------|------|
| 1 | Aceptar refresh token en body | Enviar refresh token en body | M | V-02 |
| 2 | Setear cookies HttpOnly en login | Eliminar TokenManager y localStorage tokens | L | V-01, V-08 |
| 3 | Exponer JWT secret/clave publica | Verificar JWT en middleware con `jose` | M | V-04 |
| 4 | Configurar HTTPS/TLS | Actualizar URLs a HTTPS | M | V-05 |
| 5 | Configurar SameSite=Strict en cookies | (Opcional) Agregar X-CSRF-Token | M | V-07 |
| 6 | Unificar respuestas de error login | (Ya cubierto en Quick Wins #2) | S | V-11 |

---

## 6. Recomendaciones Arquitectonicas (Mediano Plazo)

1. **Migrar autenticacion a cookies HttpOnly server-side:** La arquitectura actual donde el frontend maneja tokens directamente es fundamentalmente insegura contra XSS. El backend debe manejar las cookies de sesion y el frontend no debe tener acceso a los tokens.

2. **Implementar BFF (Backend for Frontend):** Considerar un API route de Next.js (`/app/api/auth/`) que actue como proxy, almacenando tokens en cookies HttpOnly del lado del servidor y eliminando la exposicion al cliente.

3. **Consolidar libreria de validacion:** El proyecto usa tanto Yup como Zod. Estandarizar en Zod (mas moderno, type-safe) para reducir superficie de bugs.

4. **Implementar rate limiting:** Agregar proteccion contra brute force en el endpoint de login, idealmente en el backend/API gateway, pero tambien considerar debounce en el frontend.

5. **Agregar Error Boundaries:** No existen componentes `error.tsx` en las rutas de Next.js. Implementar para capturar errores de rendering y evitar pantallas en blanco que podrian filtrar informacion.

6. **Monitoreo de seguridad:** Integrar `npm audit` en el pipeline de CI/CD para bloquear deploys con vulnerabilidades de severidad HIGH.
