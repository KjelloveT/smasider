// Eikekveik — namespace og oppstart
// Modulane (state, shapes, view, render, interaction, picker, storage, export, png)
// hektar seg på window.Eikekveik via IIFE-mønsteret. Last-rekkjefølgje i index.html
// avgjer at app.js definerer namespace før dei andre fyller på.

window.Eikekveik = window.Eikekveik || {};

Eikekveik.GAME_KEY = 'eikekveik';
// 3: kvar sambandline kan ha eiga pilretning. Versjon 2 hadde éin
// pilinnstilling for heile kartet og blir migrert ved innlasting.
Eikekveik.EXPORT_VERSION = 3;

Eikekveik.COLORS = [
    { name: 'gul',      value: '#FFD166' },
    { name: 'grøn',     value: '#BAFCA2' },
    { name: 'blå',      value: '#87CEEB' },
    { name: 'rosa',     value: '#FFB2EF' },
    { name: 'oransje',  value: '#FFA07A' },
    { name: 'lilla',    value: '#C4A1FF' },
    { name: 'teal',     value: '#A7DBD8' },
    { name: 'kvit',     value: '#FFFFFF' }
];

Eikekveik.DEFAULT_COLOR = '#FFD166';
Eikekveik.DEFAULT_SHAPE = 'rounded';

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    Eikekveik.el = {
        canvas: $('canvas'),
        world: $('world'),
        edges: $('edges'),
        zoomIn: $('zoom-in'),
        zoomOut: $('zoom-out'),
        zoomReset: $('zoom-reset'),
        zoomFit: $('zoom-fit'),
        panelEmpty: $('panel-empty'),
        panelNode: $('panel-node'),
        panelEdge: $('panel-edge'),
        edgeEndingRow: $('edge-ending-row'),
        colorRow: $('color-row'),
        shapePicker: $('shape-picker'),
        shapeGridKart: $('shape-grid-kart'),
        shapeGridFlyt: $('shape-grid-flyt'),
        iconPreview: $('icon-preview'),
        btnIcon: $('btn-icon'),
        btnIconRemove: $('btn-icon-remove'),
        btnNew: $('btn-new'),
        btnUndo: $('btn-undo'),
        btnRedo: $('btn-redo'),
        btnSave: $('btn-save'),
        btnOpen: $('btn-open'),
        btnExport: $('btn-export'),
        btnImport: $('btn-import'),
        btnPng: $('btn-png'),
        btnPrint: $('btn-print'),
        importFile: $('import-file'),
        saveModal: $('save-modal'),
        saveModalClose: $('save-modal-close'),
        saveName: $('save-name'),
        saveConfirm: $('save-confirm'),
        saveCancel: $('save-cancel'),
        openModal: $('open-modal'),
        openModalClose: $('open-modal-close'),
        openCancel: $('open-cancel'),
        savedList: $('saved-list'),
        pickerModal: $('picker-modal'),
        pickerClose: $('picker-close'),
        pickerSearch: $('picker-search'),
        pickerTabs: $('picker-tabs'),
        pickerGrid: $('picker-grid')
    };

    Eikekveik.State.init();
    Eikekveik.View.init();
    Eikekveik.Render.init();
    Eikekveik.Interaction.init();
    Eikekveik.Picker.init();
    Eikekveik.Storage.init();
    Eikekveik.Export.init();
    Eikekveik.Png.init();

    // Last forrige økt om finst, elles ny sentrum-node
    const saved = Eikekveik.Storage.loadAutoSave();
    if (saved && saved.nodes && saved.nodes.length) {
        Eikekveik.State.load(saved);
    } else {
        Eikekveik.State.reset();
    }
    Eikekveik.Render.renderAll();
    Eikekveik.View.showAll({ onlyIfNeeded: true });
});
