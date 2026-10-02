(function (root) {
    'use strict';

    const APP_ID = 'vegamot';
    const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
    const MAX_STORED_BYTES = 2 * 1024 * 1024;
    const MAX_EDGE = 1600;
    let previewUrl = '';
    let renderToken = 0;

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function revokePreview() {
        renderToken += 1;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = '';
    }

    function prepareImage(file) {
        if (!file || ['image/png', 'image/jpeg'].indexOf(file.type) < 0) {
            return Promise.reject(new Error('Vel ei PNG- eller JPEG-fil.'));
        }
        if (file.size > MAX_SOURCE_BYTES) {
            return Promise.reject(new Error('Biletet må vere mindre enn 20 MB før det blir lagt til.'));
        }
        if (!window.createImageBitmap) {
            return Promise.reject(new Error('Nettlesaren kan ikkje klargjere biletfila.'));
        }
        return createImageBitmap(file).then(function (bitmap) {
            if (bitmap.width * bitmap.height > 40000000) {
                bitmap.close();
                throw new Error('Biletet har for mange pikslar. Vel ei mindre utgåve.');
            }
            const scale = Math.min(1, MAX_EDGE / bitmap.width, MAX_EDGE / bitmap.height);
            const width = Math.max(1, Math.round(bitmap.width * scale));
            const height = Math.max(1, Math.round(bitmap.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d', { alpha: file.type === 'image/png' });
            if (!context) {
                bitmap.close();
                throw new Error('Nettlesaren kunne ikkje klargjere biletet.');
            }
            if (file.type === 'image/jpeg') {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, width, height);
            }
            context.drawImage(bitmap, 0, 0, width, height);
            bitmap.close();
            return new Promise(function (resolve, reject) {
                canvas.toBlob(function (blob) {
                    if (!blob) {
                        reject(new Error('Nettlesaren kunne ikkje lagre biletet.'));
                        return;
                    }
                    if (blob.size > MAX_STORED_BYTES) {
                        reject(new Error('Biletet er framleis for stort etter tilpassing. Vel eller lagre ei mindre fil.'));
                        return;
                    }
                    resolve({ blob: blob, name: file.name, type: file.type, width: width, height: height });
                }, file.type, file.type === 'image/jpeg' ? 0.86 : undefined);
            });
        });
    }

    function render(form, image, actions) {
        revokePreview();
        const section = el('section', 'step-image-editor');
        const heading = el('h3', '', 'Bilete til steget');
        const help = el('p', 'helper-text', 'Legg til eitt PNG- eller JPEG-bilete. Biletet blir skalert ned til høgst 1600 pikslar og lagra berre på denne maskina.');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.className = 'vp-input';
        fileInput.accept = 'image/png,image/jpeg';
        fileInput.id = 'step-image-file';
        fileInput.setAttribute('aria-label', image ? 'Byt bilete for steget' : 'Legg til bilete for steget');
        const fileLabel = el('label', 'vp-label', image ? 'Byt bilete' : 'Vel bilete');
        fileLabel.htmlFor = fileInput.id;
        const fileField = el('div', 'field vp-field');
        fileField.append(fileLabel, fileInput);
        const status = el('p', 'image-status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        section.append(heading, help, fileField, status);

        if (image) {
            const preview = el('img', 'step-image-preview');
            preview.alt = image.alt || '';
            preview.hidden = true;
            section.appendChild(preview);
            const altInput = document.createElement('textarea');
            altInput.rows = 2;
            altInput.maxLength = 500;
            altInput.value = image.alt || '';
            const altField = el('div', 'field vp-field');
            altInput.classList.add('vp-input');
            const altLabel = el('label', 'vp-label', 'Alternativ tekst for biletet');
            altLabel.htmlFor = 'step-image-alt';
            altInput.id = 'step-image-alt';
            altInput.setAttribute('aria-describedby', 'step-image-alt-help');
            altInput.addEventListener('input', function () {
                image.alt = altInput.value;
                preview.alt = altInput.value;
                actions.onMetadataChange();
            });
            const altHelp = el('p', 'helper-text', 'Skildre kort det viktige i biletet for dei som ikkje kan sjå det.');
            altHelp.id = 'step-image-alt-help';
            altField.append(altLabel, altInput, altHelp);
            const remove = document.createElement('button');
            remove.className = 'vp-button vp-button--danger';
            remove.type = 'button';
            remove.textContent = 'Fjern biletet';
            remove.addEventListener('click', actions.onRemove);
            section.append(altField, remove);

            const token = renderToken;
            VyrdepilStorage.getGameAsset(APP_ID, image.assetId).then(function (asset) {
                if (token !== renderToken || !section.isConnected) return;
                if (!asset) {
                        status.textContent = 'Biletfila manglar. Opne ei lagra forteljingspakke for å hente henne att.';
                    return;
                }
                previewUrl = URL.createObjectURL(asset.blob);
                preview.src = previewUrl;
                preview.hidden = false;
            }).catch(function () {
                if (token === renderToken && section.isConnected) status.textContent = 'Biletfila manglar. Opne ei lagra forteljingspakke for å hente henne att.';
            });
        } else {
            section.appendChild(el('p', 'helper-text', 'Det er heilt greitt å la steget stå utan forteljingstekst dersom biletet eller vegvala ber innhaldet.'));
        }

        fileInput.addEventListener('change', function () {
            const file = fileInput.files && fileInput.files[0];
            fileInput.value = '';
            if (!file) return;
            fileInput.disabled = true;
            status.textContent = 'Klargjer biletet …';
            prepareImage(file).then(actions.onUpload).catch(function (error) {
                status.textContent = error && error.message ? error.message : 'Klarte ikkje å leggje til biletet.';
            }).finally(function () {
                fileInput.disabled = false;
            });
        });
        form.appendChild(section);
    }

    root.Forteljingskart = root.Forteljingskart || {};
    root.Forteljingskart.StepImage = { render: render, prepare: prepareImage, revokePreview: revokePreview };
})(window);
