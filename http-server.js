const http = require('http');
const net = require('net');
const hostname = '127.0.0.1';
const port = 3001;
const tcp_port = 3000;
const separator = ";";
const connection = new net.Socket();

const workers = {
    "getWorkers": function (req, res, payload, cb) {
        connection.write("getWorkers");
        connection.on('data', (data) => {
            if (data.toString().split(separator)[0] === "getWorkers") {
                cb(null, JSON.parse(data.toString().split(separator)[1]));

            }
        })
    },

    "add": function (req, res, payload, cb) {
        if (payload.x !== undefined) {
            connection.write(`add${separator}${payload.x}`);
            connection.on('data', (data) => {
                if (data.toString().split(separator)[0] === "add") {
                    console.log(data.toString().split(separator)[1]);
                    console.log(data.toString().split(separator)[2]);
                    cb(null, {
                        id: data.toString().split(separator)[1],
                        startedOn: data.toString().split(separator)[2],
                    });
                }
            });
        }
        else cb({code: 405, message: 'Worker not found'});
    },

    "remove": function (req, res, payload, cb) {
        if (payload.id !== undefined) {
            connection.write(`remove${separator}${payload.id}`);
            connection.on('data', (data) => {
                if (data.toString().split(separator)[0] === "remove") {
                    cb(null, {
                        id: data.toString().split(separator)[1],
                        startedOn: data.toString().split(separator)[2],
                        numbers: data.toString().split(separator)[3],
                    });
                }
            });
        }
        else cb({code: 405, message: 'Worker not found'});
    },
};

connection.connect(tcp_port, function () {
    console.log('Connected to the TCP server');
});

const handlers = {
    '/workers': workers.getWorkers,
    '/workers/add': workers.add,
    '/workers/remove': workers.remove,
};

const server = http.createServer((req, res) => {
    parseBodyJson(req, (err, payload) => {
        const handler = getHandler(req.url);
        handler(req, res, payload, (err, result) => {
            if (err) {
                res.writeHead(err.code, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(err));
                return;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(result, null, "\t"));
        });
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function getHandler(url) {
    return handlers[url] || notFound;
}

function notFound(req, res, payload, cb) {
    cb({code: 404, message: 'Not found'});
}

function parseBodyJson(req, cb) {
    let body = [];
    req.on('data', function (chunk) {
        body.push(chunk);
    }).on('end', function () {
        body = Buffer.concat(body).toString();
        if (body !== "") {
            params = JSON.parse(body);
            cb(null, params);
        }
        else {
            cb(null, null);
        }
    });
}