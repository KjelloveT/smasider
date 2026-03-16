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
let basePointsPerFrame = 0.1;
let pointMultiplier = 1;
let multiplierEndTime = 0;
let gameSpeed = 5;
let gravity = 0.8;
let difficulty = 'medium';
let enabledMathTypes = ['add', 'subtract', 'multiply'];

const difficultySettings = {
    easy: { speed: 4, spawnRate: 100, gravity: 0.6, pointsMultiplier: 0.8 },
    medium: { speed: 6, spawnRate: 70, gravity: 0.8, pointsMultiplier: 1.0 },
    hard: { speed: 8, spawnRate: 50, gravity: 1.0, pointsMultiplier: 1.5 },
    extreme: { speed: 10, spawnRate: 35, gravity: 1.2, pointsMultiplier: 2.0 }
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

const groundY = () => canvas.height - 100;

let obstacles = [];
let collectibles = [];
let mathIcons = [];
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
        fireball: { x: 715, y: 130, width: 64, height: 64 }
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
    document.getElementById('gameOverScreen').classList.add('hide');
    document.getElementById('startScreen').classList.remove('hide');
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

function startGameFromSettings() {
    document.getElementById('settingsScreen').classList.add('hide');
    document.getElementById('difficultyDisplay').textContent = 
        difficulty === 'easy' ? 'Lett' : 
        difficulty === 'medium' ? 'Middels' : 
        difficulty === 'hard' ? 'Vanskeleg' : 'Ekstrem';
    startGame();
}

function startGame() {
    gameRunning = true;
    gamePaused = false;
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
    
    player.y = groundY() - player.height;
    player.velocityY = 0;
    player.grounded = true;
    player.jumpsLeft = player.maxJumps;
    player.gliding = false;
    
    gameLoop();
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hide');
    startGame();
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('finalDistance').textContent = Math.floor(distance);
    document.getElementById('gameOverScreen').classList.remove('hide');
    playSound('hit');
}

function generateMathProblem() {
    const availableOps = [];
    
    if (enabledMathTypes.includes('add')) {
        availableOps.push({ type: 'add', symbol: '+' });
    }
    if (enabledMathTypes.includes('subtract')) {
        availableOps.push({ type: 'subtract', symbol: '−' });
    }
    if (enabledMathTypes.includes('multiply')) {
        availableOps.push({ type: 'multiply', symbol: '×' });
    }
    if (enabledMathTypes.includes('divide')) {
        availableOps.push({ type: 'divide', symbol: '÷' });
    }
    
    const op = availableOps[Math.floor(Math.random() * availableOps.length)];
    let num1, num2, answer;
    
    if (op.type === 'multiply') {
        num1 = Math.floor(Math.random() * 10) + 2;
        num2 = Math.floor(Math.random() * 10) + 2;
        answer = num1 * num2;
    } else if (op.type === 'add') {
        num1 = Math.floor(Math.random() * 50) + 10;
        num2 = Math.floor(Math.random() * 50) + 10;
        answer = num1 + num2;
    } else if (op.type === 'subtract') {
        num1 = Math.floor(Math.random() * 50) + 30;
        num2 = Math.floor(Math.random() * 30) + 1;
        answer = num1 - num2;
    } else {
        num2 = Math.floor(Math.random() * 9) + 2;
        answer = Math.floor(Math.random() * 10) + 2;
        num1 = num2 * answer;
    }
    
    const options = [answer];
    while (options.length < 4) {
        let wrong = answer + Math.floor(Math.random() * 20) - 10;
        if (wrong > 0 && !options.includes(wrong)) {
            options.push(wrong);
        }
    }
    
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    return {
        question: `${num1} ${op.symbol} ${num2}`,
        answer: answer,
        options: options
    };
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
    characterSelector.textContent = '🏃';
    optionsContainer.appendChild(characterSelector);
    
    mathOptions = [];
    currentMathProblem.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'math-option';
        btn.textContent = option;
        btn.onclick = () => checkAnswer(option);
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
    const correct = parseInt(selectedAnswer.trim()) === currentMathProblem.answer;
    
    if (correct) {
        playSound('correct');
        createCelebration();
        createParticles();
        
        mathOptions[selectedOption].classList.add('correct');
        
        if (mathRewardType === 'double') {
            score *= 2;
        } else if (mathRewardType === 'triple') {
            score *= 3;
        } else if (mathRewardType === 'multiplier2x') {
            pointMultiplier = 2;
            multiplierEndTime = Date.now() + 10000;
        } else if (mathRewardType === 'multiplier3x') {
            pointMultiplier = 3;
            multiplierEndTime = Date.now() + 10000;
        }
        
        updateUI();
    } else {
        playSound('hit');
        mathOptions[selectedOption].classList.add('incorrect');
    }
    
    setTimeout(() => {
        document.getElementById('mathModal').classList.remove('show');
        mathModalOpen = false;
        gamePaused = false;
    }, 1500);
}

function spawnObstacle() {
    const types = [
        { type: 'spike', sprite: 'spike', width: 64, height: 64, deadly: true },
        { type: 'cactus', sprite: 'cactus', width: 64, height: 64, deadly: true },
        { type: 'block', sprite: 'block_red', width: 64, height: 64, deadly: false },
        { type: 'bomb', sprite: 'bomb', width: 64, height: 64, deadly: true },
        { type: 'saw', sprite: 'saw_a', width: 64, height: 64, deadly: true, animated: true },
        { type: 'slime', sprite: 'slime', width: 64, height: 64, deadly: true },
        { type: 'bee', sprite: 'bee_a', width: 64, height: 64, deadly: true, flying: true, animated: true }
    ];
    
    const obstacleType = types[Math.floor(Math.random() * types.length)];
    
    const yPos = obstacleType.flying ? 
        groundY() - 100 - Math.random() * 100 : 
        groundY() - obstacleType.height;
    
    obstacles.push({
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
    });
}

function spawnCollectible() {
    const types = [
        { sprite: 'coin_gold', points: 10 },
        { sprite: 'gem_blue', points: 25 },
        { sprite: 'gem_red', points: 50 }
    ];
    
    const collectible = types[Math.floor(Math.random() * types.length)];
    
    collectibles.push({
        x: canvas.width,
        y: groundY() - 100 - Math.random() * 150,
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
    
    mathIcons.push({
        x: canvas.width,
        y: groundY() - 150 - Math.random() * 50,
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
    
    if (player.y >= groundY() - player.height) {
        player.y = groundY() - player.height;
        player.velocityY = 0;
        player.jumping = false;
        player.grounded = true;
        player.jumpsLeft = player.maxJumps;
        player.gliding = false;
    } else {
        player.grounded = false;
    }
    
    player.animTimer++;
    if (player.animTimer > 8) {
        player.animFrame = (player.animFrame + 1) % 2;
        player.animTimer = 0;
    }
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        if (obstacles[i].animated) {
            obstacles[i].animTimer++;
            if (obstacles[i].animTimer > 10) {
                obstacles[i].animFrame = (obstacles[i].animFrame + 1) % 2;
                obstacles[i].animTimer = 0;
            }
        }
        
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            continue;
        }
        
        if (obstacles[i].deadly &&
            player.x + 20 < obstacles[i].x + obstacles[i].width - 10 &&
            player.x + player.width - 20 > obstacles[i].x + 10 &&
            player.y + 20 < obstacles[i].y + obstacles[i].height - 10 &&
            player.y + player.height - 10 > obstacles[i].y + 10) {
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
            score += collectibles[i].points * pointMultiplier;
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
            drawSprite(sprites.enemies, spriteInfo, obs.x, obs.y, obs.width, obs.height);
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
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, groundY(), canvas.width, canvas.height - groundY());
    
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, groundY(), canvas.width, 10);
    
    ctx.fillStyle = '#7A6348';
    for (let i = -backgroundOffset; i < canvas.width; i += 40) {
        ctx.fillRect(i, groundY() + 20, 20, 10);
    }
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
    for (let i = -hillOffset; i < canvas.width + 200; i += 300) {
        drawHill(i, groundY() - 50);
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
    drawGround();
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
