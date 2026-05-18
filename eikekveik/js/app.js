// Eikekveik — namespace og oppstart
// Modulane (state, render, interaction, storage, export) hektar seg på window.Eikekveik
// via IIFE-mønsteret. Last-rekkjefølgje i index.html avgjer at app.js definerer namespace
// før dei andre fyller på.

window.Eikekveik = window.Eikekveik || {};

Eikekveik.GAME_KEY = 'eikekveik';
Eikekveik.EXPORT_VERSION = 1;

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

document.addEventListener('DOMContentLoaded', () => {
    Eikekveik.el = {
        canvas: document.getElementById('canvas'),
        edges: document.getElementById('edges'),
        colorPalette: document.getElementById('color-palette'),
        colorRow: document.getElementById('color-row'),
        btnNew: document.getElementById('btn-new'),
        btnUndo: document.getElementById('btn-undo'),
        btnRedo: document.getElementById('btn-redo'),
        btnSave: document.getElementById('btn-save'),
        btnOpen: document.getElementById('btn-open'),
        btnExport: document.getElementById('btn-export'),
        btnImport: document.getElementById('btn-import'),
        btnPrint: document.getElementById('btn-print'),
        importFile: document.getElementById('import-file'),
        saveModal: document.getElementById('save-modal'),
        saveModalClose: document.getElementById('save-modal-close'),
        saveName: document.getElementById('save-name'),
        saveConfirm: document.getElementById('save-confirm'),
        saveCancel: document.getElementById('save-cancel'),
        openModal: document.getElementById('open-modal'),
        openModalClose: document.getElementById('open-modal-close'),
        openCancel: document.getElementById('open-cancel'),
        savedList: document.getElementById('saved-list')
    };

    Eikekveik.State.init();
    Eikekveik.Render.init();
    Eikekveik.Interaction.init();
    Eikekveik.Storage.init();
    Eikekveik.Export.init();

    // Last forrige økt om finst, elles ny sentrum-node
    const saved = Eikekveik.Storage.loadAutoSave();
    if (saved && saved.nodes && saved.nodes.length) {
        Eikekveik.State.load(saved);
    } else {
        Eikekveik.State.reset();
    }
    Eikekveik.Render.renderAll();
});
