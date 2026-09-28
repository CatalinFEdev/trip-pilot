**Do it in this order: find config -> verify URL/key -> test with curl -> read logs.**

### 1) Find your AG-UI provider config
Look for files like:
- `.env`
- `docker-compose.yml`
- `config.yml` / `config.json`
- app settings where Claude/Anthropic provider is defined

You're looking for fields like:
- `AG_UI_ENDPOINT` / `BASE_URL`
- `ANTHROPIC_API_KEY`
- provider/model name

---

### 2) Validate values
- URL must be exact (`https://...` + correct path/port)
- API key must be present and not quoted incorrectly
- model/provider name must match what AG-UI expects

---

### 3) Test endpoint from your machine (Windows PowerShell)
```powershell
curl.exe -i "https://your-ag-ui-endpoint/health"
```
If no `/health` route exists, test the configured API route directly:
```powershell
curl.exe -i "https://your-ag-ui-endpoint/<your-configured-path>"
```

---

### 4) Test with auth header (if required)
```powershell
curl.exe -i "https://your-ag-ui-endpoint/<path>" `
  -H "Authorization: Bearer YOUR_KEY" `
  -H "Content-Type: application/json"
```

---

### 5) Check logs where AG-UI runs
- **Docker**:
  ```powershell
  docker ps
  docker logs <container_name> --tail 200
  ```
- **Local process**: check terminal output where AG-UI was started.

Look for: `401/403`, `route not found`, `timeout`, `upstream connection`, `TLS`.

---

### 6) Restart after fixes
- Docker: `docker restart <container_name>`
- Local: stop/start process

If you paste your config block (without secrets), I'll tell you exactly what to change.
