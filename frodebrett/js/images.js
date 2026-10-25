/* Frødebrett — lokale spørsmålsbilete. */
(function (root) {
  'use strict';
  const FB = root.FB;
  let pending = 0;
  const Images = { busy: () => pending > 0 };
  Images.valid = value => typeof value === 'string' && value.length <= 280000
    && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
  Images.show = function (id, question) {
    const image = FB.el(id);
    const valid = Images.valid(question.image);
    image.classList.toggle('hidden', !valid);
    if (valid) {
      image.src = question.image;
      image.alt = question.imageAlt || 'Bilete til spørsmålet';
    } else image.removeAttribute('src');
  };
  async function read(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw Error('Vel eit JPEG-, PNG- eller WebP-bilete.');
    if (file.size > 20 * 1024 * 1024) throw Error('Vel ei fil under 20 MB.');
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      try { await image.decode(); } catch (_) { throw Error('Kunne ikkje lese biletet. Prøv ei anna fil.'); }
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.65, 0.45]) {
        const data = canvas.toDataURL('image/jpeg', quality);
        if (Images.valid(data)) return data;
      }
      throw Error('Biletet har for mange detaljar. Vel eit mindre bilete.');
    } finally { URL.revokeObjectURL(url); }
  }
  Images.control = function (question, label) {
    const group = document.createElement('div');
    group.className = 'fb-image-control';
    const pickerLabel = document.createElement('label');
    pickerLabel.className = 'vp-field';
    pickerLabel.textContent = 'Bilete til ' + label;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.className = 'vp-input';
    pickerLabel.appendChild(input);
    const hint = document.createElement('p');
    hint.textContent = 'Valfritt. JPEG, PNG eller WebP, inntil 20 MB. Biletet blir forminska og lagra berre på denne eininga.';
    const preview = document.createElement('img');
    preview.className = 'fb-image-preview';
    preview.alt = 'Valt spørsmålsbilete';
    const alt = document.createElement('input');
    alt.type = 'text';
    alt.className = 'vp-input';
    alt.setAttribute('aria-label', 'Biletskildring for ' + label);
    alt.placeholder = 'Kort biletskildring (for skjermlesar)';
    alt.maxLength = 300;
    alt.value = question.imageAlt || '';
    alt.addEventListener('input', () => { question.imageAlt = alt.value.trim(); });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'vp-button vp-button--small';
    remove.textContent = 'Fjern bilete';
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    const refresh = () => {
      const hasImage = Images.valid(question.image);
      preview.hidden = alt.hidden = remove.hidden = !hasImage;
      if (hasImage) preview.src = question.image;
      else preview.removeAttribute('src');
    };
    remove.addEventListener('click', () => {
      delete question.image;
      delete question.imageAlt;
      alt.value = input.value = '';
      status.textContent = '';
      refresh();
    });
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      pending++;
      input.disabled = remove.disabled = true;
      status.textContent = 'Handsamar biletet…';
      try {
        question.image = await read(file);
        status.textContent = 'Biletet er klart. Hugs å lagre frøda.';
        refresh();
      } catch (error) {
        status.textContent = error.message || 'Kunne ikkje lese biletet.';
      } finally {
        pending--;
        input.disabled = remove.disabled = false;
        input.value = '';
      }
    });
    group.append(pickerLabel, hint, preview, alt, remove, status);
    refresh();
    return group;
  };
  FB.Images = Images;
})(window);
