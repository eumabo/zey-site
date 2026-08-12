const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT) || 5173;
const host = '0.0.0.0';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  try {
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(root + path.sep) && filePath !== path.join(root, 'index.html')) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Acesso negado.');
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      let resolvedFilePath = filePath;

      if (!statError && stats.isDirectory()) {
        resolvedFilePath = path.join(filePath, 'index.html');
      }

      fs.stat(resolvedFilePath, (resolvedError, resolvedStats) => {
        if (resolvedError || !resolvedStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Arquivo não encontrado.');
          return;
        }

        const extension = path.extname(resolvedFilePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': mimeTypes[extension] || 'application/octet-stream',
          'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(resolvedFilePath);
        stream.on('error', () => {
          if (!res.headersSent) res.writeHead(500);
          res.end('Erro ao carregar o arquivo.');
        });
        stream.pipe(res);
      });
    });
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erro interno do servidor.');
  }
});

server.listen(port, host, () => {
  console.log(`\nZEY After Hours rodando em: http://localhost:${port}\n`);
  console.log('Pressione Ctrl + C para parar o servidor.');
});
