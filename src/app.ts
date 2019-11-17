import * as WebSocket from 'ws';
import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';
import * as request from 'request';
import * as glob from 'glob';

const host = 'cloudmd.monoid.app';
let passwd = null;

function uploadFile(filepath: string) {
    filepath = path.resolve(filepath);
    return new Promise((res, rej) => {
        fs.readFile(filepath, async (err, data) => {
            const senddata = JSON.stringify({
                filename: path.basename(filepath),
                passwd: passwd,
                data: Buffer.from(data).toString('base64')
            });
            request.post(`https://${host}/api/v1/upload/file`, {
                body: senddata,
                headers: {
                    'Content-Type': 'application/json'
                }
            }, (err, response) => {
                if (response.statusCode === 200) {
                    console.log('Uploaded:', filepath);
                } else {
                    console.log('Error:', filepath);
                }
                err ? rej() : res();
            });
        });
    });
}

function compile(options = { type: 'markdown', template: 'report' }) {
    return new Promise((res, rej) => {
        request.post(`https://${host}/api/v1/exec/compile`, {
            body: JSON.stringify({
                passwd: passwd,
                type: options.type,
                template: options.template
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }, (err, response) => {
            if (response.statusCode === 200) {
                console.log('Compile started');
                console.log('-'.repeat(50));
            } else {
                console.log('Error when send compile command');
            }
            err ? rej() : res();
        });
    });
}

function downloadFile(filepath: string, filename: string) {
    return new Promise((res, rej) => {
        const stream = request.get(filepath).pipe(fs.createWriteStream(filename || path.basename(filepath)));
        stream.on('finish', () => res());
    });
}

function parse_args(argv: string[]) {
    const query = {};
    const positional = [];
    for (const arg of argv) {
        if (~arg.indexOf('=')) {
            const pair = arg.split('=');
            query[pair[0]] = pair[1]
        } else {
            positional.push(arg);
        }
    }
    return { query, positional };
}

function findFiles(patterns: string[]) {
    return patterns.reduce((p, c) => {
        p.push(...glob.sync(c));
        return p;
    }, []);
}


async function onOpen(files: string[]) {
    this.send(JSON.stringify({ passwd }));
    await Promise.all(files.map(f => uploadFile(f)));
    await compile();
}

async function onMessage(e: string, query: object) {
    const data = JSON.parse(e);
    let buffer = '';
    if (data.type == 'logend') {
        if (query['tex'] !== undefined)
            await downloadFile(`https://${host}/data/${passwd}/main.tex`, query['tex']);
        await downloadFile(`https://${host}/data/${passwd}/main.pdf`, query['pdf']);
        console.log('Compilation Completed!');
        this.close();
    } else {
        for (const c of data.body) {
            switch (c) {
                case '\n':
                    if (buffer.trim()) console.log(buffer);
                    buffer = '';
                    break;
                default:
                    buffer += c;
                    break;
            }
        }
    }
}

(function main() {
    const args = parse_args(process.argv.slice(2));
    const files = findFiles(args.positional);

    if (!files.length) {
        console.log('File not found');
        return;
    } else {
        console.log('Upload following files:', files);
    }

    https.get(`https://${host}/api/v1/ws/start`, res => {
        if (res.statusCode === 200) {
            res.setEncoding('utf-8');
            res.on('data', chunk => {
                passwd = JSON.parse(chunk).passwd;
                console.log('Passwd:', passwd);

                const ws = new WebSocket(`wss://${host}`);
                ws.on('open', () => onOpen.bind(ws)(files));
                ws.on('message', e => onMessage.bind(ws)(e, args.query));
            });
        } else {
            console.log('Failed to initialize session');
        }
    });
})();