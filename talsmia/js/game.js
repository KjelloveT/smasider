const Game = (function () {
    const LARGE_POOL_BASE = [25, 50, 75, 100, 150];
    const SMALL_POOL_BASE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let availableLarge = [];
    let availableSmall = [];

    let currentNumbers = [];
    let currentTarget = 0;

    let timeLeft = 0;
    let timerInterval = null;
    let isPlaying = false;
    let onTimeUpdate = null;
    let onGameEnd = null;

    function resetPools() {
        availableLarge = [...LARGE_POOL_BASE];
        availableSmall = [...SMALL_POOL_BASE];
    }

    function drawFromPool(pool) {
        if (pool.length === 0) return null;
        const idx = Math.floor(Math.random() * pool.length);
        const [picked] = pool.splice(idx, 1);
        return picked;
    }

    function generateTarget() {
        currentTarget = Math.floor(Math.random() * 900) + 100;
        return currentTarget;
    }

    function resetNumbers() {
        currentNumbers = [];
        resetPools();
    }

    function addNumber(type) {
        if (currentNumbers.length >= 6) return false;

        let value = null;
        if (type === 'large') {
            value = drawFromPool(availableLarge);
        } else {
            value = drawFromPool(availableSmall);
        }

        if (value === null || value === undefined) return false;
        currentNumbers.push(value);
        return value;
    }

    function removeLastNumber() {
        if (currentNumbers.length === 0) return null;
        const removed = currentNumbers.pop();

        if (LARGE_POOL_BASE.includes(removed)) {
            availableLarge.push(removed);
        } else {
            availableSmall.push(removed);
        }

        return removed;
    }

    function generateRound(largeCount = 2) {
        resetNumbers();
        generateTarget();

        const safeLargeCount = Math.max(0, Math.min(6, largeCount));
        const smallCount = 6 - safeLargeCount;

        for (let i = 0; i < safeLargeCount; i++) {
            addNumber('large');
        }
        for (let i = 0; i < smallCount; i++) {
            addNumber('small');
        }

        currentNumbers.sort((a, b) => a - b);

        return {
            numbers: [...currentNumbers],
            target: currentTarget
        };
    }

    function tokenizeExpression(expression) {
        const compact = (expression || '').replace(/\s+/g, '');
        if (!compact) return null;

        const tokens = compact.match(/\d+|[()+\-*/]/g);
        if (!tokens || tokens.join('') !== compact) return null;
        return tokens;
    }

    function buildCounter(values) {
        const map = new Map();
        values.forEach((v) => map.set(v, (map.get(v) || 0) + 1));
        return map;
    }

    function hasValidNumberUsage(used, available) {
        const usedCount = buildCounter(used);
        const availableCount = buildCounter(available);

        for (const [num, count] of usedCount.entries()) {
            if ((availableCount.get(num) || 0) < count) {
                return false;
            }
        }
        return true;
    }

    function parseAndEvaluate(expression, availableNumbers) {
        const tokens = tokenizeExpression(expression);
        if (!tokens) {
            return { valid: false, reason: 'Ugyldig teikn i uttrykket' };
        }

        let index = 0;
        const usedNumbers = [];

        function current() {
            return tokens[index];
        }

        function next() {
            index++;
        }

        function parseFactor() {
            const token = current();

            if (token === '(') {
                next();
                const inside = parseExpr();
                if (current() !== ')') {
                    throw new Error('Manglar avsluttande parentes');
                }
                next();
                return inside;
            }

            if (!/^\d+$/.test(token || '')) {
                throw new Error('Forventa eit tal');
            }

            const value = parseInt(token, 10);
            if (value <= 0) {
                throw new Error('Berre positive tal er tillatne');
            }

            usedNumbers.push(value);
            next();
            return value;
        }

        function parseTerm() {
            let value = parseFactor();

            while (current() === '*' || current() === '/') {
                const op = current();
                next();
                const right = parseFactor();

                if (op === '*') {
                    value = value * right;
                } else {
                    if (right === 0 || value % right !== 0) {
                        throw new Error('Divisjon må gi heiltal');
                    }
                    value = value / right;
                }

                if (!Number.isInteger(value) || value <= 0) {
                    throw new Error('Mellomsteg må vere positive heiltal');
                }
            }

            return value;
        }

        function parseExpr() {
            let value = parseTerm();

            while (current() === '+' || current() === '-') {
                const op = current();
                next();
                const right = parseTerm();

                if (op === '+') {
                    value = value + right;
                } else {
                    if (value - right <= 0) {
                        throw new Error('Subtraksjon må gi positivt heiltal');
                    }
                    value = value - right;
                }

                if (!Number.isInteger(value) || value <= 0) {
                    throw new Error('Mellomsteg må vere positive heiltal');
                }
            }

            return value;
        }

        try {
            const value = parseExpr();
            if (index !== tokens.length) {
                return { valid: false, reason: 'Ufullstendig eller ugyldig uttrykk' };
            }

            if (!hasValidNumberUsage(usedNumbers, availableNumbers)) {
                return { valid: false, reason: 'Du brukte tal som ikkje er i runden, eller for mange gonger' };
            }

            return {
                valid: true,
                value,
                usedNumbers
            };
        } catch (err) {
            return {
                valid: false,
                reason: err.message || 'Ugyldig uttrykk'
            };
        }
    }

    function calculateScore(diff) {
        return Math.max(0, 100 - diff);
    }

    function validateExpression(expression, target = currentTarget) {
        const parsed = parseAndEvaluate(expression, currentNumbers);
        if (!parsed.valid) {
            return parsed;
        }

        const diff = Math.abs(target - parsed.value);
        return {
            valid: true,
            value: parsed.value,
            usedNumbers: parsed.usedNumbers,
            diff,
            score: calculateScore(diff)
        };
    }

    function validateMultipleExpressions(expressions, target = currentTarget) {
        const unique = [...new Set(expressions.map((e) => e.trim()).filter(Boolean))];
        const results = unique.map((expr) => {
            const result = validateExpression(expr, target);
            return {
                expression: expr,
                ...result
            };
        });

        results.sort((a, b) => {
            const ad = a.valid ? a.diff : Number.POSITIVE_INFINITY;
            const bd = b.valid ? b.diff : Number.POSITIVE_INFINITY;
            if (ad !== bd) return ad - bd;
            return a.expression.length - b.expression.length;
        });

        return results;
    }

    function solveRound(target = currentTarget, maxSolutions = 10) {
        if (currentNumbers.length === 0) {
            return { exact: false, bestDiff: null, bestValue: null, solutions: [] };
        }

        let bestDiff = Number.POSITIVE_INFINITY;
        let bestValue = null;
        const bestSolutions = [];
        const solutionExpr = new Set();
        const memo = new Set();

        function addBest(candidate) {
            const { expression: expr, value, steps = [] } = candidate;
            const diff = Math.abs(target - value);
            const simplicity = steps.length;

            if (diff < bestDiff) {
                bestDiff = diff;
                bestValue = value;
                bestSolutions.length = 0;
                solutionExpr.clear();
            }

            if (diff === bestDiff && !solutionExpr.has(expr)) {
                solutionExpr.add(expr);
                bestSolutions.push({ expression: expr, value, diff, simplicity, steps: [...steps] });
            }
        }

        function signature(items) {
            return items.map((x) => x.value).sort((a, b) => a - b).join(',');
        }

        function search(items) {
            items.forEach((item) => addBest(item));

            if (items.length <= 1) {
                return;
            }

            const sig = signature(items);
            if (memo.has(sig)) return;
            memo.add(sig);

            for (let i = 0; i < items.length; i++) {
                for (let j = i + 1; j < items.length; j++) {
                    const a = items[i];
                    const b = items[j];
                    const rest = items.filter((_, idx) => idx !== i && idx !== j);

                    const candidates = [];

                    candidates.push({
                        value: a.value + b.value,
                        expression: `(${a.expression}+${b.expression})`,
                        steps: [...a.steps, ...b.steps, `${a.value}+${b.value}=${a.value + b.value}`]
                    });

                    if (a.value !== 1 && b.value !== 1) {
                        candidates.push({
                            value: a.value * b.value,
                            expression: `(${a.expression}*${b.expression})`,
                            steps: [...a.steps, ...b.steps, `${a.value}*${b.value}=${a.value * b.value}`]
                        });
                    }

                    if (a.value > b.value) {
                        candidates.push({
                            value: a.value - b.value,
                            expression: `(${a.expression}-${b.expression})`,
                            steps: [...a.steps, ...b.steps, `${a.value}-${b.value}=${a.value - b.value}`]
                        });
                    }
                    if (b.value > a.value) {
                        candidates.push({
                            value: b.value - a.value,
                            expression: `(${b.expression}-${a.expression})`,
                            steps: [...a.steps, ...b.steps, `${b.value}-${a.value}=${b.value - a.value}`]
                        });
                    }

                    if (b.value !== 0 && b.value !== 1 && a.value % b.value === 0) {
                        candidates.push({
                            value: a.value / b.value,
                            expression: `(${a.expression}/${b.expression})`,
                            steps: [...a.steps, ...b.steps, `${a.value}/${b.value}=${a.value / b.value}`]
                        });
                    }
                    if (a.value !== 0 && a.value !== 1 && b.value % a.value === 0) {
                        candidates.push({
                            value: b.value / a.value,
                            expression: `(${b.expression}/${a.expression})`,
                            steps: [...a.steps, ...b.steps, `${b.value}/${a.value}=${b.value / a.value}`]
                        });
                    }

                    for (const c of candidates) {
                        if (!Number.isInteger(c.value) || c.value <= 0) continue;
                        search([...rest, c]);
                    }
                }
            }
        }

        const start = currentNumbers.map((n) => ({ value: n, expression: String(n), steps: [] }));
        search(start);

        bestSolutions.sort((a, b) => {
            if (a.diff !== b.diff) return a.diff - b.diff;
            if (a.simplicity !== b.simplicity) return a.simplicity - b.simplicity;
            return a.expression.length - b.expression.length;
        });

        return {
            exact: bestDiff === 0,
            bestDiff,
            bestValue,
            solutions: bestSolutions.slice(0, maxSolutions)
        };
    }

    function startTimer(seconds) {
        timeLeft = seconds;
        isPlaying = true;

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        if (!Number.isFinite(seconds)) {
            if (onTimeUpdate) onTimeUpdate(Infinity);
            return;
        }

        if (onTimeUpdate) onTimeUpdate(timeLeft);

        timerInterval = setInterval(() => {
            timeLeft -= 1;
            if (onTimeUpdate) onTimeUpdate(timeLeft);

            if (timeLeft <= 0) {
                stopGame();
                if (onGameEnd) onGameEnd();
            }
        }, 1000);
    }

    function stopGame() {
        isPlaying = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function setOnTimeUpdate(callback) {
        onTimeUpdate = callback;
    }

    function setOnGameEnd(callback) {
        onGameEnd = callback;
    }

    function getCurrentNumbers() {
        return [...currentNumbers];
    }

    function getCurrentTarget() {
        return currentTarget;
    }

    function getTimeLeft() {
        return timeLeft;
    }

    function isGamePlaying() {
        return isPlaying;
    }

    resetPools();

    return {
        generateTarget,
        resetNumbers,
        addNumber,
        removeLastNumber,
        generateRound,
        validateExpression,
        validateMultipleExpressions,
        solveRound,
        calculateScore,
        startTimer,
        stopGame,
        setOnTimeUpdate,
        setOnGameEnd,
        getCurrentNumbers,
        getCurrentTarget,
        getTimeLeft,
        isGamePlaying
    };
})();
