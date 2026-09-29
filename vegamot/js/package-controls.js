(function (root) {
    'use strict';

    const StoryPackage = root.Forteljingskart.StoryPackage;

    function bind(options) {
        const saveButton = document.getElementById('save-story-package');
        const loadButton = document.getElementById('load-story-package');
        const fileInput = document.getElementById('story-package-file');
        const status = document.getElementById('package-status');

        saveButton.addEventListener('click', function () {
            const story = options.getStory();
            if (!options.saveStory()) {
                status.textContent = 'Historia vart ikkje lagra. Kontroller nettlesarlagringa før du lastar ned ei pakke.';
                return;
            }
            saveButton.disabled = true;
            status.textContent = 'Samlar historia og bileta …';
            StoryPackage.export(story).then(function (blob) {
                const filename = (Vy.slug(story.title, 'forteljing') || 'forteljing') + '.vegamot';
                Vy.downloadBlob(blob, filename);
                status.textContent = 'Historia er lasta ned med bileta sine.';
            }).catch(function (error) {
                status.textContent = error && error.message ? error.message : 'Klarte ikkje lage forteljingspakka. Prøv igjen.';
            }).finally(function () {
                saveButton.disabled = false;
            });
        });

        loadButton.addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', function () {
            const file = fileInput.files && fileInput.files[0];
            fileInput.value = '';
            if (!file || !window.confirm('Opne denne forteljingspakka og byte ut forteljinga du arbeider med no?')) return;
            loadButton.disabled = true;
            status.textContent = 'Opnar forteljingspakka …';
            const previousStory = options.getStory();
            const previousId = options.getSelectedId();
            StoryPackage.import(file).then(function (result) {
                options.setStory(result.story);
                options.setSelectedId(result.story.startNodeId);
                if (!options.saveStory()) {
                    options.setStory(previousStory);
                    options.setSelectedId(previousId);
                    return StoryPackage.discardAssets(result.assetIds).then(function () {
                        options.renderEverything();
                        throw new Error('Historia fekk ikkje plass i nettlesarlagringa. Den førre historia er halden på.');
                    });
                }
                const oldAssetIds = previousStory.nodes.map(function (node) {
                    return node.image && node.image.assetId;
                }).filter(Boolean);
                return StoryPackage.discardAssets(oldAssetIds).then(function () {
                    options.renderEverything();
                    status.textContent = 'Historia og bileta er opna.';
                });
            }).catch(function (error) {
                status.textContent = error && error.message ? error.message : 'Klarte ikkje opne forteljingspakka.';
            }).finally(function () {
                loadButton.disabled = false;
            });
        });
    }

    root.Forteljingskart = root.Forteljingskart || {};
    root.Forteljingskart.PackageControls = { bind: bind };
})(window);
