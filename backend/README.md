# EventBook – Backend (native PHP + MySQL)

```bash
mysql -u root < database/schema.sql            # create DB + seed data
php -S localhost:8000 -t public public/index.php
```

- Entry point / routes: `public/index.php`
- Config (DB credentials, timezone, CORS, token TTL): `config/config.php`
- Postman collection: `postman_collection.json`

See the root `README.md` for the API reference, database design, validation and concurrency notes.
