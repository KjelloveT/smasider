/* Søk og filter for bakgrunnar, med reine fotooppsett som eige val. */
const Gallery = (() => {
    let host, grid, count, chosen, choose, dialog, message;
    let style, theme, search;
    const styleNames = { watercolor: 'Måla akvarell', pixel: 'Pikselkunst', storybook: 'Barnebok', school: 'Skuleillustrasjon', abstract: 'Abstrakt' };
    const themeNames = { nature: 'Natur og årstider', birthday: 'Bursdag og feiring', school: 'Skule og læring', art: 'Kunst og papir', adventure: 'Eventyr og reiser', leisure: 'Idrett og fritid' };

    function field(label, control) {
        const wrap = document.createElement('label'); wrap.className = 'vp-field';
        const text = document.createElement('span'); text.textContent = label;
        wrap.append(text, control); return wrap;
    }
    function select(label, names) {
        const input = document.createElement('select'); input.className = 'vp-input';
        const all = document.createElement('option'); all.value = ''; all.textContent = 'Alle'; input.append(all);
        Object.entries(names).forEach(([value, name]) => {
            const option = document.createElement('option'); option.value = value; option.textContent = name;
            input.append(option);
        });
        input.addEventListener('change', update);
        return { input, wrap: field(label, input) };
    }
    function init(onChoose) {
        choose = onChoose; host = document.getElementById('background-gallery'); host.replaceChildren();
        dialog = document.getElementById('background-dialog');
        document.getElementById('choose-background').addEventListener('click', () => Vy.openModal(dialog));
        document.getElementById('close-background').addEventListener('click', () => Vy.closeModal(dialog));
        Vy.bindOverlayClose(dialog);
        const filters = document.createElement('div'); filters.className = 'background-filters';
        const styles = select('Stil', styleNames), themes = select('Tema', themeNames);
        style = styles.input; theme = themes.input;
        search = document.createElement('input'); search.type = 'search'; search.className = 'vp-input';
        search.placeholder = 'Til dømes bursdag'; search.addEventListener('input', update);
        const searchField = field('Søk i bakgrunnane', search); searchField.classList.add('background-search');
        filters.append(styles.wrap, themes.wrap, searchField);
        chosen = document.createElement('p'); chosen.className = 'background-chosen';
        count = document.createElement('p'); count.className = 'panel-hint'; count.setAttribute('role', 'status');
        grid = document.createElement('div'); grid.className = 'background-grid';
        grid.setAttribute('aria-label', 'Bakgrunnar');
        const reset = document.createElement('button'); reset.type = 'button';
        reset.className = 'vp-button vp-button--compact vp-button--quiet'; reset.textContent = 'Vis alle bakgrunnar';
        reset.addEventListener('click', () => { style.value = ''; theme.value = ''; search.value = ''; update(); });
        message = document.createElement('p'); message.setAttribute('role', 'status');
        host.append(filters, chosen, count, message, grid, reset);
        update();
    }
    function update() {
        const query = search.value.trim().toLocaleLowerCase('nn-NO');
        const visible = Templates.tema.filter(template =>
            (!style.value || template.style === style.value) &&
            (!theme.value || template.theme === theme.value) &&
            (!query || [template.name, styleNames[template.style], themeNames[template.theme]].join(' ').toLocaleLowerCase('nn-NO').includes(query)));
        const choices = visible.map(card);
        if (!style.value && !theme.value && !query) choices.unshift(card(Templates.get('blank')));
        grid.replaceChildren(...choices); grid.scrollTop = 0;
        count.textContent = visible.length + ' av ' + Templates.tema.length + ' bakgrunnar';
        if (!visible.length) {
            const empty = document.createElement('p'); empty.textContent = 'Ingen treff. Prøv eit anna søk eller vis alle bakgrunnar.';
            grid.append(empty);
        }
        if (Collage.current) selectCurrent(Collage.current.id);
    }
    function card(template) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'vp-button vp-button--quiet tpl-card'; button.dataset.id = template.id;
        button.dataset.style = template.style || 'plain';
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', 'Vel bakgrunn: ' + template.name);
        let thumbnail;
        if (template.thumb) {
            thumbnail = document.createElement('img'); thumbnail.src = template.thumb;
            thumbnail.alt = ''; thumbnail.loading = 'lazy'; thumbnail.width = 80; thumbnail.height = 120;
        } else {
            thumbnail = document.createElement('canvas'); renderLayout(thumbnail, template);
        }
        const label = document.createElement('span'); label.className = 'tpl-name'; label.textContent = template.name;
        const mark = document.createElement('span'); mark.className = 'vp-selection-mark'; mark.setAttribute('aria-hidden', 'true');
        mark.innerHTML = ICON('check', 18);
        button.append(thumbnail, mark, label);
        button.addEventListener('click', async () => {
            button.disabled = true;
            try { if (await choose(template.id)) Vy.closeModal(dialog); }
            finally { button.disabled = false; }
        });
        return button;
    }
    function renderLayout(canvas, template) {
        canvas.width = 100; canvas.height = template.orientation === 'landscape' ? 71 : 141;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fffdf5'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#d6e8f1'; ctx.strokeStyle = '#142820'; ctx.lineWidth = 1;
        template.slots.forEach(slot => {
            ctx.fillRect(slot.x * canvas.width, slot.y * canvas.height, slot.w * canvas.width, slot.h * canvas.height);
            ctx.strokeRect(slot.x * canvas.width, slot.y * canvas.height, slot.w * canvas.width, slot.h * canvas.height);
        });
    }
    function selectCurrent(id) {
        const current = Templates.get(id); chosen.textContent = current ? 'Vald: ' + current.name : '';
        document.getElementById('current-background-name').textContent = current?.name || '';
        const preview = document.getElementById('current-background-preview');
        preview.hidden = !current?.thumb;
        if (current?.thumb) preview.src = current.thumb;
        host.querySelectorAll('.tpl-card').forEach(button => {
            const active = button.dataset.id === id;
            button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
        });
    }
    return { init, select: selectCurrent, status: text => { message.textContent = text; } };
})();
