'use strict';

const http = require('http');
const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const port = 3000;
const base = './public';

function checkFile(filename) {
  return new Promise((resolve, reject) => {
    fs.stat(filename, (err, stat) => {
      if (err) return reject(err);
      if (stat.isDirectory()) {
        return resolve(checkFile(filename + 'index.html'));
      }
      if (!stat.isFile()) return reject('Not a file');
      fs.access(filename, fs.R_OK, err => {
        if (err) reject(err);
        resolve(filename);
      })
    });
  });
}

function handler(req, res) {
  if (req.headers['content-type'] != 'application/x-www-form-urlencoded') {
    checkFile(base + req.url)
      .then(filename => {
        res.writeHead(200, 'OK', {'Content-Type': 'text/html'});
        fs.createReadStream(filename).pipe(res);
      })
      .catch(err => {
        res.writeHead(404, http.STATUS_CODES[404], {'Content-Type': 'text/html'});
        res.end('File not found');
      });      
  } else {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      let text = querystring.parse(data)
      let request = https.get(`https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20160723T183155Z.f2a3339517e26a3c.d86d2dc91f2e374351379bb3fe371985273278df&text=${text.text}&lang=de`, res => {
        console.log(`Статус ответа: ${res.statusCode}`);
        res.pipe(process.stdout);
      });
    });
  }    
}

const server = http.createServer();
server
  .listen(port)
  .on('error', err => console.error(err))
  .on('request', handler)
  .on('listening', () => {
  console.log('Start HTTP on port %d', port);
  });
