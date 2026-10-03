(function () {
    'use strict';

    if (window.location.protocol === 'file:') document.body.removeAttribute('data-vp-app');

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
    const graphViewport = document.getElementById('graph-viewport');
    const editor = document.getElementById('node-editor');
    const warningList = document.getElementById('warning-list');
    const workspace = document.querySelector('.workspace');
    const workspaceDialog = document.getElementById('workspace-dialog');
    const workspaceDialogSlot = document.getElementById('workspace-dialog-slot');
    const closeWorkspaceButton = workspaceDialog.querySelector('[aria-label="Lukk utvida arbeidsflate"]');
    const expandMapButton = document.getElementById('expand-map');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const fitGraphButton = document.getElementById('fit-graph');
    let workspacePlaceholder = null;
    let expandedPagePosition = null;
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

    function preserveScroll(action) {
        const elements = new Set([
            document.scrollingElement,
            document.querySelector('.editor-panel'),
            workspaceDialogSlot
        ]);
        const positions = Array.from(elements).filter(Boolean).map(function (element) {
            return { element: element, left: element.scrollLeft, top: element.scrollTop };
        });
        action();
        positions.forEach(function (position) {
            if (position.element.scrollLeft !== position.left) position.element.scrollLeft = position.left;
            if (position.element.scrollTop !== position.top) position.element.scrollTop = position.top;
        });
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
        Graph.render(graph, story, selectedId, warnings, selectNode, connectNodes);
    }

    function scheduleWarnings() {
        window.clearTimeout(warningTimer);
        warningTimer = window.setTimeout(renderWarnings, 350);
    }

    function selectNode(nodeId) {
        if (!Model.findNode(story, nodeId)) return;
        preserveScroll(function () {
            selectedId = nodeId;
            renderEditor();
            renderGraph();
        });
    }

    function connectNodes(sourceId, targetId) {
        const source = Model.findNode(story, sourceId);
        const target = Model.findNode(story, targetId);
        if (!source || !target || source.id === target.id) return false;
        if (source.selectionMode === 'dice' && source.routes.length >= 20) {
            selectedId = source.id;
            renderEditor('Terning kan berre ha opptil 20 vegval. Byt valmåte for å leggje til fleire.');
            renderGraph();
            return false;
        }

        const wasEnd = source.isEnd;
        source.isEnd = false;
        const route = Model.addRoute(source);
        if (!route) {
            source.isEnd = wasEnd;
            selectedId = source.id;
            renderEditor('Dette steget kunne ikkje koplast vidare. Prøv å velje målsteget i redigeringa.');
            renderGraph();
            return false;
        }
        route.label = 'Vegval';
        route.targetId = target.id;
        selectedId = source.id;
        saveStory();
        renderEverything();
        const labelInput = editor.querySelector('#route-label-' + (source.routes.length - 1));
        if (labelInput) {
            labelInput.focus({ preventScroll: true });
            labelInput.select();
        }
        return true;
    }

    function openExpandedWorkspace() {
        if (workspaceDialog.open) return;
        expandedPagePosition = {
            left: document.scrollingElement.scrollLeft,
            top: document.scrollingElement.scrollTop
        };
        preserveScroll(function () {
            workspacePlaceholder = document.createComment('Vegamot arbeidsflate');
            workspace.before(workspacePlaceholder);
            workspace.classList.add('is-expanded');
            workspaceDialogSlot.appendChild(workspace);
            Vy.openModal(workspaceDialog);
            expandMapButton.setAttribute('aria-expanded', 'true');
            if (closeWorkspaceButton) closeWorkspaceButton.focus({ preventScroll: true });
        });
    }

    function restoreWorkspace() {
        if (workspacePlaceholder) {
            workspacePlaceholder.replaceWith(workspace);
            workspacePlaceholder = null;
        }
        workspace.classList.remove('is-expanded');
        expandMapButton.setAttribute('aria-expanded', 'false');
    }

    function finishWorkspaceClose() {
        const pagePosition = expandedPagePosition;
        expandedPagePosition = null;
        preserveScroll(restoreWorkspace);
        window.requestAnimationFrame(function () {
            expandMapButton.focus({ preventScroll: true });
            if (!pagePosition) return;
            document.scrollingElement.scrollLeft = pagePosition.left;
            document.scrollingElement.scrollTop = pagePosition.top;
        });
    }

    function closeExpandedWorkspace() {
        if (!workspaceDialog.open) return;
        finishWorkspaceClose();
        Vy.closeModal(workspaceDialog);
    }

    expandMapButton.addEventListener('click', openExpandedWorkspace);
    if (closeWorkspaceButton) closeWorkspaceButton.addEventListener('click', closeExpandedWorkspace);
    workspaceDialog.addEventListener('cancel', function (event) {
        event.preventDefault();
        closeExpandedWorkspace();
    });
    zoomInButton.addEventListener('click', function () { Graph.zoom(graph, 0.8); });
    zoomOutButton.addEventListener('click', function () { Graph.zoom(graph, 1.25); });
    fitGraphButton.addEventListener('click', function () { Graph.fit(graph); });
    graphViewport.addEventListener('keydown', function (event) {
        if (event.target !== graphViewport) return;
        const distance = 40;
        const movement = {
            ArrowLeft: [-distance, 0],
            ArrowRight: [distance, 0],
            ArrowUp: [0, -distance],
            ArrowDown: [0, distance]
        }[event.key];
        if (event.key === 'Home') {
            event.preventDefault();
            Graph.fit(graph);
        } else if (movement) {
            event.preventDefault();
            Graph.pan(graph, movement[0], movement[1]);
        }
    });
    workspaceDialog.addEventListener('close', finishWorkspaceClose);
    graphViewport.addEventListener('click', function (event) {
        if (workspaceDialog.open) return;
        if (event.target === graph || event.target === graphViewport) openExpandedWorkspace();
    });

    function renderWarnings() {
        preserveScroll(renderWarningsContent);
    }

    function renderWarningsContent() {
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
        preserveScroll(function () {
            storyTitle.value = story.title;
            allowReaderBack.checked = Boolean(story.settings && story.settings.allowBack);
            renderEditor();
            renderGraph();
            renderWarnings();
        });
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

        const contentCard = el('section', 'editor-card');
        contentCard.appendChild(el('h4', '', 'Innhald'));

        const locationActions = el('div', 'editor-actions step-status-controls');
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
        locationActions.appendChild(endRow);
        contentCard.appendChild(locationActions);
        contentCard.appendChild(el('p', 'end-help', 'Eit sluttsteg har ingen vegval vidare.'));
        if (story.nodes.length < 2) {
            contentCard.appendChild(el('p', 'helper-text', 'Du må ha minst to steg for å slette eit steg.'));
        }
        if (message) contentCard.appendChild(el('p', 'inline-message', message));

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
        contentCard.appendChild(field('Namn på steget', titleInput, 'step-title'));

        const bodyInput = document.createElement('textarea');
        bodyInput.value = node.body;
        bodyInput.rows = 7;
        bodyInput.addEventListener('input', function () {
            node.body = bodyInput.value;
            scheduleSave();
            renderGraph();
        });
        contentCard.appendChild(field('Forteljingstekst', bodyInput, 'step-body'));

        StepImage.render(contentCard, node.image, {
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

        const routesCard = el('section', 'editor-card');
        if (node.isEnd) {
            routesCard.appendChild(el('p', 'helper-text', 'Dette steget er ei avslutning. Fjern avkryssinga over for å leggje til vegval.'));
        }
        RoutingEditor.render(routesCard, node, story, { el: el, button: button, field: field }, {
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
                    if (control) control.focus({ preventScroll: true });
                }
            },
            onRouteAdded: function () {
                saveStory();
                renderEverything();
                const routeLabels = editor.querySelectorAll('.route-label');
                const newLabel = routeLabels[routeLabels.length - 1];
                if (newLabel) newLabel.focus({ preventScroll: true });
            }
        });
        form.append(contentCard, routesCard);
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
            input.focus({ preventScroll: true });
            input.select();
        }
    });

    window.addEventListener('beforeunload', function () {
        if (saveTimer) saveStory();
    });

    let legacyStory = null;
    try {
        const stored = VyrdepilStorage.getGameState(APP_ID);
        legacyStory = stored ? null : VyrdepilStorage.getGameState('forteljingskart');
        story = stored || legacyStory ? Model.normalizeStory(stored || legacyStory) : Model.createStory();
    } catch (error) {
        story = Model.createStory();
        saveStatus.textContent = 'Kunne ikkje lese lokal lagring';
        saveStatus.dataset.state = 'error';
    }
    selectedId = story.startNodeId;
    renderEverything();
    if (legacyStory && saveStatus.dataset.state !== 'error') {
        saveStatus.textContent = 'Flyttar den lagra forteljinga til Vegamot …';
        const images = legacyStory.nodes.filter(function (node) { return node.image; });
        Promise.all(images.map(function (node) {
            return VyrdepilStorage.getGameAsset('forteljingskart', node.image.assetId).then(function (asset) {
                if (!asset || !asset.blob) return false;
                return VyrdepilStorage.saveGameAsset(APP_ID, node.image.assetId, asset).then(function () { return true; });
            }).catch(function () { return false; });
        })).then(function (results) {
            const missingImages = results.filter(function (copied) { return !copied; }).length;
            if (!saveStory()) return;
            if (missingImages) saveStatus.textContent = 'Forteljinga er flytta. ' + missingImages + ' bilete kunne ikkje hentast frå den eldre lagringa.';
            renderEditor();
        });
    } else if (saveStatus.dataset.state !== 'error') {
        saveStory();
    }
})();
