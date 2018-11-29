const net = require('net');
const fs = require('fs');
const port = 3000;
const child_process = require('child_process');
const server = net.createServer((client) => {

const separator = ";";
let workers = [];

        console.log('New client connected');

        client.on('data', handler);
        client.on('end', () => console.log(`Client ${client.id} disconnected`));

        async function handler(data) {
            if (data.toString().split(separator)[0] === "getWorkers") {
                let res = await getWorkers();
                client.write(`getWorkers${separator}${JSON.stringify(res)}`);
            }
            if (data.toString().split(separator)[0] === "add") {
                console.log(data.toString());
                startWorker(data.toString().split(separator)[1]);
                client.write(`add${separator }${workers[workers.length - 1].pid}${separator}${workers[workers.length - 1].startedOn}`);
            }
            if (data.toString().split(separator)[0] === "remove") {
                let index = workers.findIndex(worker => worker.pid == data.toString().split(separator)[1]);
                let numbers = await getNumbers(workers[index]);
                client.write(`remove${separator}${workers[index].pid}${separator}${workers[index].startedOn}${separator}${numbers}`);
                fs.appendFile(workers[index].filename, "]");
                process.kill(workers[index].pid);
                workers.splice(index, 1);
            }
        }
    })
;

server.listen(port, () => {
    console.log(`Server listening on localhost:${port}`);
});


function startWorker(interval) {
    let filename = `workers/${Date.now()}.json`;
    let worker = child_process.spawn('node', ['worker.js', filename, `${interval}`], {detached: true});
    let date = new Date;
    worker.startedOn = date.toISOString();
    worker.filename = filename;
    workers.push(worker);
}

function getNumbers(worker) {
    return new Promise((resolve, reject) => {
        fs.readFile(worker.filename, (error, data) => {
            if (!error) {
                resolve(data + "]");
            }
            else {
                reject(error);
            }
        })
    })
}

async function getWorkers() {
    return new Promise(async (resolve) => {
        let res = [];
        for (i = 0; i < workers.length; i++) {
            let numbers = await getNumbers(workers[i]);
            res.push({
                "id": workers[i].pid,
                "startedOn": workers[i].startedOn,
                "numbers": numbers,
            });
        }
        resolve(res);
    })
}