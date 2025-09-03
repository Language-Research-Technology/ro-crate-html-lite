import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';

const PORT = 8000;

const MIME_TYPES = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "text/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  ico: "image/x-icon",
  svg: "image/svg+xml",
};

const toBool = [() => true, () => false];

const STATIC_PATH = path.join(process.cwd(), "./test_data");

const PAGES = []

try {
  const dir = await fs.opendirSync(STATIC_PATH);
  for await (const dirent of dir)
    if (fs.existsSync(path.join(STATIC_PATH, dirent.name, "ro-crate-preview.html"))) {
      PAGES.push({
        name: dirent.name,
        link: path.join(dirent.name, "ro-crate-preview.html")
      })
    }
} catch (err) {
  console.error(err);
}

function indexPage() {
  let contents = `
    <!DOCTYPE html>
      <style>
      ul {
        list-style-type: none;
        margin: auto;
        font-size: 1.5rem;
      }
      </style>
      <p>RO Crate HTML Lite development server</p>
      <ul>
    `
  contents += "<ul>"
  for (let page of PAGES) {
    contents += `<li><a href="${page.link}">${page.name}</a></li>`
  }
  contents += "</ul></html>"

  return {
    found: true,
    ext: "html",
    stream: Readable.from(contents),
  }
}

const prepareFile = async (url) => {
  if (url === "/") {
    return indexPage()
  }
  if (url.startsWith("/script")) {
    filePath = path.join(process.cwd(), url.slice(7))
    const stream = fs.createReadStream(filePath);
    const { mtimeMs } = fs.statSync(filePath);
    return { found: true, ext: "js", mtime: mtimeMs, stream }
  }
  const paths = [STATIC_PATH, url];
  if (url.endsWith("/")) paths.push("../index.html");
  var filePath = path.join(...paths);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await fs.promises.access(filePath).then(...toBool);
  const found = !pathTraversal && exists;
  if (found) {
    const ext = path.extname(filePath).substring(1).toLowerCase();
    const stream = fs.createReadStream(filePath);
    const { mtimeMs } = fs.statSync(filePath);
    return { found, ext, mtime: mtimeMs, stream };
  } else {
    return { found: false }
  }
};

http
  .createServer(async (req, res) => {
    const file = await prepareFile(req.url);
    const statusCode = file.found ? 200 : 404;
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
    if (file.found) {
      res.writeHead(statusCode, {
        "Content-Type": mimeType,
        "ETag": file.mtime || null,
      });
      file.stream.pipe(res);
    } else {
      res.writeHead(statusCode, { "Content-Type": mimeType });
      Readable.from("404 not found").pipe(res);
      if (req.method !== "HEAD") {
        console.log(`Error: ${req.method} ${req.url} ${statusCode}`);
      }
    }
  })
  .listen(PORT);

console.log(`Server running at http://localhost:${PORT}/\n`);

const reloadPreview = (fullPath, filename) => {
  const proc = spawn("node",
    [
      "index.js",
      fullPath.slice(0, -filename.length)
    ]
  )
  proc.on('close', () => console.log(`recreated ${fullPath.slice(STATIC_PATH.length)}`))
}

fs.watch(path.join(process.cwd(), "template.html"), async (_eventType, _filename) => {
  for await (const page of PAGES) {
    reloadPreview(path.join(STATIC_PATH, page.name, "ro-crate-metadata.json"), "ro-crate-metadata.json")
  }
})
