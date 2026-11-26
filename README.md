# harness-poc-app

Reference Node.js application for the Harness CI/CD/STO Architect POC.

## Local development

```bash
npm install
npm test        # run jest tests with coverage
npm run dev     # start with nodemon
npm start       # start normally
```

## Endpoints

- GET  /health        → liveness + version info
- GET  /health/ready  → readiness probe
- GET  /health/live   → liveness probe
- GET  /api/items     → list items (filter: ?category=alpha&active=true)
- GET  /api/items/:id → single item
- POST /api/items     → create item { name, category }
- GET  /api/info      → app metadata
