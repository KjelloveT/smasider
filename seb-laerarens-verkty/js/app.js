/* Read inputs, report validation errors and hand the encrypted file to the browser. */
(function () {
  'use strict';

  const form = document.getElementById('exam-form');
  const fields = document.getElementById('exam-fields');
  const templateFile = document.getElementById('template-file');
  const templatePassword = document.getElementById('template-password');
  const startUrl = document.getElementById('start-url');
  const templateOptions = document.getElementById('template-options');
  const newPassword = document.getElementById('new-password');
  const confirmPassword = document.getElementById('confirm-password');
  const submit = document.getElementById('export-exam');
  const status = document.getElementById('export-status');
  const errors = {
    size: 'Malen er for stor til å opnast her. Bruk ei mindre SEB-fil utan store vedlegg.',
    format: 'Klarte ikkje å lese SEB-fila. Bruk ei passordkryptert prøvefil frå SEB Configuration Tool.',
    certificate: 'Malen er sertifikatkryptert. Opne han i SEB Configuration Tool og lagre ein kopi med berre opningspassord.',
    purpose: 'Malen er meint for klientoppsett. Bruk ei fil lagra med «Starting an exam».',
    password: 'Klarte ikkje å opne malen. Kontroller opningspassordet og prøv att.'
  };

  function showStatus(text, type = '') {
    status.className = 'vp-notice vp-notice--text seb-status' + (type ? ` vp-notice--${type}` : '');
    status.firstElementChild.textContent = text;
    status.hidden = !text;
  }

  function markInvalid(input, message) {
    input.setAttribute('aria-invalid', 'true');
    showStatus(message, 'error');
    input.focus();
  }

  function resetForm() {
    // Discard all user inputs after export or when the page is left.
    form.reset();
    templateOptions.open = false;
    for (const field of form.querySelectorAll('[aria-invalid]')) field.removeAttribute('aria-invalid');
  }

  async function loadStandardTemplate() {
    // This GET contains only the fixed URL of the public template.
    const address = new URL('standardmal.seb', document.baseURI);
    const response = await fetch(address, { credentials: 'omit', mode: 'same-origin', redirect: 'error' });
    if (!response.ok) throw new Error('Missing standard template');
    return response.blob();
  }

  form.addEventListener('input', (event) => {
    event.target.removeAttribute('aria-invalid');
    showStatus('');
  });
  templateOptions.addEventListener('toggle', () => {
    if (templateOptions.open) return;
    for (const field of [templateFile, templatePassword]) {
      field.value = '';
      field.removeAttribute('aria-invalid');
    }
  });
  window.addEventListener('pagehide', resetForm);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    let url;
    try {
      url = new URL(startUrl.value.trim());
    } catch {
      return markInvalid(startUrl, 'Skriv inn ei fullstendig HTTPS-adresse til prøva.');
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
      return markInvalid(startUrl, 'Bruk ei HTTPS-adresse utan brukarnamn eller passord.');
    }

    const password = newPassword.value;
    if (!password.trim()) {
      return markInvalid(newPassword, 'Skriv inn eit opningspassord for prøvefila.');
    }
    if (password !== confirmPassword.value) {
      return markInvalid(confirmPassword, 'Dei to passorda er ulike. Skriv inn same passord i båe felta.');
    }

    const useCustomTemplate = templateOptions.open;
    const file = useCustomTemplate ? templateFile.files[0] : null;
    if (useCustomTemplate && !file) {
      return markInvalid(templateFile, 'Vel ei SEB-fil, eller lukk «Bruk eigen SEB-mal» for å bruke standardmalen.');
    }
    if (useCustomTemplate && !templatePassword.value) {
      return markInvalid(templatePassword, 'Skriv inn opningspassordet for malen din.');
    }

    fields.disabled = true;
    showStatus('Krypterer prøvefila …');
    try {
      const { blob, filterEnabled } = useCustomTemplate
        ? await window.SebFile.exportExam(file, templatePassword.value, url.href, password)
        : await window.SebFile.exportFromStandard(await loadStandardTemplate(), url.href, password);
      const name = file ? window.Vy.slug(file.name.replace(/\.seb$/i, ''), 'seb').slice(0, 64) : 'vyrdepil';
      window.Vy.downloadBlob(blob, name + '-prove.seb');
      resetForm();
      showStatus(filterEnabled
        ? 'Prøvefila er laga. Nettadressefilteret er på. Prøv at den nye adressa og innlogginga fungerer i SEB.'
        : 'Prøvefila er laga. Nettadressefilteret er av.', filterEnabled ? 'warning' : 'success');
    } catch (error) {
      fields.disabled = false;
      if (!useCustomTemplate) {
        showStatus('Klarte ikkje å bruke standardmalen frå Vyrdepil. Prøv att, eller vel ein eigen SEB-mal.', 'error');
      } else if (error.name === 'SebFileError' && error.message === 'password') {
        templatePassword.value = '';
        markInvalid(templatePassword, errors.password);
      } else if (error.name === 'SebFileError') {
        markInvalid(templateFile, errors[error.message] || errors.format);
      } else {
        showStatus('Klarte ikkje å lage prøvefila. Opne verktyet på nytt og prøv att.', 'error');
      }
    } finally {
      fields.disabled = false;
    }
  });

  if (globalThis.crypto?.subtle && globalThis.CompressionStream && globalThis.DecompressionStream) {
    submit.disabled = false;
  } else {
    showStatus('Nettlesaren støttar ikkje krypteringa her. Opne verktyet i ein oppdatert Edge eller Chrome.', 'error');
  }
})();
