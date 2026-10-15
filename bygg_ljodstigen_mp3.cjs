// Bruk den eksisterande, sjølv-hosta MP3-kodaren; ingen nye avhengnader.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '_libs/lamejs.min.js'), 'utf8'), context);
const bytes = fs.readFileSync(0);
const samples = new Int16Array(bytes.length / 2);
for (let i = 0; i < samples.length; i++) samples[i] = bytes.readInt16LE(i * 2);
const encoder = new context.lamejs.Mp3Encoder(1, Number(process.argv[2]), 64);
for (let i = 0; i < samples.length; i += 1152) {
  process.stdout.write(Buffer.from(encoder.encodeBuffer(samples.subarray(i, i + 1152))));
}
process.stdout.write(Buffer.from(encoder.flush()));
