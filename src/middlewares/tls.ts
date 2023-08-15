import tls from 'tls';
import net from 'net';
import fs from 'fs';
import devcert from 'devcert';

const IS_PROD = process.env.NODE_ENV === 'production'

const bufferToNumber = (buffer: Buffer) => {
  const result = [...buffer]
    .map((hex, index, arr) => {
      return hex * 2 ** ((arr.length - index - 1) * 8)
    })
    .reduce((acc, val) => acc + val, 0);

  console.log(buffer, result)
  return result
}

const endsAt = (buffer: Buffer, start: number, lengthBits: number) => {
  const lengthStr = buffer.slice(start, start + lengthBits);
  const length = bufferToNumber(lengthStr);
  return start + lengthBits + length
}

const HTTPS_PORT = IS_PROD ? 443 : 3001
const options = IS_PROD
  ? {
    key: fs.readFileSync("/etc/letsencrypt/live/redirected.app/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/redirected.app/fullchain.pem")
  }
  : await devcert.certificateFor('localhost') // if this step is blocking, you probably need to type your password in the process to authorize the dev CA creation. @see https://github.com/davewasmer/devcert#how-it-works




const server = net.createServer((s) => {
  // var sawRequest = false;
  var buff = "";
  // var requestText = "";
  var connected = false;
  var cli = net.createConnection(3000);
  cli.on('error', (...args) => console.error('OUTCH', ...args))
  s.on('data', function (d) {
    console.log('I got some data',)
    const sessionEnd = endsAt(d, 43, 1)
    const cypherEnd = endsAt(d, sessionEnd, 2)
    const compressionEnd = endsAt(d, cypherEnd, 1);
    const extEnd = endsAt(d, compressionEnd, 2)
    const hostnameEnds = endsAt(d, compressionEnd + 9, 2)

    console.log('Got the handshake', {
      'Record header': d.slice(0, 5),
      'Handshake message type (01)': d.slice(5, 6),
      'Handshake hello length': d.slice(5, 8),
      'Client version (03 03)': d.slice(8, 11),
      'Client random': d.slice(11, 11 + 32),
      'Fake session id length': d.slice(43, 44),
      'Fake session id': d.slice(44, sessionEnd),
      'Cypher suits length': d.slice(sessionEnd, sessionEnd + 2),
      'Cypher suits': d.slice(sessionEnd + 2, cypherEnd),
      'Compression length': d.slice(cypherEnd, cypherEnd + 1),
      'Compression': d.slice(cypherEnd + 1, compressionEnd),
      'Extension length': d.slice(compressionEnd, compressionEnd + 2),
      'Extension': {
        'assigned value': d.slice(compressionEnd + 2, compressionEnd + 4),
        'server name length': d.slice(compressionEnd + 4, compressionEnd + 6),
        'server name #1 length': d.slice(compressionEnd + 6, compressionEnd + 8),
        'DNS type (00)': d.slice(compressionEnd + 8, compressionEnd + 9),
        'Hostname length': d.slice(compressionEnd + 9, compressionEnd + 11),
        'Hostname': d.slice(compressionEnd + 11, hostnameEnds)
      }

    })

    console.log('----\n', [...d].map(d => d.toString(16).padStart(2, '0')).join(' '), '\n-----')
    // if (!sawRequest) {
    //   requestText += d.toString();
    //   if (requestText.match(/POST \/ RTSP\/1.0/)) {
    //     requestText.replace('POST / RTSP/1.0', 'POST / HTTP/1.0');
    //     buff = requestText;
    //     sawRequest = true;
    //   }
    // } else {
    buff += d.toString();
    // }
    if (connected) {
      if (buff !== '') cli.write(buff);
      cli.write(d);
    } else {
      buff += d.toString();
    }
  });
  cli.once('connect', function () {
    console.log('I am connencted now')
    connected = true;
    cli.write(buff);
  });
  s.pipe(cli);

})

server.listen(1234, () => console.log('opened TCP server on', server.address()))

