(function (root) {
    'use strict';

    const APP_ID = 'vegamot';
    const PACKAGE_VERSION = 1;
    const Model = root.Forteljingskart.Model;
    const MAX_PACKAGE_BYTES = 100 * 1024 * 1024;
    const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
    const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;
    const MAX_UNCOMPRESSED_PACKAGE_BYTES = 50 * 1024 * 1024;
    const MAX_ZIP_ENTRIES = 512;
    const MAX_CENTRAL_DIRECTORY_BYTES = 4 * 1024 * 1024;
    const CRC32_TABLE = new Uint32Array(256);
    for (let tableIndex = 0; tableIndex < CRC32_TABLE.length; tableIndex += 1) {
        let value = tableIndex;
        for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
        CRC32_TABLE[tableIndex] = value >>> 0;
    }

    function preflightPackage(file) {
        if (file.size < 22) return Promise.reject(new Error('Historiafila har eit ugyldig ZIP-format.'));

        const tailStart = Math.max(0, file.size - 22 - 65535);
        return file.slice(tailStart).arrayBuffer().then(function (tailBuffer) {
            const tail = new DataView(tailBuffer);
            let endOffset = -1;
            for (let offset = tail.byteLength - 22; offset >= 0; offset -= 1) {
                if (tail.getUint32(offset, true) === 0x06054b50 &&
                    offset + 22 + tail.getUint16(offset + 20, true) === tail.byteLength) {
                    endOffset = offset;
                    break;
                }
            }
            if (endOffset < 0) throw new Error('Historiafila har eit ugyldig ZIP-format.');

            const disk = tail.getUint16(endOffset + 4, true);
            const centralDisk = tail.getUint16(endOffset + 6, true);
            const diskEntries = tail.getUint16(endOffset + 8, true);
            const entryCount = tail.getUint16(endOffset + 10, true);
            const centralSize = tail.getUint32(endOffset + 12, true);
            const centralOffset = tail.getUint32(endOffset + 16, true);
            const absoluteEndOffset = tailStart + endOffset;

            if (disk !== 0 || centralDisk !== 0 || diskEntries !== entryCount ||
                entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff ||
                entryCount > MAX_ZIP_ENTRIES) {
                throw new Error('Forteljingspakka har for mange filer eller eit ZIP-format Vegamot ikkje støttar.');
            }
            if (centralSize > MAX_CENTRAL_DIRECTORY_BYTES ||
                centralOffset + centralSize > absoluteEndOffset || centralOffset + centralSize > file.size) {
                throw new Error('Historiafila har eit ugyldig ZIP-format.');
            }

            return file.slice(centralOffset, centralOffset + centralSize).arrayBuffer().then(function (centralBuffer) {
                const central = new DataView(centralBuffer);
                const decoder = new TextDecoder('utf-8', { fatal: true });
                const entries = new Map();
                const lowerNames = new Set();
                let totalUncompressed = 0;
                let manifestName = '';
                let offset = 0;

                for (let index = 0; index < entryCount; index += 1) {
                    if (offset + 46 > central.byteLength || central.getUint32(offset, true) !== 0x02014b50) {
                        throw new Error('Historiafila har eit ugyldig ZIP-format.');
                    }

                    const flags = central.getUint16(offset + 8, true);
                    const method = central.getUint16(offset + 10, true);
                    const crc32 = central.getUint32(offset + 16, true);
                    const compressedSize = central.getUint32(offset + 20, true);
                    const uncompressedSize = central.getUint32(offset + 24, true);
                    const nameLength = central.getUint16(offset + 28, true);
                    const extraLength = central.getUint16(offset + 30, true);
                    const commentLength = central.getUint16(offset + 32, true);
                    const diskStart = central.getUint16(offset + 34, true);
                    const localOffset = central.getUint32(offset + 42, true);
                    const recordEnd = offset + 46 + nameLength + extraLength + commentLength;

                    if (recordEnd > central.byteLength || nameLength < 1 || nameLength > 256 ||
                        extraLength > 2048 || commentLength > 1024 || diskStart !== 0 ||
                        compressedSize === 0xffffffff || uncompressedSize === 0xffffffff ||
                        localOffset === 0xffffffff || localOffset + 30 > centralOffset ||
                        (flags & 1) !== 0 || (flags & 0x40) !== 0 || (method !== 0 && method !== 8)) {
                        throw new Error('Forteljingspakka har eit ugyldig eller ikkje støtta ZIP-innhald.');
                    }

                    let name;
                    try {
                        name = decoder.decode(new Uint8Array(centralBuffer, offset + 46, nameLength));
                    } catch (error) {
                        throw new Error('Forteljingspakka har eit ugyldig filnamn.');
                    }

                    const isDirectory = name.endsWith('/');
                    const isManifest = name === 'vegamot.json' || name === 'forteljingskart.json';
                    const isImage = /^media\/bilete-[0-9]{3,}\.(png|jpg)$/.test(name);
                    if ((isDirectory && (name !== 'media/' || compressedSize !== 0 || uncompressedSize !== 0)) ||
                        (!isDirectory && !isManifest && !isImage)) {
                        throw new Error('Forteljingspakka inneheld ei fil Vegamot ikkje støttar.');
                    }
                    if (isManifest) {
                        if (manifestName) throw new Error('Forteljingspakka har fleire manifest.');
                        if (uncompressedSize > MAX_MANIFEST_BYTES) {
                            throw new Error('Forteljingsmanifestet er større enn 2 MB.');
                        }
                        manifestName = name;
                    }
                    if (isImage && uncompressedSize > MAX_IMAGE_BYTES) {
                        throw new Error('Eit bilete i historiafila er større enn 2 MB.');
                    }

                    const normalizedName = name.toLowerCase();
                    if (lowerNames.has(normalizedName)) throw new Error('Forteljingspakka har dupliserte filnamn.');
                    lowerNames.add(normalizedName);
                    if (totalUncompressed > MAX_UNCOMPRESSED_PACKAGE_BYTES - uncompressedSize) {
                        throw new Error('Forteljingspakka er større enn 50 MB når ho er pakka ut.');
                    }
                    totalUncompressed += uncompressedSize;
                    entries.set(name, { uncompressedSize: uncompressedSize, compressedSize: compressedSize, crc32: crc32 });
                    offset = recordEnd;
                }

                if (offset !== central.byteLength || !manifestName) {
                    throw new Error('Fila inneheld ikkje ei Vegamot-forteljing.');
                }
                return { manifestName: manifestName, entries: entries };
            });
        });
    }

    function readZipEntry(entry, maxBytes, tooLargeMessage, expectedCrc32) {
        if (!entry || typeof entry.internalStream !== 'function') {
            return Promise.reject(new Error('Forteljingspakka manglar eit naudsynt innhald.'));
        }
        return new Promise(function (resolve, reject) {
            // Stop while streaming so a false ZIP size cannot make async() inflate unbounded data.
            const stream = entry.internalStream('uint8array');
            const chunks = [];
            let total = 0;
            let crc32 = 0xffffffff;
            let settled = false;

            stream.on('data', function (chunk) {
                if (settled) return;
                const length = chunk && chunk.byteLength;
                if (!Number.isSafeInteger(length) || length < 0 || total > maxBytes - length) {
                    settled = true;
                    chunks.length = 0;
                    stream.pause();
                    reject(new Error(tooLargeMessage));
                    return;
                }
                total += length;
                if (expectedCrc32 !== undefined) {
                    for (let index = 0; index < length; index += 1) {
                        crc32 = (crc32 >>> 8) ^ CRC32_TABLE[(crc32 ^ chunk[index]) & 0xff];
                    }
                }
                chunks.push(chunk);
            });
            stream.on('error', function (error) {
                if (settled) return;
                settled = true;
                reject(error);
            });
            stream.on('end', function () {
                if (settled) return;
                settled = true;
                if (expectedCrc32 !== undefined && ((crc32 ^ 0xffffffff) >>> 0) !== expectedCrc32) {
                    reject(new Error('Forteljingspakka inneheld skadde data.'));
                    return;
                }
                const result = new Uint8Array(total);
                let offset = 0;
                chunks.forEach(function (chunk) {
                    result.set(chunk, offset);
                    offset += chunk.byteLength;
                });
                resolve(result);
            });
            stream.resume();
        });
    }

    function extension(type) {
        return type === 'image/png' ? 'png' : type === 'image/jpeg' ? 'jpg' : '';
    }

    function exportPackage(story) {
        return root.Forteljingskart.PptxPackage.loadJSZip().then(function (JSZip) {
            const zip = new JSZip();
            const exportedStory = JSON.parse(JSON.stringify(story));
            const assets = [];
            const media = zip.folder('media');
            const images = exportedStory.nodes.map(function (node, index) {
                if (!node.image) return Promise.resolve();
                return VyrdepilStorage.getGameAsset(APP_ID, node.image.assetId).then(function (asset) {
                    if (!asset || !asset.blob) throw new Error('Eit steg har ei biletfil som ikkje finst på denne maskina.');
                    const ext = extension(node.image.type);
                    if (!ext) throw new Error('Historia har eit bilete med eit format som ikkje er støtta.');
                    const path = 'bilete-' + String(index + 1).padStart(3, '0') + '.' + ext;
                    assets.push({
                        assetId: node.image.assetId,
                        path: 'media/' + path,
                        name: node.image.name,
                        type: node.image.type,
                        width: node.image.width,
                        height: node.image.height
                    });
                    media.file(path, asset.blob);
                });
            });
            return Promise.all(images).then(function () {
                zip.file('vegamot.json', JSON.stringify({
                    app: APP_ID,
                    version: PACKAGE_VERSION,
                    story: exportedStory,
                    assets: assets
                }, null, 2));
                return zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 1 },
                    mimeType: 'application/vnd.vyrdepil.vegamot+zip'
                });
            });
        });
    }

    function verifyImage(blob) {
        return createImageBitmap(blob).then(function (bitmap) {
            const size = { width: bitmap.width, height: bitmap.height };
            bitmap.close();
            if (!size.width || !size.height || size.width * size.height > 40000000) {
                throw new Error('Eit bilete i historia har ugyldige mål.');
            }
            return size;
        }).catch(function (error) {
            throw new Error(error && error.message ? error.message : 'Klarte ikkje lese eit bilete i forteljinga.');
        });
    }

    function importPackage(file) {
        if (!file || file.size > MAX_PACKAGE_BYTES) {
            return Promise.reject(new Error('Historiafila må vere mindre enn 100 MB.'));
        }
        return preflightPackage(file).then(function (preflight) {
            return root.Forteljingskart.PptxPackage.loadJSZip().then(function (JSZip) {
                // CRC-checking every entry eagerly inflates unused files; read only bounded entries below.
                return JSZip.loadAsync(file, { checkCRC32: false }).then(function (zip) {
                    return { zip: zip, preflight: preflight };
                });
            });
        }).then(function (loaded) {
            const zip = loaded.zip;
            const manifestFile = zip.file(loaded.preflight.manifestName);
            if (!manifestFile) throw new Error('Fila inneheld ikkje ei Vegamot-forteljing.');
            const manifestMetadata = loaded.preflight.entries.get(loaded.preflight.manifestName);
            return readZipEntry(manifestFile, MAX_MANIFEST_BYTES, 'Forteljingsmanifestet er større enn 2 MB.', manifestMetadata.crc32).then(function (bytes) {
                let manifest;
                try { manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
                catch (error) { throw new Error('Historiafila inneheld ikkje gyldige data.'); }
                if (!manifest || (manifest.app !== APP_ID && manifest.app !== 'forteljingskart') || manifest.version !== PACKAGE_VERSION) {
                    throw new Error('Denne fila inneheld ikkje ei forteljing som Vegamot kan opne.');
                }
                const story = Model.normalizeStory(manifest.story);
                const assets = new Map();
                (Array.isArray(manifest.assets) ? manifest.assets : []).forEach(function (asset) {
                    if (!asset || typeof asset.assetId !== 'string' || typeof asset.path !== 'string') return;
                    if (!/^media\/bilete-[0-9]{3,}\.((png)|(jpg))$/.test(asset.path)) return;
                    if (extension(asset.type) !== asset.path.slice(-3)) return;
                    assets.set(asset.assetId, asset);
                });
                const importedAssetIds = [];
                const work = story.nodes.reduce(function (promise, node) {
                    return promise.then(function () {
                        if (!node.image) return;
                        const assetInfo = assets.get(node.image.assetId);
                        const entry = assetInfo && loaded.preflight.entries.has(assetInfo.path) && zip.file(assetInfo.path);
                        const entryMetadata = assetInfo && loaded.preflight.entries.get(assetInfo.path);
                        if (!assetInfo || !entry) throw new Error('Historiafila manglar eit bilete som er knytt til eit steg.');
                        if (assetInfo.type !== node.image.type || !extension(assetInfo.type)) {
                            throw new Error('Eit bilete i historiafila har eit format som ikkje er støtta.');
                        }
                        return readZipEntry(entry, MAX_IMAGE_BYTES, 'Eit bilete i historiafila er større enn 2 MB.', entryMetadata.crc32).then(function (bytes) {
                            const blob = new Blob([bytes], { type: assetInfo.type });
                            return verifyImage(blob).then(function (dimensions) {
                                const importedId = Vy.uuid('image');
                                node.image.assetId = importedId;
                                node.image.name = String(assetInfo.name || node.image.name || '').slice(0, 180);
                                node.image.type = assetInfo.type;
                                node.image.width = dimensions.width;
                                node.image.height = dimensions.height;
                                return VyrdepilStorage.saveGameAsset(APP_ID, importedId, {
                                    blob: blob,
                                    name: node.image.name,
                                    type: assetInfo.type,
                                    width: dimensions.width,
                                    height: dimensions.height
                                }).then(function () { importedAssetIds.push(importedId); });
                            });
                        });
                    });
                }, Promise.resolve());
                return work.then(function () {
                    return { story: story, assetIds: importedAssetIds };
                }).catch(function (error) {
                    return Promise.all(importedAssetIds.map(function (id) {
                        return VyrdepilStorage.deleteGameAsset(APP_ID, id).catch(function () {});
                    })).then(function () { throw error; });
                });
            });
        });
    }

    function discardAssets(assetIds) {
        return Promise.all((assetIds || []).map(function (id) {
            return VyrdepilStorage.deleteGameAsset(APP_ID, id).catch(function () {});
        }));
    }

    root.Forteljingskart.StoryPackage = {
        export: exportPackage,
        import: importPackage,
        discardAssets: discardAssets
    };
})(window);
