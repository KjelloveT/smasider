// Heite Stavrim — Rendering av spel-, svar-, og resultat-UI

HeiteStavrimGame.prototype.populateCustomCategoriesSelect = function () {
    const custom = HeiteStavrimStorage.getCustomCategories();
    this.el.customCatsSelect.innerHTML = custom.map(cat =>
        `<option value="${this.escapeHtml(cat)}">${this.escapeHtml(cat)}</option>`
    ).join('');
};

HeiteStavrimGame.prototype.renderTeamInputs = function () {
    const count = parseInt(this.el.teamCount.value, 10);
    this.config.teamCount = count;
    const saved = this.savedTeamNames || [];
    const existing = [...this.el.teamInputs.querySelectorAll('.team-input-row')].map(row => ({
        name: row.querySelector('.team-name-input').value,
        color: row.querySelector('.team-color-input').value
    }));

    this.el.teamInputs.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const prev = existing[i] || saved[i];
        const name = prev?.name || `Team ${i + 1}`;
        const color = prev?.color || DEFAULT_TEAM_COLORS[i % DEFAULT_TEAM_COLORS.length];
        const row = document.createElement('div');
        row.className = 'team-input-row';
        row.innerHTML = `
            <input type="color" class="team-color-input" value="${color}" aria-label="Lagsfarge ${i + 1}">
            <input type="text" class="team-name-input" value="${this.escapeHtml(name)}" maxlength="30" placeholder="Lagsnamn" aria-label="Lagsnamn ${i + 1}">
        `;
        this.el.teamInputs.appendChild(row);
    }
};

HeiteStavrimGame.prototype.collectTeams = function () {
    const rows = [...this.el.teamInputs.querySelectorAll('.team-input-row')];
    return rows.map((row, i) => ({
        id: i,
        name: row.querySelector('.team-name-input').value.trim() || `Team ${i + 1}`,
        color: row.querySelector('.team-color-input').value,
        totalScore: this.teams[i]?.totalScore || 0
    }));
};

HeiteStavrimGame.prototype.renderLetters = function () {
    this.el.lettersDisplay.innerHTML = this.round.letters
        .map(L => `<div class="letter-box">${L}</div>`).join('');
};

HeiteStavrimGame.prototype.renderCategories = function () {
    this.el.categoriesDisplay.innerHTML = this.round.categories
        .map(c => `<div class="category-item">${this.escapeHtml(c)}</div>`).join('');
};

HeiteStavrimGame.prototype.renderTeamScores = function () {
    this.el.teamScores.innerHTML = this.teams.map(t => `
        <div class="team-score-box" style="border-left-color:${t.color};">
            <div class="team-score-name">${this.escapeHtml(t.name)}</div>
            <div class="team-score-points">${t.totalScore}</div>
        </div>
    `).join('');
};

HeiteStavrimGame.prototype.renderAnswerReview = function () {
    // Reset write-mode answers structure
    this.round.answers = {};
    this.teams.forEach(t => {
        this.round.categories.forEach((cat, ci) => {
            this.round.letters.forEach((L, li) => {
                const key = `${t.id}-${ci}-${li}`;
                this.round.answers[key] = { text: '', status: null };
            });
        });
    });

    // Build write-mode UI
    this.el.writeAnswers.innerHTML = this.teams.map(t => {
        const rows = this.round.categories.map((cat, ci) => {
            return this.round.letters.map((L, li) => {
                const key = `${t.id}-${ci}-${li}`;
                return `
                    <div class="answer-row" data-key="${key}">
                        <div class="category-cell"><span class="letter-tag">${L}</span>${this.escapeHtml(cat)}</div>
                        <input type="text" class="answer-input" data-key="${key}" placeholder="Svar...">
                        <div class="answer-status">
                            <button class="status-btn unique" data-key="${key}" data-status="unique" type="button">3p</button>
                            <button class="status-btn duplicate" data-key="${key}" data-status="duplicate" type="button">1p</button>
                            <button class="status-btn invalid" data-key="${key}" data-status="invalid" type="button">0p</button>
                        </div>
                    </div>
                `;
            }).join('');
        }).join('');
        return `
            <div class="team-answers-section" style="border-left-color:${t.color};">
                <div class="team-answers-header">
                    <span>${this.escapeHtml(t.name)}</span>
                    <span class="team-running-total" data-team="${t.id}">0 p denne runden</span>
                </div>
                ${rows}
            </div>
        `;
    }).join('');

    // Build direct-points UI
    this.el.directPoints.innerHTML = `
        <div class="box2">
            <div class="direct-points-grid">
                ${this.teams.map(t => `
                    <div class="team-points-input" style="border-left-color:${t.color};">
                        <label>${this.escapeHtml(t.name)}</label>
                        <div class="points-control">
                            <button class="btn points-btn points-minus" data-team="${t.id}" type="button" aria-label="Trekk frå poeng">−</button>
                            <input type="number" class="direct-points-field" data-team="${t.id}" value="0" step="1">
                            <button class="btn points-btn points-plus" data-team="${t.id}" type="button" aria-label="Legg til poeng">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Reset answer mode visibility
    const writeRadio = document.querySelector('input[name="answerMode"][value="write"]');
    if (writeRadio) writeRadio.checked = true;
    this.el.writeAnswers.style.display = '';
    this.el.directPoints.style.display = 'none';
    this.syncRadioStyles();

    // Check for duplicates after rendering
    this.checkDuplicates();

    // Render individual mode as well
    this.renderIndividualMode();
};

HeiteStavrimGame.prototype.renderIndividualMode = function () {
    const ci = this.individualMode.catIndex;
    const li = this.individualMode.letterIndex;
    const cat = this.round.categories[ci];
    const letter = this.round.letters[li];

    const totalCats = this.round.categories.length;
    const totalLetters = this.round.letters.length;
    const currentIndex = ci * totalLetters + li;
    const totalItems = totalCats * totalLetters;

    const teamRows = this.teams.map(t => {
        const key = `${t.id}-${ci}-${li}`;
        const answer = this.round.answers[key] || { text: '', status: null };
        return `
            <div class="individual-team-row" data-key="${key}" style="border-left-color:${t.color};">
                <span class="team-name">${this.escapeHtml(t.name)}</span>
                <input type="text" class="answer-input individual-input" data-key="${key}"
                       value="${this.escapeHtml(answer.text)}" placeholder="Svar...">
                <div class="answer-status">
                    <button class="status-btn unique" data-key="${key}" data-status="unique" type="button">3p</button>
                    <button class="status-btn duplicate" data-key="${key}" data-status="duplicate" type="button">1p</button>
                    <button class="status-btn invalid" data-key="${key}" data-status="invalid" type="button">0p</button>
                </div>
            </div>
        `;
    }).join('');

    this.el.individualAnswers.innerHTML = `
        <div class="box2">
            <div class="individual-header">
                <div class="individual-nav">
                    <button class="btn nav-btn" id="navPrev" ${currentIndex === 0 ? 'disabled' : ''} aria-label="Forrige kategori-bokstav">◀ Forrige</button>
                    <div class="individual-info">
                        <span class="letter-tag">${letter}</span>
                        <span class="category-name">${this.escapeHtml(cat)}</span>
                        <span class="progress">${currentIndex + 1} / ${totalItems}</span>
                    </div>
                    <button class="btn nav-btn" id="navNext" ${currentIndex === totalItems - 1 ? 'disabled' : ''} aria-label="Neste kategori-bokstav">Neste ▶</button>
                </div>
            </div>
            <div class="individual-teams">
                ${teamRows}
            </div>
        </div>
    `;

    // Attach navigation events
    document.getElementById('navPrev').addEventListener('click', () => this.navigateIndividual(-1));
    document.getElementById('navNext').addEventListener('click', () => this.navigateIndividual(1));

    // Attach input events
    this.el.individualAnswers.querySelectorAll('.individual-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const key = e.target.dataset.key;
            if (this.round.answers[key]) {
                this.round.answers[key].text = e.target.value;
            } else {
                this.round.answers[key] = { text: e.target.value, status: null };
            }
            this.checkDuplicates();
        });
    });

    // Attach status button events
    this.el.individualAnswers.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = e.target.dataset.key;
            const status = e.target.dataset.status;
            if (!this.round.answers[key]) return;

            const current = this.round.answers[key].status;
            const newStatus = current === status ? null : status;
            this.round.answers[key].status = newStatus;

            const row = e.target.closest('.individual-team-row');
            row.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
            if (newStatus) {
                row.querySelector(`.status-btn[data-status="${newStatus}"]`).classList.add('active');
            }
        });
    });

    // Set active status buttons
    this.teams.forEach(t => {
        const key = `${t.id}-${ci}-${li}`;
        const answer = this.round.answers[key];
        if (answer && answer.status) {
            const row = this.el.individualAnswers.querySelector(`.individual-team-row[data-key="${key}"]`);
            if (row) {
                row.querySelector(`.status-btn[data-status="${answer.status}"]`).classList.add('active');
            }
        }
    });
};

HeiteStavrimGame.prototype.renderResults = function () {
    const sorted = [...this.teams].sort((a, b) => b.totalScore - a.totalScore);
    const topScore = sorted[0]?.totalScore ?? 0;

    this.el.finalScores.innerHTML = sorted.map((t, i) => {
        const isWinner = t.totalScore === topScore && topScore > 0;
        const round = this.round.roundScores[t.id] || 0;
        return `
            <div class="result-item ${isWinner ? 'winner' : ''}" style="border-left-color:${t.color};">
                <div class="result-rank">${i + 1}.</div>
                <div class="result-name">${this.escapeHtml(t.name)}</div>
                <div class="result-score-block">
                    <div class="result-round">+${round} denne runden</div>
                    <div class="result-score">${t.totalScore}</div>
                </div>
            </div>
        `;
    }).join('');
};
