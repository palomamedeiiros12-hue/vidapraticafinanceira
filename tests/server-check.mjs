import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = 'c:/Users/TECINFO 21/Documents/MVP- Camila';
const server = http.createServer((req, res) => {
  const safePath = (req.url === '/' ? '/index.html' : req.url).replace(/^\//, '');
  const filePath = path.resolve(root, safePath);

  if (!filePath.startsWith(path.resolve(root))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    }[ext] || 'text/plain; charset=utf-8';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(8123, async () => {
  const htmlResponse = await fetch('http://127.0.0.1:8123/index.html');
  const html = await htmlResponse.text();
  const cssResponse = await fetch('http://127.0.0.1:8123/css/style.css');
  const css = await cssResponse.text();

  console.log('HTML_STATUS', htmlResponse.status);
  console.log('CSS_STATUS', cssResponse.status);
  console.log('HTML_OK', html.includes('Vida Prática e Financeira'));
  console.log('CSS_OK', css.includes('body') && css.includes('--primary'));
  server.close();
});
