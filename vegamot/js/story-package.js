(function (root) {
    'use strict';

    const APP_ID = 'vegamot';
    const PACKAGE_VERSION = 1;
    const Model = root.Forteljingskart.Model;
    const MAX_PACKAGE_BYTES = 100 * 1024 * 1024;
    const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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
        return root.Forteljingskart.PptxPackage.loadJSZip().then(function (JSZip) {
            return JSZip.loadAsync(file, { checkCRC32: true });
        }).then(function (zip) {
            const manifestFile = zip.file('vegamot.json') || zip.file('forteljingskart.json');
            if (!manifestFile) throw new Error('Fila inneheld ikkje ei Vegamot-forteljing.');
            return manifestFile.async('text').then(function (text) {
                let manifest;
                try { manifest = JSON.parse(text); }
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
                        const entry = assetInfo && zip.file(assetInfo.path);
                        if (!assetInfo || !entry) throw new Error('Historiafila manglar eit bilete som er knytt til eit steg.');
                        if (assetInfo.type !== node.image.type || !extension(assetInfo.type)) {
                            throw new Error('Eit bilete i historiafila har eit format som ikkje er støtta.');
                        }
                        return entry.async('uint8array').then(function (bytes) {
                            if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('Eit bilete i historiafila er større enn 2 MB.');
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
