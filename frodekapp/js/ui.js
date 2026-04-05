/* ══════════════════════════════════════════════
   FRØDEKAPP — Delt UI-hjelpefunksjonar
   ══════════════════════════════════════════════ */

const UI = {
    /**
     * Vis ein skjerm og gøym alle andre
     * @param {string} screenId - ID til skjermen som skal visast
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(screenId);
        if (el) el.classList.add('active');
    },

    /**
     * Sett tekst-innhald på eit element
     * @param {string} id
     * @param {string} text
     */
    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    /**
     * Sett HTML-innhald på eit element
     * @param {string} id
     * @param {string} html
     */
    setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    },

    /**
     * Vis/gøym eit element
     * @param {string} id
     * @param {boolean} visible
     */
    toggle(id, visible) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('hidden', !visible);
    },

    /**
     * Aktiver/deaktiver ein knapp
     * @param {string} id
     * @param {boolean} enabled
     */
    enableBtn(id, enabled) {
        const el = document.getElementById(id);
        if (el) el.disabled = !enabled;
    },

    /**
     * Lag svaralternativ-knappar (Kahoot-stil)
     * @param {string[]} options
     * @param {function} onClick - callback(index)
     * @returns {HTMLElement} grid-container
     */
    createAnswerGrid(options, onClick) {
        const grid = document.createElement('div');
        grid.className = 'answer-grid';

        options.forEach((text, i) => {
            const btn = document.createElement('button');
            btn.className = `answer-btn ${QuizEngine.ANSWER_CLASSES[i]}`;
            btn.innerHTML = `<span class="answer-icon">${QuizEngine.ANSWER_ICONS[i]}</span> ${this.escapeHTML(text)}`;
            btn.addEventListener('click', () => onClick(i));
            grid.appendChild(btn);
        });

        return grid;
    },

    /**
     * Lag svaralternativ for vert-visning (ikkje klikkbare)
     * @param {string[]} options
     * @returns {HTMLElement}
     */
    createAnswerGridDisplay(options) {
        const grid = document.createElement('div');
        grid.className = 'answer-grid';

        options.forEach((text, i) => {
            const div = document.createElement('div');
            div.className = `answer-btn ${QuizEngine.ANSWER_CLASSES[i]}`;
            div.innerHTML = `<span class="answer-icon">${QuizEngine.ANSWER_ICONS[i]}</span> ${this.escapeHTML(text)}`;
            grid.appendChild(div);
        });

        return grid;
    },

    /**
     * Marker rett/feil svar i eit answer-grid
     * @param {HTMLElement} grid
     * @param {number} correctIndex
     * @param {number|null} selectedIndex
     */
    revealAnswers(grid, correctIndex, selectedIndex) {
        const btns = grid.querySelectorAll('.answer-btn');
        btns.forEach((btn, i) => {
            btn.disabled = true;
            if (i === correctIndex) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('incorrect');
            }
            if (i === selectedIndex && i !== correctIndex) {
                btn.style.outline = '4px solid #E74C3C';
                btn.style.outlineOffset = '-4px';
            }
        });
    },

    /**
     * Bygg ein leaderboard-tabell
     * @param {Array} leaderboard - [{rank, name, score}]
     * @param {number} [maxRows=10]
     * @returns {HTMLElement}
     */
    createLeaderboard(leaderboard, maxRows = 10) {
        const container = document.createElement('div');
        container.className = 'leaderboard';

        const rows = leaderboard.slice(0, maxRows);
        rows.forEach((p, i) => {
            const row = document.createElement('div');
            row.className = 'lb-row';
            if (i === 0) row.classList.add('gold');
            else if (i === 1) row.classList.add('silver');
            else if (i === 2) row.classList.add('bronze');

            const medals = ['🥇', '🥈', '🥉'];
            const rankText = i < 3 ? medals[i] : `${p.rank}.`;

            row.innerHTML = `
                <span class="lb-rank">${rankText}</span>
                <span class="lb-name">${this.escapeHTML(p.name)}</span>
                <span class="lb-score">${p.score}</span>
            `;
            container.appendChild(row);
        });

        return container;
    },

    /**
     * Bygg podium (topp 3)
     * @param {Array} leaderboard
     * @returns {HTMLElement}
     */
    createPodium(leaderboard) {
        const podium = document.createElement('div');
        podium.className = 'podium';

        const places = [
            { index: 1, cls: 'second', medal: '🥈' },
            { index: 0, cls: 'first',  medal: '🥇' },
            { index: 2, cls: 'third',  medal: '🥉' }
        ];

        places.forEach(({ index, cls, medal }) => {
            const p = leaderboard[index];
            const place = document.createElement('div');
            place.className = `podium-place ${cls}`;

            if (p) {
                place.innerHTML = `
                    <div class="podium-medal">${medal}</div>
                    <div class="podium-name">${this.escapeHTML(p.name)}</div>
                    <div class="podium-score">${p.score} poeng</div>
                `;
            } else {
                place.innerHTML = `<div class="podium-medal">${medal}</div><div class="podium-name">—</div>`;
            }

            podium.appendChild(place);
        });

        return podium;
    },

    /**
     * Start ein nedteljing og oppdater eit element
     * @param {string} elementId
     * @param {number} seconds
     * @param {function} onTick - callback(remaining)
     * @param {function} onDone - callback()
     * @returns {{ stop: function }} kontrollobjekt
     */
    startTimer(elementId, seconds, onTick, onDone) {
        const el = document.getElementById(elementId);
        let remaining = seconds;
        let intervalId = null;

        const update = () => {
            if (el) {
                el.textContent = QuizEngine.formatTime(remaining);
                el.classList.toggle('warning', remaining <= 5);
            }
            if (onTick) onTick(remaining);
        };

        update();

        intervalId = setInterval(() => {
            remaining--;
            update();
            if (remaining <= 0) {
                clearInterval(intervalId);
                if (onDone) onDone();
            }
        }, 1000);

        return {
            stop() {
                clearInterval(intervalId);
            },
            getRemaining() {
                return remaining;
            }
        };
    },

    /**
     * Generer ein enkel QR-kode som canvas (utan eksterne bibliotek)
     * Forenkla: viser berre romkoden som stor tekst med instruksjonar
     * @param {string} roomCode
     * @param {string} url
     * @returns {HTMLElement}
     */
    createRoomDisplay(roomCode, url) {
        const box = document.createElement('div');
        box.className = 'room-code-box';
        box.innerHTML = `
            <div style="font-weight:900;font-size:0.9rem;text-transform:uppercase;letter-spacing:1px;">Romkode</div>
            <div class="room-code">${this.escapeHTML(roomCode)}</div>
            <div class="text-body" style="font-size:0.9rem;margin-top:8px;">
                Gå til <strong>${this.escapeHTML(url)}</strong><br>
                og skriv inn koden over
            </div>
        `;
        return box;
    },

    /**
     * Vis ei kort melding (toast)
     * @param {string} text
     * @param {string} [type='info'] - 'info', 'success', 'error'
     */
    toast(text, type = 'info') {
        const existing = document.getElementById('fk-toast');
        if (existing) existing.remove();

        const colors = { info: '#3498DB', success: '#2ECC71', error: '#E74C3C' };
        const toast = document.createElement('div');
        toast.id = 'fk-toast';
        toast.textContent = text;
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: colors[type] || colors.info,
            color: '#fff',
            border: '3px solid #000',
            boxShadow: '4px 4px 0 #000',
            padding: '12px 28px',
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontWeight: '900',
            fontSize: '0.95rem',
            zIndex: '9999',
            transition: 'opacity 0.3s'
        });

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    /**
     * Escape HTML for sikker rendering
     * @param {string} str
     * @returns {string}
     */
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Lag ein spelar-chip
     * @param {string} name
     * @param {boolean} isHost
     * @returns {HTMLElement}
     */
    createPlayerChip(name, isHost = false) {
        const chip = document.createElement('span');
        chip.className = 'player-chip' + (isHost ? ' host' : '');
        chip.textContent = name;
        return chip;
    },

    /**
     * Oppdater spelar-liste
     * @param {string} containerId
     * @param {Array} players - [{name, ...}]
     */
    updatePlayerList(containerId, players) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        if (players.length === 0) {
            container.innerHTML = '<div class="text-body text-center" style="padding:20px;color:#666;">Ingen spelarar tilkopla enno</div>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'player-list';
        players.forEach(p => {
            list.appendChild(this.createPlayerChip(p.name));
        });
        container.appendChild(list);
    }
};
