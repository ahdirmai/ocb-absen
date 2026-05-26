# Migration Brief: Expose Data untuk Go BE

## Context

Go BE baru butuh data dari project ini untuk migrasi. Perlu tambah 4 endpoint migration baru, protected by API key.

---

## Env Var Baru

Tambah di `.env`:

```
MIGRATION_API_KEY=<secret-random-string>
```

---

## Middleware Baru

Buat file `src/middleware/migrationAuth.js`:

```js
module.exports = (req, res, next) => {
  if (req.headers['x-migration-key'] !== process.env.MIGRATION_API_KEY)
    return res.status(401).json({ message: 'Unauthorized' });
  next();
};
```

---

## Controller Baru

Buat file `src/controller/migration.controller.js`:

```js
const db = require('../config/db');

exports.getRetail = async (req, res) => {
  const [rows] = await db.query(
    'SELECT retail_id, name, latitude, longitude, radius, is_active FROM retail WHERE is_deleted = 0'
  );
  res.json(rows);
};

exports.getUserCategories = async (req, res) => {
  const [rows] = await db.query(
    'SELECT id_category, role_id, category_user FROM user_category'
  );
  res.json(rows);
};

exports.getUsers = async (req, res) => {
  const [rows] = await db.query(
    'SELECT user_id, name, username, password, category_user, upline, enabled, photo_url FROM user WHERE is_deleted = 0'
  );
  res.json(rows);
};

exports.getShifts = async (req, res) => {
  const [shifts] = await db.query(
    'SELECT shifting_id, user_id, retail_id, start_date, end_date, is_deleted FROM shifting'
  );
  const [members] = await db.query(
    'SELECT shifting_id, user_id FROM shift_employes'
  );

  const memberMap = members.reduce((acc, m) => {
    if (!acc[m.shifting_id]) acc[m.shifting_id] = [];
    acc[m.shifting_id].push({ user_id: m.user_id });
    return acc;
  }, {});

  const result = shifts.map(s => ({
    ...s,
    employees: memberMap[s.shifting_id] || []
  }));

  res.json(result);
};
```

---

## Routes Baru

Buat file `src/routes/migration.js`:

```js
const router = require('express').Router();
const migrationAuth = require('../middleware/migrationAuth');
const ctrl = require('../controller/migration.controller');

router.get('/retail', migrationAuth, ctrl.getRetail);
router.get('/user-categories', migrationAuth, ctrl.getUserCategories);
router.get('/users', migrationAuth, ctrl.getUsers);
router.get('/shifts', migrationAuth, ctrl.getShifts);

module.exports = router;
```

---

## Daftarkan di `app.js` / `index.js`

```js
const migrationRouter = require('./src/routes/migration');
app.use('/api/migration', migrationRouter);
```

---

## Endpoint Summary

| Method | URL | Response |
|---|---|---|
| GET | `/api/migration/retail` | `[{ retail_id, name, latitude, longitude, radius, is_active }]` |
| GET | `/api/migration/user-categories` | `[{ id_category, role_id, category_user }]` |
| GET | `/api/migration/users` | `[{ user_id, name, username, password, category_user, upline, enabled, photo_url }]` |
| GET | `/api/migration/shifts` | `[{ shifting_id, ..., employees: [{ user_id }] }]` |

Semua endpoint butuh header: `X-Migration-Key: <secret>`
