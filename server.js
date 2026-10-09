// Minimal static file server for hosts that expect `npm start` (e.g. Render web services).
// Netlify / Render static sites don't need this; they serve the folder directly.
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = process.env.PORT || 3000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

const blocked = new Set(["server.js", "package.json", "netlify.toml", "claude.md"]);

function send(res, status, file) {
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      return res.end("Server error");
    }
    res.writeHead(status, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": file.endsWith(".html") ? "no-cache" : "public, max-age=3600",
    });
    res.end(data);
  });
}

http
  .createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (urlPath.endsWith("/")) urlPath += "index.html";

    const file = path.normalize(path.join(root, urlPath));
    const name = path.relative(root, file);
    const hidden = name.startsWith("..") || name.split(path.sep).some((p) => p.startsWith(".")) || blocked.has(name);

    fs.stat(file, (err, stat) => {
      if (hidden || err || !stat.isFile()) return send(res, 404, path.join(root, "404.html"));
      send(res, 200, file);
    });
  })
  .listen(port, () => console.log(`Serving on port ${port}`));
