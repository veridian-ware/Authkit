# AuthKit Express

**Production-ready authentication & authorization boilerplate for Express.js**

> JWT dual-token auth · Role-based access control · Audit logging · Company settings · Docker ready

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/veridian-ware/Authkit/blob/main/LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/express-4.x-lightgrey.svg)](https://expressjs.com)

---

## What's included

AuthKit Express gives you a complete, battle-tested auth layer so you can start building your product — not your login system.

| Feature | Details |
| --- | --- |
| JWT Authentication | Access token (15min) + Refresh token (7d) |
| Role-based access | `admin`, `supervisor`, `operator`, `accountant` — easily customizable |
| Audit logging | Every write operation is automatically logged with user, IP, and payload |
| Company settings | Multi-tenant ready: logo, colors, sectors per company |
| Password security | bcrypt with salt factor 12 |
| Token rotation | Refresh token stored in DB, invalidated on logout |
| Safe responses | `toSafeJSON()` strips password and refresh token from all user responses |
| Docker ready | `docker-compose.yml` included — one command to run everything |

---

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 4.x
- **Database:** PostgreSQL + Sequelize ORM
- **Cache:** Redis (for queue support)
- **Auth:** JWT (`jsonwebtoken`) + bcrypt
- **Queue:** Bull (background jobs ready)
- **Email:** Nodemailer (pre-configured, optional)
- **Docs:** Swagger UI at `/api/docs`

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/authkit-express.git
cd Authkit
cp .env.example .env
```

### 2. Configure your environment

Edit `.env` with your values:

```env
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_db
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
```

### 3. Run with Docker

```bash
docker-compose up -d
```

That's it. The API is available at `http://localhost:4000`.  
Swagger docs at `http://localhost:4000/api/docs`.

### 4. Create your first admin user

```bash
npm run create-user
```

---

## Project structure

```
authkit-express/
├── src/
│   ├── config/
│   │   ├── database.js         # Sequelize + PostgreSQL setup
│   │   ├── jwt.js              # Token config (expiry, secrets)
│   │   ├── redis.js            # Redis connection
│   │   └── swagger.js          # API docs config
│   ├── controllers/
│   │   ├── authController.js   # Login, logout, refresh token
│   │   ├── userController.js   # CRUD users
│   │   └── settingsController.js # Company settings
│   ├── middleware/
│   │   ├── auth.js             # JWT verification middleware
│   │   ├── roles.js            # Role-based authorization
│   │   └── audit.js            # Automatic audit logging
│   ├── models/
│   │   ├── User.js             # User model with hooks
│   │   ├── AuditLog.js         # Audit trail model
│   │   ├── CompanySettings.js  # Multi-tenant settings
│   │   └── index.js            # Associations
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── settings.js
│   ├── jobs/
│   │   ├── queue.js            # Bull queue setup
│   │   └── worker.js           # Job processor
│   └── index.js                # App entry point
├── scripts/
│   └── create-user.js          # CLI to create first admin
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## API Reference

### Auth endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | — | Login with email + password |
| POST | `/api/auth/logout` | ✓ | Invalidate refresh token |
| POST | `/api/auth/refresh` | — | Get new access token |
| GET | `/api/auth/me` | ✓ | Get current user |

### User endpoints

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| GET | `/api/users` | admin | List all users |
| POST | `/api/users` | admin | Create user |
| PUT | `/api/users/:id` | admin | Update user |
| DELETE | `/api/users/:id` | admin | Deactivate user |

### Settings endpoints

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| GET | `/api/settings` | any | Get company settings |
| PUT | `/api/settings` | admin | Update company settings |

---

## Role system

Roles are enforced per-route using the `authorize()` middleware:

```js
const authorize = require('./middleware/roles');

// Only admins
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// Multiple roles allowed
router.get('/', authenticate, authorize('admin', 'supervisor'), listUsers);
```

Default roles: `admin`, `supervisor`, `operator`, `accountant`

To add or rename roles, edit the `ENUM` in `src/models/User.js`:

```js
role: {
  type: DataTypes.ENUM('admin', 'supervisor', 'operator', 'accountant', 'your_role'),
  defaultValue: 'operator',
}
```

---

## Audit logging

Every successful write operation is automatically logged. Zero configuration needed — just add the middleware to any route:

```js
const auditLog = require('./middleware/audit');

router.post('/', authenticate, auditLog('CREATE', 'Product'), createProduct);
router.put('/:id', authenticate, auditLog('UPDATE', 'Product'), updateProduct);
```

Each log entry stores: `user_id`, `username`, `action`, `entity`, `entity_id`, `ip_address`, `timestamp`.

---

## Company settings (multi-tenant ready)

`CompanySettings` stores per-company configuration including branding colors, logo path, and custom sectors as JSONB. This gives you the foundation to serve multiple organizations from a single deployment:

```json
// GET /api/settings returns:
{
  "company_name": "Acme Corp",
  "primary_color": "#3B82F6",
  "secondary_color": "#1E40AF",
  "accent_color": "#10B981",
  "dark_mode": false,
  "sectors": ["Operations", "Finance", "HR", "Logistics"]
}
```

---

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `POSTGRES_USER` | ✓ | — | Database user |
| `POSTGRES_PASSWORD` | ✓ | — | Database password |
| `POSTGRES_DB` | ✓ | — | Database name |
| `POSTGRES_HOST` | — | `localhost` | Database host |
| `JWT_SECRET` | ✓ | — | Access token secret |
| `JWT_REFRESH_SECRET` | ✓ | — | Refresh token secret |
| `JWT_EXPIRATION` | — | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | — | `7d` | Refresh token TTL |
| `BACKEND_PORT` | — | `4000` | API port |
| `REDIS_HOST` | — | `localhost` | Redis host |
| `SMTP_HOST` | — | — | Email (optional) |

---

## License

MIT — use it in personal and commercial projects.

---

---

# AuthKit Express — Español

**Boilerplate de autenticación y autorización production-ready para Express.js**

> JWT dual-token · Control de acceso por roles · Audit log · Configuración de empresa · Docker listo

---

## Qué incluye

| Feature | Detalle |
| --- | --- |
| Autenticación JWT | Access token (15min) + Refresh token (7 días) |
| Control de roles | `admin`, `supervisor`, `operario`, `contador` — fácil de personalizar |
| Audit log automático | Cada operación de escritura se registra con usuario, IP y datos |
| Configuración de empresa | Logo, colores y sectores por empresa |
| Seguridad de contraseñas | bcrypt con salt factor 12 |
| Rotación de tokens | Refresh token almacenado en DB, invalidado en logout |
| Respuestas seguras | `toSafeJSON()` elimina contraseña y token de todas las respuestas |
| Docker ready | `docker-compose.yml` incluido — un comando para levantar todo |

---

## Inicio rápido

```bash
git clone https://github.com/veridian-ware/Authkit.git
cd Authkit
cp .env.example .env
# Editar .env con tus valores
docker-compose up -d
```

La API queda disponible en `http://localhost:4000`.  
Documentación Swagger en `http://localhost:4000/api/docs`.

---

## Sistema de roles

```js
// Solo admins
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// Múltiples roles permitidos
router.get('/', authenticate, authorize('admin', 'supervisor'), listUsers);
```

---

## Soporte

Para consultas o problemas, abrí un issue en GitHub o escribí a veridianware@gmail.com.
│   └── create-user.js        # CLI to create first admin
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## API Reference

### Auth endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Login with email + password |
| POST | `/api/auth/logout` | ✓ | Invalidate refresh token |
| POST | `/api/auth/refresh` | — | Get new access token |
| GET | `/api/auth/me` | ✓ | Get current user |

### User endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | admin | List all users |
| POST | `/api/users` | admin | Create user |
| PUT | `/api/users/:id` | admin | Update user |
| DELETE | `/api/users/:id` | admin | Deactivate user |

### Settings endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | any | Get company settings |
| PUT | `/api/settings` | admin | Update company settings |

---

## Role system

Roles are enforced per-route using the `authorize()` middleware:

```javascript
const authorize = require('./middleware/roles');

// Only admins
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// Multiple roles allowed
router.get('/', authenticate, authorize('admin', 'supervisor'), listUsers);
```

Default roles: `admin`, `supervisor`, `operator`, `accountant`

To add or rename roles, edit the `ENUM` in `src/models/User.js`:

```javascript
role: {
  type: DataTypes.ENUM('admin', 'supervisor', 'operator', 'accountant', 'your_role'),
  defaultValue: 'operator',
}
```

---

## Audit logging

Every successful write operation is automatically logged. Zero configuration needed — just add the middleware to any route:

```javascript
const auditLog = require('./middleware/audit');

router.post('/', authenticate, auditLog('CREATE', 'Product'), createProduct);
router.put('/:id', authenticate, auditLog('UPDATE', 'Product'), updateProduct);
```

Each log entry stores: `user_id`, `username`, `action`, `entity`, `entity_id`, `ip_address`, `timestamp`.

---

## Company settings (multi-tenant ready)

`CompanySettings` stores per-company configuration including branding colors, logo path, and custom sectors as JSONB. This gives you the foundation to serve multiple organizations from a single deployment:

```javascript
// GET /api/settings returns:
{
  "company_name": "Acme Corp",
  "primary_color": "#3B82F6",
  "secondary_color": "#1E40AF",
  "accent_color": "#10B981",
  "dark_mode": false,
  "sectors": ["Operations", "Finance", "HR", "Logistics"]
}
```

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_USER` | ✓ | — | Database user |
| `POSTGRES_PASSWORD` | ✓ | — | Database password |
| `POSTGRES_DB` | ✓ | — | Database name |
| `POSTGRES_HOST` | — | `localhost` | Database host |
| `JWT_SECRET` | ✓ | — | Access token secret |
| `JWT_REFRESH_SECRET` | ✓ | — | Refresh token secret |
| `JWT_EXPIRATION` | — | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | — | `7d` | Refresh token TTL |
| `BACKEND_PORT` | — | `4000` | API port |
| `REDIS_HOST` | — | `localhost` | Redis host |
| `SMTP_HOST` | — | — | Email (optional) |

---

## License

MIT — use it in personal and commercial projects.

---

---

# AuthKit Express — Español

**Boilerplate de autenticación y autorización production-ready para Express.js**

> JWT dual-token · Control de acceso por roles · Audit log · Configuración de empresa · Docker listo

---

## Qué incluye

| Feature | Detalle |
|---|---|
| Autenticación JWT | Access token (15min) + Refresh token (7 días) |
| Control de roles | `admin`, `supervisor`, `operario`, `contador` — fácil de personalizar |
| Audit log automático | Cada operación de escritura se registra con usuario, IP y datos |
| Configuración de empresa | Logo, colores y sectores por empresa |
| Seguridad de contraseñas | bcrypt con salt factor 12 |
| Rotación de tokens | Refresh token almacenado en DB, invalidado en logout |
| Respuestas seguras | `toSafeJSON()` elimina contraseña y token de todas las respuestas |
| Docker ready | `docker-compose.yml` incluido — un comando para levantar todo |

---

## Inicio rápido

```bash
git clone https://github.com/yourusername/authkit-express.git
cd authkit-express
cp .env.example .env
# Editar .env con tus valores
docker-compose up -d
```

La API queda disponible en `http://localhost:4000`.  
Documentación Swagger en `http://localhost:4000/api/docs`.

---

## Sistema de roles

```javascript
// Solo admins
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// Múltiples roles permitidos
router.get('/', authenticate, authorize('admin', 'supervisor'), listUsers);
```

---

## Soporte

Para consultas o problemas, abrí un issue en GitHub o escribí a veridianware@gmail.com.
