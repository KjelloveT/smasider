const UI = (function () {
    let screens = {};
    let timerEl;

    function hasSingleOuterWrapper(expr) {
        if (!expr || expr.length < 2) return false;
        if (expr[0] !== '(' || expr[expr.length - 1] !== ')') return false;

        let depth = 0;
        for (let i = 0; i < expr.length; i++) {
            const ch = expr[i];
            if (ch === '(') depth++;
            if (ch === ')') depth--;

            if (depth === 0 && i < expr.length - 1) {
                return false;
            }
        }
        return true;
    }

    function formatExpression(expr) {
        if (!expr) return expr;

        let formatted = expr.replace(/\s+/g, '');

        while (hasSingleOuterWrapper(formatted)) {
            formatted = formatted.slice(1, -1);
        }

        formatted = formatted.replace(/\*/g, '×').replace(/\//g, '÷');
        formatted = formatted.replace(/([+\-×÷])/g, ' $1 ');
        formatted = formatted.replace(/\s+/g, ' ').trim();

        return formatted;
    }

    function formatStep(step) {
        if (!step) return '';
        let formatted = step.replace(/\*/g, '×').replace(/\//g, '÷');
        formatted = formatted.replace(/([+\-×÷=])/g, ' $1 ');
        return formatted.replace(/\s+/g, ' ').trim();
    }

    function init() {
        screens = {
            menu: document.getElementById('screen-menu'),
            game: document.getElementById('screen-game'),
            manual: document.getElementById('screen-manual'),
            classroom: document.getElementById('screen-classroom'),
            result: document.getElementById('screen-result')
        };
        timerEl = document.getElementById('timer');
    }

    function showScreen(name) {
        Object.values(screens).forEach((screen) => {
            if (screen) screen.classList.remove('active');
        });
        if (screens[name]) screens[name].classList.add('active');
    }

    function updateTimer(seconds) {
        if (!timerEl) return;
        timerEl.textContent = Number.isFinite(seconds) ? String(seconds) : '∞';
        timerEl.classList.remove('warning', 'danger');
        if (!Number.isFinite(seconds)) return;
        if (seconds <= 10) timerEl.classList.add('danger');
        else if (seconds <= 20) timerEl.classList.add('warning');
    }

    function showNumbers(containerId, numbers) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        numbers.forEach((n) => {
            const tile = document.createElement('div');
            tile.className = 'number-tile';
            tile.textContent = String(n);
            container.appendChild(tile);
        });
    }

    function renderSolverList(solverList, solver) {
        if (!solverList) return;

        solverList.innerHTML = '';
        if (!solver || !solver.solutions || solver.solutions.length === 0) {
            solverList.innerHTML = '<p>Ingen løysing funnen.</p>';
            return;
        }

        solver.solutions.forEach((s) => {
            const item = document.createElement('div');
            item.className = 'solution-item';

            const summary = document.createElement('div');
            summary.className = 'solution-summary';
            summary.textContent = `${formatExpression(s.expression)} = ${s.value} (avvik ${s.diff}, enkelheit ${s.simplicity} steg)`;
            item.appendChild(summary);

            if (Array.isArray(s.steps) && s.steps.length > 0) {
                const stepsList = document.createElement('div');
                stepsList.className = 'solution-steps';

                s.steps.forEach((step, idx) => {
                    const stepBox = document.createElement('div');
                    const isLast = idx === s.steps.length - 1;
                    stepBox.className = `solution-step-box${isLast ? ' solution-step-final' : ''}`;
                    stepBox.textContent = formatStep(step);
                    stepsList.appendChild(stepBox);

                    if (!isLast) {
                        const arrow = document.createElement('div');
                        arrow.className = 'solution-step-arrow';
                        arrow.textContent = '➜';
                        stepsList.appendChild(arrow);
                    }
                });

                item.appendChild(stepsList);
            }

            solverList.appendChild(item);
        });
    }

    function showSolverInContainer(containerId, solver) {
        const target = document.getElementById(containerId);
        renderSolverList(target, solver);
    }

    function setTarget(containerId, target) {
        const targetEl = document.getElementById(containerId);
        if (!targetEl) return;
        targetEl.textContent = String(target);
    }

    function updateStats() {
        const highScore = Storage.getHighScore();
        const statEl = document.getElementById('stat-highscore');
        if (statEl) statEl.textContent = String(highScore);
    }

    function showHistory() {
        const list = document.getElementById('history-list');
        if (!list) return;

        const history = Storage.getHistory();
        list.innerHTML = '';

        if (history.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:#666">Ingen rundar lagra ennå</p>';
            return;
        }

        history.forEach((entry) => {
            const row = document.createElement('div');
            row.className = 'history-item';
            row.innerHTML = `
                <span><strong>${formatExpression(entry.expression)}</strong> = ${entry.value}</span>
                <span>Mål ${entry.target} | avvik ${entry.diff} | ${entry.score}p</span>
            `;
            list.appendChild(row);
        });
    }

    function showResult(resultData) {
        const {
            expression,
            valid,
            value,
            diff,
            score,
            target,
            solver
        } = resultData;

        const yourExpr = document.getElementById('your-expression');
        const yourScore = document.getElementById('your-score');
        const targetEl = document.getElementById('result-target');
        const valueEl = document.getElementById('result-value');
        const diffEl = document.getElementById('result-diff');
        const pointsEl = document.getElementById('result-points');
        const solverList = document.getElementById('possible-solutions');

        if (targetEl) targetEl.textContent = String(target);

        if (yourExpr) {
            yourExpr.textContent = formatExpression(expression) || '-';
            yourExpr.className = valid ? 'your-expression' : 'your-expression invalid';
        }

        if (yourScore) {
            if (valid) {
                yourScore.textContent = `Sterk runde! Du kom ${diff === 0 ? 'heilt nøyaktig' : `berre ${diff} unna`} målet.`;
                yourScore.className = 'result-note result-note-ok';
            } else {
                yourScore.textContent = 'Ugyldig uttrykk. Sjekk talbruk og at alle mellomsteg er positive heiltal.';
                yourScore.className = 'result-note result-note-bad';
            }
        }

        if (valueEl) valueEl.textContent = valid ? String(value) : '-';
        if (diffEl) diffEl.textContent = valid ? String(diff) : '-';
        if (pointsEl) pointsEl.textContent = valid ? String(score) : '0';

        renderSolverList(solverList, solver);

        const solverHead = document.getElementById('solver-headline');
        if (solverHead && solver) {
            if (solver.exact) {
                solverHead.textContent = 'Moglege eksakte løysingar';
            } else {
                solverHead.textContent = `Beste løysingar (nærast, avvik ${solver.bestDiff ?? '-'})`;
            }
        }

        updateStats();
    }

    return {
        init,
        showScreen,
        updateTimer,
        showNumbers,
        setTarget,
        updateStats,
        showHistory,
        showResult,
        showSolverInContainer
    };
})();
