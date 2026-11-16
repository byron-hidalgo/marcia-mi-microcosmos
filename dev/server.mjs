// Sandbox local: sirve el sitio tal como lo hará GitHub Pages.
// Uso:  npm run dev   (o: node dev/server.mjs)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 5500;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon",
  ".mp3": "audio/mpeg", ".woff2": "font/woff2",
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  fs.readFile(file, (err, data) => {
    if (err) {
      console.log(`  404  ${urlPath}`);
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 - no existe: " + urlPath);
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    }).end(data);
  });
}).listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Sandbox listo:\n  - En este PC:   http://localhost:${PORT}`);
  for (const nets of Object.values(os.networkInterfaces()))
    for (const n of nets || [])
      if (n.family === "IPv4" && !n.internal) console.log(`  - En tu celular (misma Wi-Fi): http://${n.address}:${PORT}`);
  console.log(`\n  Probar celebración:  http://localhost:${PORT}/?fecha=2026-11-16\n  (Ctrl+C para detener)\n`);
});
