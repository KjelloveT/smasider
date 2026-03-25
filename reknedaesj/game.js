const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let gameRunning = false;
let gamePaused = false;
let score = 0;
let distance = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let statsMenuFocus = 0;
const RD_HS_KEY = 'rdHS';
let basePointsPerFrame = 0.1;
let pointMultiplier = 1;
let multiplierEndTime = 0;
let gameSpeed = 5;
let gravity = 0.8;
let difficulty = 'grade2';
let enabledMathTypes = ['add', 'subtract'];

const difficultySettings = {
    grade2:  { speed: 4, spawnRate: 80, gravity: 0.6, pointsMultiplier: 1.0, mathLevel: 1, label: '2. klasse' },
    grade4:  { speed: 4, spawnRate: 80, gravity: 0.6, pointsMultiplier: 1.0, mathLevel: 2, label: '4-5. klasse' },
    grade6:  { speed: 4, spawnRate: 80, gravity: 0.6, pointsMultiplier: 1.0, mathLevel: 3, label: '6-7. klasse' },
    grade8:  { speed: 4, spawnRate: 80, gravity: 0.6, pointsMultiplier: 1.0, mathLevel: 4, label: '8-9. klasse' },
    grade10: { speed: 4, spawnRate: 80, gravity: 0.6, pointsMultiplier: 1.0, mathLevel: 5, label: '10. klasse' }
};

const player = {
    x: 150,
    y: 0,
    width: 64,
    height: 64,
    velocityY: 0,
    jumping: false,
    grounded: false,
    gliding: false,
    jumpsLeft: 2,
    maxJumps: 2,
    animFrame: 0,
    animTimer: 0,
    sprite: null
};

const baseGroundY = () => canvas.height - 100;

let obstacles = [];
let collectibles = [];
let mathIcons = [];
let groundSegments = [];
let platforms = [];
let spawnTimer = 0;
let mathSpawnTimer = 0;
let backgroundOffset = 0;
let currentMathProblem = null;
let mathRewardType = null;

const sprites = {
    character: new Image(),
    tiles: new Image(),
    enemies: new Image()
};

sprites.character.src = 'resources/Spritesheets/spritesheet-characters-default.png';
sprites.tiles.src = 'resources/Spritesheets/spritesheet-tiles-default.png';
sprites.enemies.src = 'resources/Spritesheets/spritesheet-enemies-default.png';

const spriteData = {
    character: {
        idle: { x: 645, y: 0, width: 128, height: 128 },
        jump: { x: 774, y: 0, width: 128, height: 128 },
        walk_a: { x: 0, y: 129, width: 128, height: 128 },
        walk_b: { x: 129, y: 129, width: 128, height: 128 },
        duck: { x: 258, y: 0, width: 128, height: 128 }
    },
    tiles: {
        spike: { x: 715, y: 0, width: 64, height: 64 },
        block_red: { x: 650, y: 0, width: 64, height: 64 },
        block_blue: { x: 0, y: 0, width: 64, height: 64 },
        coin_gold: { x: 0, y: 130, width: 64, height: 64 },
        gem_blue: { x: 195, y: 195, width: 64, height: 64 },
        gem_red: { x: 325, y: 195, width: 64, height: 64 },
        cactus: { x: 910, y: 65, width: 64, height: 64 },
        bomb: { x: 195, y: 65, width: 64, height: 64 },
        fireball: { x: 715, y: 130, width: 64, height: 64 },
        terrain_top:       { x: 975,  y: 975,  width: 64, height: 64 },
        terrain_top_left:  { x: 1040, y: 975,  width: 64, height: 64 },
        terrain_top_right: { x: 1105, y: 975,  width: 64, height: 64 },
        terrain_center:    { x: 780,  y: 975,  width: 64, height: 64 },
        terrain_ramp_a:    { x: 845,  y: 1040, width: 64, height: 64 },
        terrain_ramp_b:    { x: 910,  y: 1040, width: 64, height: 64 },
        plat_left:         { x: 325,  y: 1040, width: 64, height: 64 },
        plat_mid:          { x: 390,  y: 1040, width: 64, height: 64 },
        plat_right:        { x: 585,  y: 1040, width: 64, height: 64 }
    },
    enemies: {
        saw_a: { x: 455, y: 195, width: 64, height: 64 },
        saw_b: { x: 0, y: 260, width: 64, height: 64 },
        slime: { x: 195, y: 325, width: 64, height: 64 },
        bee_a: { x: 195, y: 0, width: 64, height: 64 },
        bee_b: { x: 260, y: 0, width: 64, height: 64 }
    }
};

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'jump':
            oscillator.frequency.value = 400;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'hit':
            oscillator.frequency.value = 100;
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'collect':
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'correct':
            oscillator.frequency.value = 600;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
    }
}

let keys = {};
document.addEventListener('keydown', (e) => {
    if (!keys[e.code] && (e.code === 'Space' || e.code === 'ArrowUp') && gameRunning && !gamePaused && !mathModalOpen) {
        jump();
        e.preventDefault();
    }

    // Start screen: Enter/Space starts game
    if (!gameRunning && !mathModalOpen) {
        const startScreen = document.getElementById('startScreen');
        const statsScreen = document.getElementById('statsScreen');
        if (startScreen && !startScreen.classList.contains('hide')) {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                showSettings();
            }
        } else if (statsScreen && !statsScreen.classList.contains('hide')) {
            if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
                e.preventDefault();
                statsMenuFocus = (statsMenuFocus - 1 + 3) % 3;
                updateStatsFocus();
            } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
                e.preventDefault();
                statsMenuFocus = (statsMenuFocus + 1) % 3;
                updateStatsFocus();
            } else if (e.code === 'Enter') {
                e.preventDefault();
                const btns = document.querySelectorAll('.stat-btn');
                if (btns[statsMenuFocus]) btns[statsMenuFocus].click();
            }
        }
    }

    if (mathModalOpen) {
        if (e.code === 'ArrowUp') {
            e.preventDefault();
            moveCharacterSelection('up');
        } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            moveCharacterSelection('down');
        } else if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            selectCurrentOption();
        }
    }
    
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function jump() {
    if (player.jumpsLeft > 0) {
        player.velocityY = -15;
        player.jumping = true;
        player.grounded = false;
        player.jumpsLeft--;
        playSound('jump');
    }
}

function showSettings() {
    document.getElementById('startScreen').classList.add('hide');
    document.getElementById('settingsScreen').classList.remove('hide');
}

function backToStart() {
    document.getElementById('settingsScreen').classList.add('hide');
    document.getElementById('statsScreen').classList.add('hide');
    document.getElementById('startScreen').classList.remove('hide');
    document.getElementById('startContent').classList.add('visible');
    setHudHome(true);
}

function selectDifficulty(diff) {
    difficulty = diff;
    document.querySelectorAll('.difficulty-options .option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function updateMathTypes() {
    enabledMathTypes = [];
    if (document.getElementById('mathAdd').checked) enabledMathTypes.push('add');
    if (document.getElementById('mathSubtract').checked) enabledMathTypes.push('subtract');
    if (document.getElementById('mathMultiply').checked) enabledMathTypes.push('multiply');
    if (document.getElementById('mathDivide').checked) enabledMathTypes.push('divide');
    
    if (enabledMathTypes.length === 0) {
        enabledMathTypes.push('add');
        document.getElementById('mathAdd').checked = true;
    }
}

// ─── TERRAIN SYSTEM ────────────────────────────────────────────────────────

const GROUND_LEVEL_OFFSETS = [0, -32, -64];
const TILE_SIZE = 64;

function getSegmentsRightEdge() {
    if (groundSegments.length === 0) return 0;
    return Math.max(...groundSegments.map(s => s.x + s.width));
}

function getPlatformsRightEdge() {
    if (platforms.length === 0) return canvas.width;
    return Math.max(...platforms.map(p => p.x + p.width));
}

function addGroundSegment(forceX, forceLevel) {
    const lastSeg = groundSegments[groundSegments.length - 1];
    const prevOffset = lastSeg ? lastSeg.levelOffset : 0;

    const hasGap = (forceX === undefined) && Math.random() < 0.55;
    const gap = hasGap ? 80 + Math.floor(Math.random() * 3) * 32 : 0;

    const possibleOffsets = GROUND_LEVEL_OFFSETS.filter(o => Math.abs(o - prevOffset) <= 64);
    const levelOffset = (forceLevel !== undefined) ? forceLevel
        : possibleOffsets[Math.floor(Math.random() * possibleOffsets.length)];

    const tileCount = 2 + Math.floor(Math.random() * 5);
    const width = tileCount * TILE_SIZE;
    const startX = (forceX !== undefined) ? forceX
        : (lastSeg ? lastSeg.x + lastSeg.width : 0) + gap;

    groundSegments.push({ x: startX, y: baseGroundY() + levelOffset, width, levelOffset });
}

function addPlatform() {
    const PLATFORM_YS = [
        canvas.height - 220,
        canvas.height - 320,
        canvas.height - 420
    ];
    const lastPlat = platforms[platforms.length - 1];
    const gap = 260 + Math.floor(Math.random() * 240);
    const startX = lastPlat ? lastPlat.x + lastPlat.width + gap : canvas.width + 350;
    const tileCount = 2 + Math.floor(Math.random() * 4);
    const width = tileCount * TILE_SIZE;

    // Pick a y level that doesn't overlap with nearby platforms
    const shuffled = [...PLATFORM_YS].sort(() => Math.random() - 0.5);
    let chosenY = shuffled[0];
    for (const candidate of shuffled) {
        const overlaps = platforms.some(p =>
            p.x < startX + width + 48 && p.x + p.width + 48 > startX &&
            Math.abs(p.y - candidate) < 52
        );
        if (!overlaps) { chosenY = candidate; break; }
    }

    platforms.push({ x: startX, y: chosenY, width, tileCount });
}

function initTerrain() {
    groundSegments = [];
    platforms = [];
    addGroundSegment(0, 0);
    groundSegments[0].width = 500;
    while (getSegmentsRightEdge() < canvas.width + 900) addGroundSegment();
    while (getPlatformsRightEdge() < canvas.width + 900) addPlatform();
}

function updateTerrain() {
    groundSegments.forEach(s => { s.x -= gameSpeed; });
    platforms.forEach(p => { p.x -= gameSpeed; });
    groundSegments = groundSegments.filter(s => s.x + s.width > -TILE_SIZE * 2);
    platforms = platforms.filter(p => p.x + p.width > -TILE_SIZE * 2);
    while (getSegmentsRightEdge() < canvas.width + 900) addGroundSegment();
    while (getPlatformsRightEdge() < canvas.width + 900) addPlatform();
}

function getSpawnSurface() {
    // Returns { y, left, right } for a surface covering canvas.width with enough room for obstacle
    const spawnX = canvas.width;
    for (const seg of groundSegments) {
        if (seg.x <= spawnX && seg.x + seg.width >= spawnX + 80)
            return { y: seg.y, left: seg.x, right: seg.x + seg.width };
    }
    for (const plat of platforms) {
        if (plat.x <= spawnX && plat.x + plat.width >= spawnX + 80)
            return { y: plat.y, left: plat.x, right: plat.x + plat.width };
    }
    return null;
}

function getSpawnGroundY() {
    const s = getSpawnSurface();
    return s ? s.y : baseGroundY();
}

function getRandomSurfaceY() {
    const s = getSpawnSurface();
    return s ? s.y : baseGroundY();
}

function drawGroundSegments() {
    if (!sprites.tiles.complete) return;
    const screenBottom = canvas.height + TILE_SIZE;
    groundSegments.forEach(seg => {
        const rx = Math.round(seg.x);
        const ry = Math.round(seg.y);
        const tileCount = Math.ceil(seg.width / TILE_SIZE);
        for (let i = 0; i < tileCount; i++) {
            const tx = rx + i * TILE_SIZE;
            let topSprite;
            if (tileCount === 1)      topSprite = spriteData.tiles.terrain_top;
            else if (i === 0)         topSprite = spriteData.tiles.terrain_top_left;
            else if (i === tileCount - 1) topSprite = spriteData.tiles.terrain_top_right;
            else                      topSprite = spriteData.tiles.terrain_top;
            drawSprite(sprites.tiles, topSprite, tx, ry, TILE_SIZE, TILE_SIZE);
            let fillY = ry + TILE_SIZE;
            while (fillY < screenBottom) {
                drawSprite(sprites.tiles, spriteData.tiles.terrain_center, tx, fillY, TILE_SIZE, TILE_SIZE);
                fillY += TILE_SIZE;
            }
        }
    });
}

function drawPlatforms() {
    if (!sprites.tiles.complete) return;
    platforms.forEach(plat => {
        const rx = Math.round(plat.x);
        const ry = Math.round(plat.y);
        for (let i = 0; i < plat.tileCount; i++) {
            const tx = rx + i * TILE_SIZE;
            let sprite;
            if (plat.tileCount === 1) sprite = spriteData.tiles.plat_mid;
            else if (i === 0)         sprite = spriteData.tiles.plat_left;
            else if (i === plat.tileCount - 1) sprite = spriteData.tiles.plat_right;
            else                      sprite = spriteData.tiles.plat_mid;
            drawSprite(sprites.tiles, sprite, tx, ry, TILE_SIZE, TILE_SIZE);
        }
    });
}

// ─── END TERRAIN SYSTEM ────────────────────────────────────────────────────

function startGameFromSettings() {
    document.getElementById('settingsScreen').classList.add('hide');
    const s = difficultySettings[difficulty];
    document.getElementById('difficultyDisplay').textContent = s ? s.label : difficulty;
    startGame();
}

function setHudHome(visible) {
    const btn = document.getElementById('hudHomeBtn');
    if (btn) btn.style.display = visible ? '' : 'none';
}

function startGame() {
    gameRunning = true;
    gamePaused = false;
    setHudHome(false);
    score = 0;
    distance = 0;
    pointMultiplier = 1;
    multiplierEndTime = 0;
    
    const settings = difficultySettings[difficulty];
    gameSpeed = settings.speed;
    gravity = settings.gravity;
    basePointsPerFrame = 0.1 * settings.pointsMultiplier;
    
    obstacles = [];
    collectibles = [];
    mathIcons = [];
    spawnTimer = 0;
    mathSpawnTimer = 0;
    backgroundOffset = 0;
    correctAnswers = 0;
    wrongAnswers = 0;

    initTerrain();

    player.y = baseGroundY() - player.height;
    player.velocityY = 0;
    player.grounded = true;
    player.jumpsLeft = player.maxJumps;
    player.gliding = false;
    
    gameLoop();
}

function restartGame() {
    document.getElementById('statsScreen').classList.add('hide');
    startGame();
}

function gameOver() {
    gameRunning = false;
    const prevHS = +localStorage.getItem(RD_HS_KEY) || 0;
    const finalScore = Math.floor(score);
    const isNew = finalScore > prevHS;
    if (isNew) localStorage.setItem(RD_HS_KEY, finalScore);

    document.getElementById('statScore').textContent = finalScore;
    document.getElementById('statDistance').textContent = Math.floor(distance);
    document.getElementById('statCorrect').textContent = correctAnswers;
    document.getElementById('statWrong').textContent = wrongAnswers;
    const total = correctAnswers + wrongAnswers;
    document.getElementById('statAccuracy').textContent = total > 0 ? Math.round(correctAnswers / total * 100) + '%' : '–';
    document.getElementById('statHS').textContent = isNew ? finalScore : prevHS;
    document.getElementById('hsBadge').style.display = isNew ? 'inline-block' : 'none';
    document.getElementById('statsScreen').classList.remove('hide');
    statsMenuFocus = 0;
    updateStatsFocus();
    setHudHome(true);
    playSound('hit');
}

function updateStatsFocus() {
    document.querySelectorAll('.stat-btn').forEach((b, i) => {
        b.classList.toggle('kbd-focus', i === statsMenuFocus);
    });
}

function downloadStats() {
    if (!window.html2canvas) return;
    const el = document.getElementById('statsCard');
    const tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;background:#14082a;border-radius:22px;';
    tmp.appendChild(el.cloneNode(true));
    document.body.appendChild(tmp);
    html2canvas(tmp.firstChild, { scale: 2, backgroundColor: '#14082a', logging: false }).then(c => {
        const a = document.createElement('a');
        a.download = 'reknedaesj-score.png';
        a.href = c.toDataURL('image/png');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        document.body.removeChild(tmp);
    }).catch(() => document.body.removeChild(tmp));
}

function fmt(n) {
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1).replace('.', ',');
}

function generateMathProblem() {
    const mathLevel = (difficultySettings[difficulty] || difficultySettings.grade2).mathLevel;

    const availableOps = [];
    if (enabledMathTypes.includes('add'))      availableOps.push({ type: 'add',      symbol: '+' });
    if (enabledMathTypes.includes('subtract')) availableOps.push({ type: 'subtract', symbol: '−' });
    if (enabledMathTypes.includes('multiply')) availableOps.push({ type: 'multiply', symbol: '×' });
    if (enabledMathTypes.includes('divide'))   availableOps.push({ type: 'divide',   symbol: '÷' });
    if (availableOps.length === 0) availableOps.push({ type: 'add', symbol: '+' });

    const op = availableOps[Math.floor(Math.random() * availableOps.length)];
    let num1, num2, answer;

    // ── Add / Subtract: scale up to 3-digit numbers ─────────────────────────
    // [minOperand, maxOperand]
    const addRanges = [
        [1,  10],   // lv1 2.kl  – sum up to ~20
        [5,  50],   // lv2 4-5.kl
        [20, 150],  // lv3 6-7.kl
        [50, 499],  // lv4 8-9.kl
        [100, 899]  // lv5 10.kl – sum/diff up to 999
    ];

    // ── Multiply / Divide: factors only (never 3-digit factors) ─────────────
    // [minFactor, maxFactor, minFactor2, maxFactor2]
    // lv5: at least one factor ≥ 10, neither both > 15; halves allowed
    const mulRanges = [
        [2, 5,  2, 5 ],  // lv1: 2–5 × 2–5
        [2, 9,  2, 9 ],  // lv2: full times table ≤9
        [2, 12, 2, 12],  // lv3: ≤12
        [3, 15, 3, 12],  // lv4: 3–15 × 3–12
        [2, 20, 2, 15]   // lv5: 2–20 × 2–15 (with half-number option)
    ];

    const rA = addRanges[mathLevel - 1];
    const rM = mulRanges[mathLevel - 1];

    const ri = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

    if (op.type === 'add') {
        num1 = ri(rA[0], rA[1]);
        num2 = ri(rA[0], rA[1]);
        answer = num1 + num2;
    } else if (op.type === 'subtract') {
        num1 = ri(rA[0] + Math.ceil((rA[1] - rA[0]) * 0.3), rA[1]);
        num2 = ri(rA[0], num1 - 1);
        answer = num1 - num2;
    } else if (op.type === 'multiply') {
        const useHalf = mathLevel >= 5 && Math.random() < 0.35;
        if (useHalf) {
            const halves = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 10.5, 11.5, 12.5];
            num1 = halves[ri(0, halves.length - 1)];
            num2 = ri(8, 15);   // always pair with a reasonable whole number
        } else {
            num1 = ri(rM[0], rM[1]);
            num2 = ri(rM[2], rM[3]);
            if (mathLevel >= 5) {
                // Ensure at least one factor ≥ 10
                if (num1 < 10 && num2 < 10) {
                    if (Math.random() < 0.5) num1 = ri(10, rM[1]);
                    else                     num2 = ri(10, rM[3]);
                }
                // Ensure they're not BOTH > 15 (product too unwieldy)
                if (num1 > 15 && num2 > 15) num2 = ri(rM[2], 15);
            }
            if (mathLevel >= 4 && num1 < 3 && num2 < 3) num1 = ri(3, rM[1]);
        }
        answer = Math.round(num1 * num2 * 10) / 10;
    } else {
        // Divide: generate as reverse-multiply using same factor ranges
        const divisor  = ri(rM[0], rM[1]);
        const quotient = ri(rM[2], rM[3]);
        num1   = divisor * quotient;
        num2   = divisor;
        answer = quotient;
    }

    // ── Wrong options ────────────────────────────────────────────────────────
    const spreads = [3, 8, 15, 30, 60];
    const spread  = spreads[mathLevel - 1];
    const isDecimal = !Number.isInteger(answer);

    const options = [answer];
    let tries = 0;
    while (options.length < 4 && tries++ < 200) {
        let wrong;
        if (isDecimal) {
            wrong = Math.round((answer + (Math.random() * spread - spread / 2)) * 2) / 2;
        } else {
            wrong = answer + ri(-spread, spread);
        }
        if (wrong > 0 && wrong !== answer && !options.includes(wrong)) options.push(wrong);
    }
    for (let v = answer + (isDecimal ? 0.5 : 1); options.length < 4; v += (isDecimal ? 0.5 : 1)) {
        if (!options.includes(v)) options.push(v);
    }

    for (let i = options.length - 1; i > 0; i--) {
        const j = ri(0, i);
        [options[i], options[j]] = [options[j], options[i]];
    }

    return { question: `${fmt(num1)} ${op.symbol} ${fmt(num2)}`, answer, options };
}

let mathModalOpen = false;
let selectedOption = 0;
let mathOptions = [];

function showMathModal(rewardType) {
    gamePaused = true;
    mathModalOpen = true;
    mathRewardType = rewardType;
    currentMathProblem = generateMathProblem();
    selectedOption = 0;
    
    document.getElementById('mathQuestion').textContent = currentMathProblem.question + ' = ?';
    
    const optionsContainer = document.getElementById('mathOptions');
    optionsContainer.innerHTML = '';
    
    const characterSelector = document.createElement('div');
    characterSelector.className = 'character-selector';
    characterSelector.id = 'characterSelector';
    optionsContainer.appendChild(characterSelector);
    
    mathOptions = [];
    currentMathProblem.options.forEach((option) => {
        const btn = document.createElement('button');
        btn.className = 'math-option';
        btn.textContent = fmt(option);
        btn.onclick = () => {
            const idx = mathOptions.indexOf(btn);
            if (idx !== -1) {
                mathOptions[selectedOption].classList.remove('selected');
                selectedOption = idx;
                mathOptions[selectedOption].classList.add('selected');
            }
            checkAnswer(btn.textContent);
        };
        optionsContainer.appendChild(btn);
        mathOptions.push(btn);
    });
    
    updateCharacterPosition();
    updateRewardDisplay(rewardType);
    
    document.getElementById('mathModal').classList.add('show');

    setTimeout(() => {
        mathOptions[0].classList.add('selected');
    }, 100);
}

function updateRewardDisplay(rewardType) {
    const rewardIcon = document.getElementById('rewardIcon');
    const rewardText = document.getElementById('rewardText');
    
    let icon = '';
    let text = '';
    
    if (rewardType === 'double') {
        icon = '🎉';
        text = 'Svar rett og få dobbel poengsum!';
    } else if (rewardType === 'triple') {
        icon = '🌟';
        text = 'Svar rett og få trippel poengsum!';
    } else if (rewardType === 'multiplier2x') {
        icon = '⚡';
        text = 'Svar rett og få 2× poeng i 10 sekund!';
    } else if (rewardType === 'multiplier3x') {
        icon = '🔥';
        text = 'Svar rett og få 3× poeng i 10 sekund!';
    }
    
    rewardIcon.textContent = icon;
    rewardText.textContent = text;
}

function updateCharacterPosition() {
    if (mathOptions.length === 0) return;
    
    const characterSelector = document.getElementById('characterSelector');
    const selectedOptionElement = mathOptions[selectedOption];
    const optionRect = selectedOptionElement.getBoundingClientRect();
    const containerRect = selectedOptionElement.parentElement.getBoundingClientRect();
    
    characterSelector.style.top = (optionRect.top - containerRect.top + optionRect.height / 2 - 30) + 'px';
}

function moveCharacterSelection(direction) {
    if (!mathModalOpen || mathOptions.length === 0) return;
    
    mathOptions[selectedOption].classList.remove('selected');
    
    if (direction === 'up') {
        selectedOption = (selectedOption - 1 + mathOptions.length) % mathOptions.length;
    } else {
        selectedOption = (selectedOption + 1) % mathOptions.length;
    }
    
    mathOptions[selectedOption].classList.add('selected');
    
    const characterSelector = document.getElementById('characterSelector');
    characterSelector.classList.add('jumping');
    updateCharacterPosition();
    
    setTimeout(() => {
        characterSelector.classList.remove('jumping');
    }, 400);
    
    playSound('jump');
}

function selectCurrentOption() {
    if (!mathModalOpen || mathOptions.length === 0) return;
    
    const option = mathOptions[selectedOption];
    const answerText = option.textContent;
    checkAnswer(answerText);
}

function createCelebration() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.textContent = 'RIKTIG!';
    document.getElementById('mathModal').appendChild(celebration);
    
    setTimeout(() => {
        celebration.remove();
    }, 1000);
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    particlesContainer.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = (Math.PI * 2 * i) / 20;
        const distance = 100 + Math.random() * 100;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        particle.style.setProperty('--x', x + 'px');
        particle.style.setProperty('--y', y + 'px');
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.background = ['#ffd700', '#ff6b6b', '#667eea', '#48bb78'][Math.floor(Math.random() * 4)];
        
        particlesContainer.appendChild(particle);
    }
    
    setTimeout(() => {
        particlesContainer.innerHTML = '';
    }, 1000);
}

function checkAnswer(selectedAnswer) {
    const normalized = parseFloat(String(selectedAnswer).replace(',', '.'));
    const correct = Math.abs(normalized - currentMathProblem.answer) < 0.001;

    if (correct) {
        playSound('correct');
        createCelebration();
        createParticles();
        mathOptions[selectedOption].classList.add('correct');
        if (mathRewardType === 'double') { score *= 2; }
        else if (mathRewardType === 'triple') { score *= 3; }
        else if (mathRewardType === 'multiplier2x') { pointMultiplier = 2; multiplierEndTime = Date.now() + 10000; }
        else if (mathRewardType === 'multiplier3x') { pointMultiplier = 3; multiplierEndTime = Date.now() + 10000; }
        correctAnswers++;
        updateUI();
    } else {
        playSound('hit');
        mathOptions[selectedOption].classList.add('incorrect');
        wrongAnswers++;
    }

    // After feedback is visible, hide modal and show floating countdown
    setTimeout(() => {
        document.getElementById('mathModal').classList.remove('show');

        const floatEl = document.getElementById('floatingCountdown');
        const showCircle = (n) => {
            floatEl.innerHTML = '';
            if (n <= 0) return;
            const c = document.createElement('div');
            c.className = 'countdown-circle';
            c.textContent = n;
            floatEl.appendChild(c);
        };
        let count = 3;
        showCircle(count);
        const countdownInterval = setInterval(() => {
            count--;
            if (count <= 0) {
                clearInterval(countdownInterval);
                showCircle(0);
                setTimeout(() => {
                    floatEl.innerHTML = '';
                    mathModalOpen = false;
                    gamePaused = false;
                }, 300);
            } else {
                showCircle(count);
            }
        }, 620);
    }, 750);
}

function spawnObstacle() {
    const types = [
        { type: 'spike', sprite: 'spike', width: 64, height: 64, deadly: true },
        { type: 'cactus', sprite: 'cactus', width: 64, height: 64, deadly: false },
        { type: 'block', sprite: 'block_red', width: 64, height: 64, deadly: false },
        { type: 'bomb', sprite: 'bomb', width: 64, height: 64, deadly: true },
        { type: 'saw', sprite: 'saw_a', width: 64, height: 64, deadly: true, animated: true },
        { type: 'slime', sprite: 'slime', width: 64, height: 64, deadly: true },
        { type: 'bee', sprite: 'bee_a', width: 64, height: 64, deadly: true, flying: true, animated: true }
    ];
    
    const obstacleType = types[Math.floor(Math.random() * types.length)];
    
    const surface = getSpawnSurface();

    if (!obstacleType.flying && !surface) return;
    if (!obstacleType.flying && surface && (surface.right - surface.left) < 96) return;

    let yPos;
    if (obstacleType.flying) {
        const refY = surface ? surface.y : baseGroundY();
        yPos = refY - 110 - Math.random() * 100;
    } else {
        yPos = surface.y - obstacleType.height;
    }

    const newObs = {
        x: canvas.width,
        y: yPos,
        width: obstacleType.width,
        height: obstacleType.height,
        type: obstacleType.type,
        sprite: obstacleType.sprite,
        deadly: obstacleType.deadly,
        animated: obstacleType.animated || false,
        animFrame: 0,
        animTimer: 0
    };
    if (obstacleType.type === 'bee') newObs.baseY = yPos;
    if (obstacleType.type === 'slime' && surface) {
        newObs.patrolLeft = surface.left;
        newObs.patrolRight = surface.right;
        newObs.patrolDir = -1;
    }
    obstacles.push(newObs);
}

function spawnCollectible() {
    const types = [
        { sprite: 'coin_gold', points: 10 },
        { sprite: 'gem_blue', points: 25 },
        { sprite: 'gem_red', points: 50 }
    ];
    
    const collectible = types[Math.floor(Math.random() * types.length)];
    
    const surfaceY = getRandomSurfaceY();
    collectibles.push({
        x: canvas.width,
        y: surfaceY - 80 - Math.random() * 120,
        width: 64,
        height: 64,
        sprite: collectible.sprite,
        points: collectible.points,
        rotation: 0
    });
}

function spawnMathIcon() {
    const rewardTypes = ['double', 'triple', 'multiplier2x', 'multiplier3x'];
    const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    
    const surfaceY = getRandomSurfaceY();
    mathIcons.push({
        x: canvas.width,
        y: surfaceY - 120 - Math.random() * 60,
        width: 50,
        height: 50,
        rewardType: rewardType,
        rotation: 0
    });
}

function updatePlayer() {
    if (keys['Space'] || keys['ArrowUp']) {
        if (!player.grounded && player.velocityY > 0) {
            player.gliding = true;
            player.velocityY = Math.min(player.velocityY, 3);
        }
    } else {
        player.gliding = false;
    }

    player.velocityY += gravity;
    player.y += player.velocityY;

    let landed = false;
    const cx = player.x + player.width / 2;
    const bottom = player.y + player.height;
    const tolerance = gameSpeed + Math.abs(player.velocityY) + 12;

    if (player.velocityY >= 0) {
        for (const seg of groundSegments) {
            if (cx > seg.x && cx < seg.x + seg.width) {
                if (bottom >= seg.y && bottom <= seg.y + tolerance) {
                    player.y = seg.y - player.height;
                    player.velocityY = 0;
                    player.jumping = false;
                    player.grounded = true;
                    player.jumpsLeft = player.maxJumps;
                    player.gliding = false;
                    landed = true;
                    break;
                }
            }
        }
        if (!landed) {
            for (const plat of platforms) {
                if (cx > plat.x && cx < plat.x + plat.width) {
                    if (bottom >= plat.y && bottom <= plat.y + tolerance) {
                        player.y = plat.y - player.height;
                        player.velocityY = 0;
                        player.jumping = false;
                        player.grounded = true;
                        player.jumpsLeft = player.maxJumps;
                        player.gliding = false;
                        landed = true;
                        break;
                    }
                }
            }
        }
    }

    if (!landed) {
        player.grounded = false;
        if (player.y > canvas.height + 60) gameOver();
    }

    player.animTimer++;
    if (player.animTimer > 8) {
        player.animFrame = (player.animFrame + 1) % 2;
        player.animTimer = 0;
    }
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;

        if (obs.animated) {
            obs.animTimer++;
            if (obs.animTimer > 10) {
                obs.animFrame = (obs.animFrame + 1) % 2;
                obs.animTimer = 0;
            }
        }

        if (obs.type === 'bee') {
            obs.bobTimer = (obs.bobTimer || 0) + 0.05;
            const bob = Math.sin(obs.bobTimer) * 14;
            const dy = (player.y + player.height / 2) - (obs.y + obs.height / 2);
            const dist = Math.sqrt((player.x - obs.x) ** 2 + dy ** 2);
            if (dist < 280) {
                const targetY = player.y + player.height / 2 - obs.height / 2 + bob * 0.3;
                obs.y += (targetY - obs.y) * 0.018;
            } else {
                if (obs.baseY === undefined) obs.baseY = obs.y;
                obs.y = obs.baseY + bob;
            }
        }

        if (obs.type === 'slime') {
            if (obs.patrolLeft !== undefined) {
                obs.patrolLeft -= gameSpeed;
                obs.patrolRight -= gameSpeed;
            }
            const dir = obs.patrolDir || -1;
            obs.x += dir * 1.2;
            if (obs.patrolLeft !== undefined) {
                if (obs.x <= obs.patrolLeft) {
                    obs.patrolDir = 1;
                    obs.x = obs.patrolLeft;
                } else if (obs.x + obs.width >= obs.patrolRight) {
                    obs.patrolDir = -1;
                    obs.x = obs.patrolRight - obs.width;
                }
            }
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            continue;
        }

        if (obs.deadly &&
            player.x + 28 < obs.x + obs.width - 18 &&
            player.x + player.width - 28 > obs.x + 18 &&
            player.y + 24 < obs.y + obs.height - 18 &&
            player.y + player.height - 18 > obs.y + 18) {
            gameOver();
        }
    }
}

function updateCollectibles() {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].x -= gameSpeed;
        collectibles[i].rotation += 0.05;
        
        if (collectibles[i].x + collectibles[i].width < 0) {
            collectibles.splice(i, 1);
            continue;
        }
        
        if (player.x < collectibles[i].x + collectibles[i].width &&
            player.x + player.width > collectibles[i].x &&
            player.y < collectibles[i].y + collectibles[i].height &&
            player.y + player.height > collectibles[i].y) {
            const pts = collectibles[i].points * pointMultiplier;
            showScorePopup(collectibles[i].x + collectibles[i].width / 2, collectibles[i].y, pts);
            score += pts;
            playSound('collect');
            collectibles.splice(i, 1);
        }
    }
}

function updateMathIcons() {
    for (let i = mathIcons.length - 1; i >= 0; i--) {
        mathIcons[i].x -= gameSpeed;
        mathIcons[i].rotation += 0.05;
        
        if (mathIcons[i].x + mathIcons[i].width < 0) {
            mathIcons.splice(i, 1);
            continue;
        }
        
        if (player.x < mathIcons[i].x + mathIcons[i].width &&
            player.x + player.width > mathIcons[i].x &&
            player.y < mathIcons[i].y + mathIcons[i].height &&
            player.y + player.height > mathIcons[i].y) {
            playSound('collect');
            showMathModal(mathIcons[i].rewardType);
            mathIcons.splice(i, 1);
        }
    }
}

function updateGame() {
    if (!gameRunning || gamePaused) return;

    updateTerrain();
    updatePlayer();
    updateObstacles();
    updateCollectibles();
    updateMathIcons();
    
    score += basePointsPerFrame * pointMultiplier;
    distance += 0.05;
    
    if (multiplierEndTime > 0 && Date.now() > multiplierEndTime) {
        pointMultiplier = 1;
        multiplierEndTime = 0;
    }
    
    const settings = difficultySettings[difficulty];
    spawnTimer++;
    if (spawnTimer > settings.spawnRate - Math.min(distance / 10, settings.spawnRate * 0.5)) {
        spawnObstacle();
        spawnTimer = 0;
    }
    
    if (Math.random() < 0.02) {
        spawnCollectible();
    }
    
    mathSpawnTimer++;
    if (mathSpawnTimer > 400) {
        spawnMathIcon();
        mathSpawnTimer = 0;
    }
    
    gameSpeed = settings.speed + distance / 100;
    backgroundOffset = (backgroundOffset + gameSpeed * 0.5) % canvas.width;
    
    updateUI();
}

function updateUI() {
    document.getElementById('scoreValue').textContent = Math.floor(score);
    document.getElementById('distanceValue').textContent = Math.floor(distance);
    document.getElementById('jumpIndicator').textContent = `Hopp: ${player.jumpsLeft}/${player.maxJumps}`;
    
    const multiplierText = document.getElementById('multiplierText');
    multiplierText.textContent = `×${pointMultiplier}`;
    
    if (pointMultiplier > 1) {
        multiplierText.classList.add('active');
    } else {
        multiplierText.classList.remove('active');
    }
}

function showScorePopup(canvasX, canvasY, points) {
    const container = document.getElementById('gameContainer');
    const sx = container.clientWidth / canvas.width;
    const sy = container.clientHeight / canvas.height;
    const el = document.createElement('div');
    el.className = 'score-popup';
    el.textContent = '+' + points;
    el.style.left = (canvasX * sx) + 'px';
    el.style.top  = (canvasY * sy) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 950);
}

function drawSprite(img, spriteInfo, x, y, width, height) {
    if (img.complete) {
        ctx.drawImage(img, spriteInfo.x, spriteInfo.y, spriteInfo.width, spriteInfo.height, x, y, width, height);
    }
}

function drawPlayer() {
    let spriteInfo;
    if (!player.grounded) {
        if (player.gliding) {
            spriteInfo = spriteData.character.duck;
        } else {
            spriteInfo = spriteData.character.jump;
        }
    } else {
        spriteInfo = player.animFrame === 0 ? spriteData.character.walk_a : spriteData.character.walk_b;
    }
    
    drawSprite(sprites.character, spriteInfo, player.x, player.y, player.width, player.height);
}

function drawObstacles() {
    obstacles.forEach(obs => {
        let spriteInfo;
        if (obs.type === 'saw') {
            spriteInfo = obs.animFrame === 0 ? spriteData.enemies.saw_a : spriteData.enemies.saw_b;
            drawSprite(sprites.enemies, spriteInfo, obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'bee') {
            spriteInfo = obs.animFrame === 0 ? spriteData.enemies.bee_a : spriteData.enemies.bee_b;
            drawSprite(sprites.enemies, spriteInfo, obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'slime') {
            spriteInfo = spriteData.enemies.slime;
            if ((obs.patrolDir || -1) === 1) {
                ctx.save();
                ctx.translate(obs.x + obs.width, obs.y);
                ctx.scale(-1, 1);
                drawSprite(sprites.enemies, spriteInfo, 0, 0, obs.width, obs.height);
                ctx.restore();
            } else {
                drawSprite(sprites.enemies, spriteInfo, obs.x, obs.y, obs.width, obs.height);
            }
        } else {
            spriteInfo = spriteData.tiles[obs.sprite];
            drawSprite(sprites.tiles, spriteInfo, obs.x, obs.y, obs.width, obs.height);
        }
    });
}

function drawCollectibles() {
    collectibles.forEach(item => {
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(item.rotation);
        const spriteInfo = spriteData.tiles[item.sprite];
        drawSprite(sprites.tiles, spriteInfo, -item.width / 2, -item.height / 2, item.width, item.height);
        ctx.restore();
    });
}

function drawMathIcons() {
    mathIcons.forEach(icon => {
        ctx.save();
        ctx.translate(icon.x + icon.width / 2, icon.y + icon.height / 2);
        ctx.rotate(icon.rotation);
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, icon.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);
        
        ctx.restore();
    });
}

function drawGround() {
    drawGroundSegments();
    drawPlatforms();
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const cloudOffset = (Date.now() / 50 + backgroundOffset) % (canvas.width + 200);
    drawCloud(cloudOffset - 200, 50);
    drawCloud(cloudOffset + 200, 100);
    drawCloud(cloudOffset + 600, 80);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const hillOffset = backgroundOffset * 0.3;
    const horizonY = baseGroundY() - 50;
    for (let i = -hillOffset; i < canvas.width + 200; i += 300) {
        drawHill(i, horizonY);
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
    ctx.fill();
}

function drawHill(x, y) {
    ctx.beginPath();
    ctx.ellipse(x, y, 100, 50, 0, 0, Math.PI * 2);
    ctx.fill();
}

function render() {
    drawBackground();
    drawPlatforms();
    drawGroundSegments();
    drawObstacles();
    drawCollectibles();
    drawMathIcons();
    drawPlayer();
}

function goHome() {
    window.location.href = '../index.html';
}

function gameLoop() {
    if (!gameRunning) return;
    
    updateGame();
    render();
    
    requestAnimationFrame(gameLoop);
}

// Fade in start menu content after background is visible
setTimeout(() => {
    const sc = document.getElementById('startContent');
    if (sc) sc.classList.add('visible');
}, 1600);
