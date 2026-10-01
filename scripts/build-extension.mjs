// Prépare l'extension Chrome : icônes à partir de l'icône du site, puis archive téléchargeable
// (public/promo-tracker-extension.zip, servie par la page /extension). Usage : npm run extension:build
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { deflateRawSync } from "node:zlib";
import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname;
const dir = join(root, "extension");
const out = join(root, "public", "promo-tracker-extension.zip");

for (const size of [16, 32, 48, 128]) {
  await sharp(join(root, "public", "icon-512.png"))
    .resize(size, size)
    .png()
    .toFile(join(dir, "icons", `icon${size}.png`));
}

const files = (function walk(d) {
  return readdirSync(d).flatMap((name) => {
    const path = join(d, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
})(dir).sort();

// Archive ZIP minimale (deflate), sans dépendance.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const locals = [];
const centrals = [];
let offset = 0;
for (const path of files) {
  const name = Buffer.from(relative(dir, path).split("\\").join("/"));
  const data = readFileSync(path);
  const packed = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6); // noms en UTF-8
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt32LE(0x00210000, 10); // date fixe (1er janv. 1980) : archive reproductible
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  locals.push(local, name, packed);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(0x00210000, 12);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  centrals.push(central, name);
  offset += local.length + name.length + packed.length;
}
const centralSize = centrals.reduce((n, b) => n + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);
writeFileSync(out, Buffer.concat([...locals, ...centrals, end]));
console.log(`Extension prête : ${files.length} fichiers → ${relative(root, out)}`);
