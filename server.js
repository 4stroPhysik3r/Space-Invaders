const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 42069;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
   const filePath = req.url === '/' ? '/index.html' : req.url
   const fullPath = path.join(__dirname, filePath)

   fs.readFile(fullPath, (error, data) => {
      if (error) {
         res.writeHead(404, { 'Content-Type': 'text/plain' })
         res.end('404 Not Found')
      } else {
         res.writeHead(200)
         res.end(data)
      }
   })
})

server.listen(PORT, HOST, () => {
   console.log(`Server is running at http://${HOST}:${PORT}`);
});