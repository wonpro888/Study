const http = require("node:http");
const path = require("node:path");
const { readFile } = require("node:fs/promises");

const landing = path.join(__dirname, "mission-2");
const market = path.join(__dirname, "mission-4", "build");
const pages = new Set(["/index.html", "/login.html", "/signup.html", "/faq.html", "/privacy.html"]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function findPublicFile(pathname) {
  if (pathname === "/") return path.join(landing, "index.html");
  if (pathname === "/items.html" || pathname === "/items" || pathname === "/items/") {
    return path.join(market, "index.html");
  }
  if (pages.has(pathname)) return path.join(landing, pathname.slice(1));

  const parts = pathname.slice(1).split("/");
  if (parts.some(part => !/^[a-z\d_-][a-z\d_.-]*$/i.test(part))) return null;
  if (parts[0] === "static") return path.join(market, ...parts);
  if (parts[0] === "images" || parts[0] === "styles") return path.join(landing, ...parts);
  return null;
}

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  const filename = findPublicFile(pathname);
  if (!filename) {
    response.writeHead(404).end();
    return;
  }
  try {
    const data = await readFile(filename);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filename)] || "application/octet-stream",
      "Content-Length": data.length
    });
    response.end(request.method === "HEAD" ? undefined : data);
  } catch (error) {
    const missing = ["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code);
    response.writeHead(missing ? 404 : 500).end();
  }
});

const port = Number(process.env.PORT || 3000);
server.on("error", error => {
  console.error(error.code === "EADDRINUSE"
    ? `포트 ${port}가 이미 사용 중입니다. 실행 중인 서버를 종료하거나 PORT 값을 바꿔주세요.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`판다마켓 열기  http://127.0.0.1:${server.address().port}/`);
});
