/* app.js — orkestrering for Ordskodde: state, hendingar og init. */
(function () {
  'use strict';

  const UI = OrdskoddeUI;
  const $ = id => document.getElementById(id);

  // ---- State ----

  const state = {
    cloudId: null,
    title: '',
    words: [],
    disabledWords: new Set(),     // ikkje-stoppord brukaren har slege av
    enabledStopwords: new Set(),  // stoppord brukaren har slege på
    settings: OrdskoddeThemes.settingsFromTheme('klassisk'),
    layout: null
  };

  function debounce(fn, ms) {
    let timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  // ---- Analyse og utlegging ----

  function applyDeltas(words) {
    for (const entry of words) {
      if (entry.stopword) entry.enabled = state.enabledStopwords.has(entry.word);
      else entry.enabled = !state.disabledWords.has(entry.word);
    }
    return words;
  }

  function analyzeText() {
    state.words = applyDeltas(OrdskoddeText.analyze($('sourceText').value));
  }

  function relayout() {
    state.layout = OrdskoddeLayout.compute(state.words, {
      width: 1200, height: 1200,
      shape: state.settings.shape,
      fontStack: OrdskoddeThemes.getFont(state.settings.fontId).stack,
      maxWords: state.settings.maxWords,
      minSize: state.settings.minSize,
      maxSize: state.settings.maxSize,
      rotationMode: state.settings.rotationMode,
      seed: state.settings.seed
    });
    redraw();
    const note = $('skipNote');
    note.hidden = state.layout.skipped === 0;
    note.textContent = state.layout.skipped > 0
      ? state.layout.skipped + ' av dei minste orda fekk ikkje plass og blei utelatne. Vil du ha med alle, prøv færre ord eller ei anna form.'
      : '';
  }

  function redraw() {
    if (!state.layout) return;
    OrdskoddeRender.drawPreview($('cloudCanvas'), state.layout, state.settings);
    $('canvasWrap').classList.toggle('transparent', state.settings.transparentBg);
  }

  const relayoutDebounced = debounce(relayout, 150);

  // ---- Rendering av panel ----

  function refreshWordList() {
    UI.renderWordList($('wordList'), state.words, $('wordSearch').value, onToggleWord);
  }

  function refreshSettingsControls() {
    UI.renderThemeSwatches($('themeSwatches'), state.settings.themeId, onPickTheme);
    UI.renderShapeButtons($('shapeButtons'), state.settings.shape, onPickShape);
    UI.fillFontSelect($('fontSelect'), state.settings.fontId);
    UI.renderColorInputs($('colorInputs'), state.settings.colors, onChangeColor);
    $('bgColorInput').value = state.settings.background;
    $('bgTransparentCheck').checked = state.settings.transparentBg;
    $('maxWordsRange').value = state.settings.maxWords;
    $('maxWordsValue').textContent = state.settings.maxWords;
    $('rotationSelect').value = state.settings.rotationMode;
  }

  function refreshTitle() {
    $('cloudTitle').textContent = state.title || 'Utan namn';
  }

  function refreshSavedList() {
    UI.renderSavedList($('savedList'), $('savedEmpty'), OrdskoddeStorage.getClouds(), {
      onOpen: openCloud,
      onRename: renameCloud,
      onDuplicate: id => { OrdskoddeStorage.duplicateCloud(id); refreshSavedList(); },
      onExport: exportCloudById,
      onDelete: id => {
        const cloud = OrdskoddeStorage.getCloud(id);
        if (cloud && window.confirm('Vil du slette ordskya «' + cloud.title + '»?')) {
          OrdskoddeStorage.deleteCloud(id);
          refreshSavedList();
        }
      }
    });
  }

  // ---- Hendingar: innstillingar ----

  function onPickTheme(themeId) {
    const theme = OrdskoddeThemes.getTheme(themeId);
    state.settings.themeId = theme.id;
    state.settings.fontId = theme.fontId;
    state.settings.colors = theme.colors.slice();
    state.settings.background = theme.background;
    refreshSettingsControls();
    relayout(); // ny skrifttype krev ny utlegging
  }

  function onPickShape(shape) {
    state.settings.shape = shape;
    UI.renderShapeButtons($('shapeButtons'), shape, onPickShape);
    relayout();
  }

  function onChangeColor(i, value) {
    state.settings.colors[i] = value;
    redraw();
  }

  function onToggleWord(idx, enabled) {
    const entry = state.words[idx];
    entry.enabled = enabled;
    if (entry.stopword) {
      if (enabled) state.enabledStopwords.add(entry.word);
      else state.enabledStopwords.delete(entry.word);
    } else {
      if (enabled) state.disabledWords.delete(entry.word);
      else state.disabledWords.add(entry.word);
    }
    refreshWordList();
    relayoutDebounced();
  }

  // ---- Hendingar: hovudflyt ----

  function makeCloud() {
    const text = $('sourceText').value;
    const warn = $('textWarn');
    if (!text.trim()) {
      warn.hidden = false;
      warn.textContent = 'Lim inn ein tekst først.';
      return;
    }
    if (text.length > 200000) {
      warn.hidden = false;
      warn.textContent = 'Teksten er svært lang (' + text.length + ' teikn) — analysen kan ta litt tid.';
    } else {
      warn.hidden = true;
    }
    analyzeText();
    $('resultSection').hidden = false;
    refreshSettingsControls();
    refreshWordList();
    refreshTitle();
    relayout();
    $('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function currentCloudObject() {
    return Object.assign(
      state.cloudId ? (OrdskoddeStorage.getCloud(state.cloudId) || OrdskoddeStorage.newCloudObject()) : OrdskoddeStorage.newCloudObject(),
      {
        id: state.cloudId || undefined,
        title: state.title || 'Utan namn',
        text: $('sourceText').value,
        disabledWords: [...state.disabledWords],
        enabledStopwords: [...state.enabledStopwords],
        settings: Object.assign({}, state.settings)
      }
    );
  }

  function openCloud(id) {
    const cloud = OrdskoddeStorage.getCloud(id);
    if (!cloud) return;
    state.cloudId = cloud.id;
    state.title = cloud.title;
    state.disabledWords = new Set(cloud.disabledWords || []);
    state.enabledStopwords = new Set(cloud.enabledStopwords || []);
    state.settings = Object.assign(OrdskoddeThemes.settingsFromTheme('klassisk'), cloud.settings || {});
    $('sourceText').value = cloud.text;
    $('sampleNote').hidden = true;
    OrdskoddeStorage.setLastCloud(cloud.id);
    makeCloud();
  }

  function renameCloud(id) {
    const cloud = OrdskoddeStorage.getCloud(id);
    if (!cloud) return;
    openTitleModal('Endre namn', cloud.title, newTitle => {
      cloud.title = newTitle;
      OrdskoddeStorage.saveCloud(cloud);
      if (state.cloudId === id) { state.title = newTitle; refreshTitle(); }
      refreshSavedList();
    });
  }

  function exportCloudById(id) {
    const cloud = OrdskoddeStorage.getCloud(id);
    if (!cloud) return;
    const blob = new Blob([JSON.stringify(cloud, null, 2)], { type: 'application/json' });
    OrdskoddeRender.downloadBlob(blob, 'ordskodde-' + OrdskoddeRender.slugify(cloud.title) + '.json');
  }

  // ---- Modal for tittel (lagre / endre namn) ----

  let titleModal = null;
  let titleModalCallback = null;

  function openTitleModal(heading, value, onConfirm) {
    $('saveModalHeading').textContent = heading;
    $('saveTitleInput').value = value || '';
    titleModalCallback = onConfirm;
    titleModal.open();
    $('saveTitleInput').focus();
    $('saveTitleInput').select();
  }

  function confirmTitleModal() {
    const title = $('saveTitleInput').value.trim() || 'Utan namn';
    titleModal.close();
    if (titleModalCallback) titleModalCallback(title);
    titleModalCallback = null;
  }

  // ---- Init ----

  function init() {
    titleModal = UI.wireModal($('saveOverlay'), $('saveModalClose'));

    $('makeCloudBtn').addEventListener('click', makeCloud);
    $('clearTextBtn').addEventListener('click', () => {
      $('sourceText').value = '';
      $('sampleNote').hidden = true;
      $('sourceText').focus();
    });
    $('sourceText').addEventListener('input', () => {
      $('sampleNote').hidden = $('sourceText').value !== OrdskoddeSample.TEXT;
    });

    $('fontSelect').addEventListener('change', () => {
      state.settings.fontId = $('fontSelect').value;
      relayout();
    });
    $('bgColorInput').addEventListener('input', () => {
      state.settings.background = $('bgColorInput').value;
      state.settings.transparentBg = false;
      $('bgTransparentCheck').checked = false;
      redraw();
    });
    $('bgTransparentCheck').addEventListener('change', () => {
      state.settings.transparentBg = $('bgTransparentCheck').checked;
      redraw();
    });
    $('maxWordsRange').addEventListener('input', () => {
      state.settings.maxWords = parseInt($('maxWordsRange').value, 10);
      $('maxWordsValue').textContent = state.settings.maxWords;
      relayoutDebounced();
    });
    $('rotationSelect').addEventListener('change', () => {
      state.settings.rotationMode = $('rotationSelect').value;
      relayout();
    });

    $('wordSearch').addEventListener('input', debounce(refreshWordList, 120));
    $('resetWordsBtn').addEventListener('click', () => {
      state.disabledWords.clear();
      state.enabledStopwords.clear();
      analyzeText();
      refreshWordList();
      relayout();
    });
    $('top50Btn').addEventListener('click', () => {
      let kept = 0;
      state.enabledStopwords.clear();
      state.disabledWords.clear();
      for (const entry of state.words) {
        if (!entry.stopword && kept < 50) { entry.enabled = true; kept++; }
        else {
          entry.enabled = false;
          if (!entry.stopword) state.disabledWords.add(entry.word);
        }
      }
      refreshWordList();
      relayout();
    });

    $('saveBtn').addEventListener('click', () => {
      openTitleModal('Lagre ordskya', state.title, title => {
        state.title = title;
        const saved = OrdskoddeStorage.saveCloud(currentCloudObject());
        state.cloudId = saved.id;
        OrdskoddeStorage.setLastCloud(saved.id);
        refreshTitle();
        refreshSavedList();
      });
    });
    $('saveConfirmBtn').addEventListener('click', confirmTitleModal);
    $('saveCancelBtn').addEventListener('click', () => titleModal.close());
    $('saveTitleInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmTitleModal();
    });

    $('pngBtn').addEventListener('click', () => {
      if (state.layout) OrdskoddeRender.exportPNG(state.layout, state.settings, { transparent: false, title: state.title });
    });
    $('pngTransBtn').addEventListener('click', () => {
      if (state.layout) OrdskoddeRender.exportPNG(state.layout, state.settings, { transparent: true, title: state.title });
    });
    $('svgBtn').addEventListener('click', () => {
      if (state.layout) OrdskoddeRender.exportSVG(state.layout, state.settings, state.title);
    });
    $('printBtn').addEventListener('click', () => {
      if (state.layout) OrdskoddeRender.printCloud(state.layout, state.settings);
    });
    $('exportJsonBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(currentCloudObject(), null, 2)], { type: 'application/json' });
      OrdskoddeRender.downloadBlob(blob, 'ordskodde-' + OrdskoddeRender.slugify(state.title) + '.json');
    });

    $('importBtn').addEventListener('click', () => $('importFile').click());
    $('importFile').addEventListener('change', () => {
      const file = $('importFile').files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let result;
        try {
          result = OrdskoddeStorage.importCloud(JSON.parse(reader.result));
        } catch (e) {
          result = { error: 'Klarte ikkje å lese fila som JSON.' };
        }
        if (result.error) {
          window.alert(result.error);
        } else {
          refreshSavedList();
          openCloud(result.cloud.id);
        }
        $('importFile').value = '';
      };
      reader.readAsText(file);
    });

    refreshSavedList();

    // Første besøk: vis eksempeltekst. Elles: opne sist brukte sky.
    const lastId = OrdskoddeStorage.getLastCloud();
    if (lastId && OrdskoddeStorage.getCloud(lastId)) {
      openCloud(lastId);
    } else {
      $('sourceText').value = OrdskoddeSample.TEXT;
      $('sampleNote').hidden = false;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
