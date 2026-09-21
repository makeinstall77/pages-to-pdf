"use strict";
// Локальный предпросмотр печатного HTML (только для отладки конвертера).
const http = require("http");
const fs = require("fs");
const path = require("path");

const file = path.resolve(process.argv[2] || "");
const port = Number(process.argv[3] || 4311);
if (!fs.existsSync(file)) {
  console.error(`Нет файла: ${file}`);
  process.exit(1);
}
http
  .createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(file));
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`serving ${file} at http://127.0.0.1:${port}/`);
  });
