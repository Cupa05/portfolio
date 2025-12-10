# Workflow MVP (n8n-like)

Minimal workflow automation engine with webhook/cron triggers and basic nodes.

## Install

```bash
npm install
npm run build
```

## Run the server

```bash
npm run dev
# or after build
npm start
```

- Health: `GET /health`
- Webhook: `POST /webhook/webhook_to_http/t1`
  - Body example:
  ```json
  { "id": "123", "total": 42 }
  ```

## Run via CLI

```bash
npx tsx src/cli.ts run examples/webhook_to_http.json t1 --body '{"id":123,"total":42}'
# or after build
node dist/cli.js run examples/webhook_to_http.json t1 --body '{"id":123,"total":42}'
```

## Workflow format

See `examples/webhook_to_http.json` and `examples/cron_to_if_set.json`.

## Notes

- Interpolation like `{{context.body.id}}` is supported in node configs.
- This is an MVP: no persistence, auth, UI, or parallelism limits beyond simple queue.
