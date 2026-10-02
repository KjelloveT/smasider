(function () {
    'use strict';

    const APP_ID = 'vegamot';
    const Model = window.Forteljingskart.Model;
    const Validator = window.Forteljingskart.Validator;
    const Graph = window.Forteljingskart.Graph;
    const RoutingEditor = window.Forteljingskart.RoutingEditor;
    const Player = window.Forteljingskart.Player;
    const PptxExport = window.Forteljingskart.PptxExport;
    const StepImage = window.Forteljingskart.StepImage;
    const PackageControls = window.Forteljingskart.PackageControls;
    const storyTitle = document.getElementById('story-title');
    const allowReaderBack = document.getElementById('allow-reader-back');
    const authoringView = document.getElementById('authoring-view');
    const readerView = document.getElementById('reader-view');
    const openReaderButton = document.getElementById('open-reader');
    const exportButton = document.getElementById('export-pptx');
    const exportStatus = document.getElementById('export-status');
    const saveStatus = document.getElementById('save-status');
    const nodeCount = document.getElementById('node-count');
    const graph = document.getElementById('story-graph');
    const editor = document.getElementById('node-editor');
    const warningList = document.getElementById('warning-list');
    let story;
    let selectedId;
    let saveTimer = 0;
    let warningTimer = 0;

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function button(text, className, action) {
        const classes = ['vp-button'];
        if (className) classes.push(className);
        if ((className || '').includes('danger')) classes.push('vp-button--danger');
        if ((className || '').includes('warning')) classes.push('vp-button--compact');
        const control = el('button', classes.join(' '), text);
        control.type = 'button';
        control.addEventListener('click', action);
        return control;
    }

    function field(labelText, control, id) {
        const wrapper = el('div', 'field vp-field');
        const label = el('label', 'vp-label', labelText);
        if (control.type !== 'checkbox' && control.type !== 'radio') control.classList.add('vp-input');
        if (id) {
            control.id = id;
            label.htmlFor = id;
        }
        wrapper.append(label, control);
        return wrapper;
    }

    function getWarnings() {
        return Validator.analyse(story);
    }

    function scheduleSave() {
        window.clearTimeout(saveTimer);
        saveStatus.textContent = 'Lagrar …';
        saveTimer = window.setTimeout(saveStory, 250);
    }

    function saveStory() {
        window.clearTimeout(saveTimer);
        try {
            VyrdepilStorage.setGameState(APP_ID, story);
            saveStatus.textContent = 'Lagra lokalt';
            saveStatus.dataset.state = 'saved';
            return true;
        } catch (error) {
            saveStatus.textContent = 'Kunne ikkje lagre på denne maskina';
            saveStatus.dataset.state = 'error';
            return false;
        }
    }

    function renderGraph() {
        const warnings = getWarnings();
        nodeCount.textContent = story.nodes.length + ' steg';
        Graph.render(graph, story, selectedId, warnings, selectNode);
    }

    function scheduleWarnings() {
        window.clearTimeout(warningTimer);
        warningTimer = window.setTimeout(renderWarnings, 350);
    }

    function selectNode(nodeId) {
        if (!Model.findNode(story, nodeId)) return;
        selectedId = nodeId;
        renderEditor();
        renderGraph();
    }

    function renderWarnings() {
        const warnings = getWarnings();
        while (warningList.firstChild) warningList.removeChild(warningList.firstChild);

        if (warnings.length === 0) {
            warningList.appendChild(el('p', 'no-warnings', 'Alle steg er nåbare frå starten, og alle vegar fører til eit merkt sluttsteg.'));
            return;
        }

        const summary = el('p', '', warnings.length + (warnings.length === 1 ? ' merknad funnen.' : ' merknader funne.'));
        const list = el('ul');
        warnings.forEach(function (warning) {
            const item = el('li');
            item.appendChild(document.createTextNode(warning.message + ' '));
            if (warning.nodeId && Model.findNode(story, warning.nodeId)) {
                item.appendChild(button('Vis steg', 'warning-jump', function () {
                    selectNode(warning.nodeId);
                    editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }));
            }
            list.appendChild(item);
        });
        warningList.append(summary, list);
    }

    function renderEverything() {
        storyTitle.value = story.title;
        allowReaderBack.checked = Boolean(story.settings && story.settings.allowBack);
        renderEditor();
        renderGraph();
        renderWarnings();
    }

    function renderEditor(message) {
        const node = Model.findNode(story, selectedId);
        while (editor.firstChild) editor.removeChild(editor.firstChild);

        if (!node) {
            editor.appendChild(el('p', 'editor-empty', 'Vel eit steg i kartet for å redigere det.'));
            return;
        }

        const form = el('div', 'editor-form');
        const heading = el('div', 'node-heading');
        const title = el('h3', '', node.title || 'Nytt steg');
        const deleteButton = button('Slett steg', 'danger-button', function () {
            if (story.nodes.length < 2) return;
            const nodeName = node.title || 'dette steget';
            if (!window.confirm('Vil du slette «' + nodeName + '» og vegvala som peikar hit?')) return;
            const imageId = node.image && node.image.assetId;
            Model.deleteNode(story, node.id);
            selectedId = story.startNodeId;
            saveStory();
            if (imageId) VyrdepilStorage.deleteGameAsset(APP_ID, imageId).catch(function () {});
            renderEverything();
        });
        deleteButton.disabled = story.nodes.length < 2;
        deleteButton.setAttribute('aria-label', 'Slett steget «' + (node.title || 'Utan tittel') + '»');
        heading.append(title, deleteButton);
        form.appendChild(heading);

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.maxLength = 120;
        titleInput.value = node.title;
        titleInput.autocomplete = 'off';
        titleInput.addEventListener('input', function () {
            node.title = titleInput.value;
            title.textContent = node.title || 'Utan tittel';
            scheduleSave();
            renderGraph();
            scheduleWarnings();
        });
        form.appendChild(field('Namn på steget', titleInput, 'step-title'));

        const bodyInput = document.createElement('textarea');
        bodyInput.value = node.body;
        bodyInput.rows = 7;
        bodyInput.addEventListener('input', function () {
            node.body = bodyInput.value;
            scheduleSave();
            renderGraph();
        });
        form.appendChild(field('Forteljingstekst', bodyInput, 'step-body'));

        StepImage.render(form, node.image, {
            onMetadataChange: function () {
                scheduleSave();
                renderGraph();
            },
            onRemove: function () {
                const oldImage = node.image;
                node.image = null;
                if (!saveStory()) {
                    node.image = oldImage;
                    renderEditor();
                    return;
                }
                VyrdepilStorage.deleteGameAsset(APP_ID, oldImage.assetId).catch(function () {});
                renderEditor();
                renderGraph();
            },
            onUpload: function (prepared) {
                const oldImage = node.image;
                const assetId = Vy.uuid('image');
                return VyrdepilStorage.saveGameAsset(APP_ID, assetId, prepared).then(function () {
                    if (Model.findNode(story, node.id) !== node) {
                        return VyrdepilStorage.deleteGameAsset(APP_ID, assetId).then(function () {
                            throw new Error('Steget blei sletta før biletet var ferdig.');
                        });
                    }
                    node.image = {
                        assetId: assetId,
                        name: prepared.name,
                        alt: oldImage ? oldImage.alt : '',
                        type: prepared.type,
                        width: prepared.width,
                        height: prepared.height
                    };
                    if (!saveStory()) {
                        node.image = oldImage;
                        return VyrdepilStorage.deleteGameAsset(APP_ID, assetId).then(function () {
                            throw new Error('Historiaendringane fekk ikkje plass i nettlesarlagringa.');
                        });
                    }
                    if (oldImage) VyrdepilStorage.deleteGameAsset(APP_ID, oldImage.assetId).catch(function () {});
                    renderEditor();
                    renderGraph();
                    return undefined;
                });
            }
        });

        const locationActions = el('div', 'editor-actions');
        const startButton = button(
            node.id === story.startNodeId ? 'Dette er startsteget' : 'Gjer til startsteg',
            '',
            function () {
                story.startNodeId = node.id;
                saveStory();
                renderEverything();
            }
        );
        startButton.disabled = node.id === story.startNodeId;
        startButton.setAttribute('aria-pressed', node.id === story.startNodeId ? 'true' : 'false');
        locationActions.appendChild(startButton);
        form.appendChild(locationActions);

        const endRow = el('label', 'end-row vp-choice');
        const endInput = document.createElement('input');
        endInput.type = 'checkbox';
        endInput.checked = node.isEnd;
        endInput.addEventListener('change', function () {
            const changed = Model.setEnd(node, endInput.checked);
            if (!changed) {
                message = 'Slett vegvala frå dette steget før du merker det som ei avslutning.';
                renderEditor(message);
                return;
            }
            saveStory();
            renderEverything();
        });
        endRow.append(endInput, el('span', '', 'Dette er ei avslutning'));
        form.appendChild(endRow);
        form.appendChild(el('p', 'end-help', 'Eit sluttsteg har ingen vegval vidare.'));

        if (message) form.appendChild(el('p', 'inline-message', message));

        RoutingEditor.render(form, node, story, { el: el, button: button, field: field }, {
            onValueChange: function () {
                scheduleSave();
                renderGraph();
                scheduleWarnings();
            },
            onStateChange: function (focusId) {
                saveStory();
                renderEverything();
                if (focusId) {
                    const control = editor.querySelector('#' + focusId);
                    if (control) control.focus();
                }
            },
            onRouteAdded: function () {
                saveStory();
                renderEverything();
                const routeLabels = editor.querySelectorAll('.route-label');
                const newLabel = routeLabels[routeLabels.length - 1];
                if (newLabel) newLabel.focus();
            }
        });

        if (story.nodes.length < 2) {
            form.appendChild(el('p', 'helper-text', 'Du må ha minst to steg for å slette eit steg.'));
        }
        editor.appendChild(form);
    }

    storyTitle.addEventListener('input', function () {
        story.title = storyTitle.value;
        scheduleSave();
        renderGraph();
    });

    allowReaderBack.addEventListener('change', function () {
        story.settings = story.settings || {};
        story.settings.allowBack = allowReaderBack.checked;
        scheduleSave();
    });

    openReaderButton.addEventListener('click', function () {
        authoringView.hidden = true;
        readerView.hidden = false;
        Player.open(story, readerView, function () {
            readerView.hidden = true;
            authoringView.hidden = false;
            openReaderButton.focus();
        });
    });

    exportButton.addEventListener('click', function () {
        exportButton.disabled = true;
        exportStatus.textContent = 'Lagar PowerPoint-fila …';
        Promise.resolve().then(function () {
            return PptxExport.build(story);
        }).then(function (blob) {
            const filename = (Vy.slug(story.title, 'forteljing') || 'forteljing') + '.pptx';
            Vy.downloadBlob(blob, filename);
            exportStatus.textContent = 'PowerPoint-fila er lasta ned.';
        }).catch(function (error) {
            exportStatus.textContent = error && error.message ? error.message : 'Klarte ikkje å lage PowerPoint-fila. Prøv igjen.';
        }).finally(function () {
            exportButton.disabled = false;
        });
    });

    PackageControls.bind({
        getStory: function () { return story; },
        setStory: function (nextStory) { story = nextStory; },
        getSelectedId: function () { return selectedId; },
        setSelectedId: function (nodeId) { selectedId = nodeId; },
        saveStory: saveStory,
        renderEverything: renderEverything
    });

    document.getElementById('add-node').addEventListener('click', function () {
        const node = Model.addNode(story);
        selectedId = node.id;
        saveStory();
        renderEverything();
        const input = editor.querySelector('#step-title');
        if (input) {
            input.focus();
            input.select();
        }
    });

    window.addEventListener('beforeunload', function () {
        if (saveTimer) saveStory();
    });

    try {
        const stored = VyrdepilStorage.getGameState(APP_ID);
        story = stored ? Model.normalizeStory(stored) : Model.createStory();
    } catch (error) {
        story = Model.createStory();
        saveStatus.textContent = 'Kunne ikkje lese lokal lagring';
        saveStatus.dataset.state = 'error';
    }
    selectedId = story.startNodeId;
    renderEverything();
    if (saveStatus.dataset.state !== 'error') {
        saveStory();
    }
})();
