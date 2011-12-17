var requirejs = require('requirejs');
var paperboy = require('paperboy');
var http = require('http');
var path = require('path');

WEBROOT = path.join(path.dirname(__filename), 'site');

var config = {
    appDir: "./code",
    baseUrl: "./",
    dir: "./site/game",
    modules: [
        {
            name: "./app"
        }
    ],
    optimize: "none"
};

requirejs.optimize(config, function (buildResponse) { console.log('built'); });

http.createServer(function(req, res) {
  paperboy
    .deliver(WEBROOT, req, res)
    .otherwise(function(err) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end("Error 404: File not found");
    });
}).listen(8000);
