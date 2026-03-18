const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game Variables
let gameRunning = false;
let score = 0;
let lives = 3;
let baseSpeed = 2;
let gameSpeed = baseSpeed;
let difficulty = 3;
let activeOps = [];
let pointMultiplier = 1;
let backgroundOffset = 0;
let frameCount = 0;
let lastHeartSpawn = -9999;
let lastShieldSpawn = -9999;

// Entities
let player = {
    x: 200,
    y: 0,
    width: 64,
    height: 64,
    velocityX: 0,
    velocityY: 0,
    speed: 7,
    jumping: false,
    ducking: false,
    jumpsLeft: 2,
    animFrame: 0,
    animTimer: 0,
    state: 'walk', // walk, jump, duck, hit
    invincibleTimer: 0,
    hitTimer: 0
};

let platforms = [];
let obstacles = [];
let powerups = [];
let mathOptions = []; // Active math answers in the world
let visualEffects = [];

let currentMathProblem = null;
let mathSpawnTimer = 0;
let nextPlatformX = 0;

// Sprite Sheets and Data
const images = {
    players: new Image(),
    enemies: new Image(),
    items: new Image(),
    tiles: new Image()
};

images.players.src = 'resources/Spritesheet/spritesheet_players.png';
images.enemies.src = 'resources/Spritesheet/spritesheet_enemies.png';
images.items.src = 'resources/Spritesheet/spritesheet_items.png';
images.tiles.src = 'resources/Spritesheet/spritesheet_tiles.png';

const spriteData = {
    players: {
        walk1: { x: 206, y: 0, width: 39, height: 48 },
        walk2: { x: 206, y: 49, width: 39, height: 45 },
        jump: { x: 243, y: 95, width: 39, height: 46 }, // up2
        duck: { x: 0, y: 228, width: 56, height: 34 },
        hit: { x: 0, y: 335, width: 56, height: 38 }
    },
    enemies: {
        slime1: { x: 158, y: 106, width: 32, height: 44 }, // walking_1
        slime2: { x: 158, y: 151, width: 32, height: 42 }, // walking_2
        fly1: { x: 0, y: 83, width: 64, height: 38 }, // flying_1
        fly2: { x: 0, y: 44, width: 64, height: 38 }, // flying_2
        spike: { x: 158, y: 0, width: 32, height: 40 } // spikey_1
    },
    items: {
        coin: { x: 41, y: 0, width: 32, height: 30 },     // yellowCrystal
        heart: { x: 41, y: 31, width: 32, height: 30 },   // redCrystal
        shield: { x: 41, y: 62, width: 32, height: 30 },  // blueCrystal
        puzzleGreen: { x: 39, y: 125, width: 34, height: 34 },
        puzzleRed: { x: 35, y: 199, width: 34, height: 34 }
    },
    tiles: {
        left: {x: 260, y: 130, width: 64, height: 64},  // tileBrown_16.png
        mid: {x: 325, y: 0, width: 64, height: 64},   // tileBrown_02.png
        right: {x: 260, y: 65, width: 64, height: 64}  // tileBrown_17.png
    }
};

// Start Game
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    const activeDiff = document.querySelector('#difficulty-group .option-btn.active');
    difficulty = parseInt(activeDiff ? activeDiff.dataset.val : 3);
    
    activeOps = [];
    document.querySelectorAll('#operators-group .option-btn.active').forEach(btn => {
        activeOps.push(btn.dataset.op);
    });
    
    if(activeOps.length === 0) activeOps.push('add');
    
    score = 0;
    lives = 3;
    baseSpeed = 1.5 + (difficulty * 0.4); // Slower base speed
    gameSpeed = baseSpeed;
    player.x = 200;
    player.y = canvas.height / 2 - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.invincibleTimer = 0;
    
    platforms = [];
    obstacles = [];
    powerups = [];
    mathOptions = [];
    visualEffects = [];
    currentMathProblem = null;
    mathSpawnTimer = 0;
    
    // Initial floor
    nextPlatformX = 0;
    generatePlatformChunk(true); // starting safe platform
    
    document.getElementById('gameCanvas').style.display = 'block';
    updateHUD();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

// Level Generation
function generatePlatformChunk(isStart = false) {
    // Width must be a multiple of 64
    let numTiles = isStart ? 16 : Math.floor(Math.random() * 8) + 5; // 5 to 12 tiles (320 to 768 pixels)
    const chunkWidth = numTiles * 64;
    const gap = isStart ? 0 : Math.floor(Math.random() * 3) * 64 + 128; // gap also multiple of 64 roughly
    
    let heightLevel = canvas.height - 100;
    
    // Main bottom platform
    platforms.push({
        x: nextPlatformX + gap,
        y: heightLevel,
        width: chunkWidth,
        height: 64
    });
    
    let pX = nextPlatformX + gap;
    let pW = chunkWidth;
    
    nextPlatformX += gap + chunkWidth;
    
    if (!isStart) {
        // Spawn Enemies on bottom (1-3 enemies per chunk)
        let numBottomEnemies = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numBottomEnemies; i++) {
            if (Math.random() < 0.525) { // Reduced by 25% from 0.7
                const enemyTypes = ['jumper', 'patroller', 'ghost', 'spike', 'seeker'];
                const eType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                
                let eY = heightLevel - 60;
                if (eType === 'ghost' || eType === 'seeker') {
                    eY = heightLevel - 150 - Math.random() * 100;
                }
                
                let eX = pX + 100 + (i * 300) + Math.random() * 100;
                if (eX > pX + pW - 60) eX = pX + pW - 100; // clamp inside chunk
                
                obstacles.push({
                    x: eX,
                    y: eY,
                    width: 60,
                    height: 60,
                    type: eType,
                    vx: eType === 'patroller' ? (Math.random() > 0.5 ? 2 : -2) : 0,
                    vy: 0,
                    minX: Math.max(pX, eX - 150),
                    maxX: Math.min(pX + pW, eX + 150)
                });
            }
        }

        // Spawn powerups on bottom
        if (Math.random() < 0.15) {
            let type = 'coin';
            if (Math.random() < 0.2 && frameCount - lastHeartSpawn > 3600) {
                type = 'heart';
                lastHeartSpawn = frameCount;
            } else if (Math.random() < 0.3 && frameCount - lastShieldSpawn > 1800) {
                type = 'shield';
                lastShieldSpawn = frameCount;
            }
            
            powerups.push({
                x: pX + 200 + Math.random() * (pW - 400),
                y: heightLevel - 80,
                width: 40,
                height: 40,
                type: type,
                floatY: 0,
                floatTimer: Math.random() * Math.PI * 2
            });
        }
        
        // Generate Flying Islands (6 vertical layers)
        for (let layer = 1; layer <= 6; layer++) {
            let currentY = heightLevel - (layer * 110) + (Math.random() * 30 - 15);
            if (currentY < 50) continue; // Keep below top edge
            
            let islandX = pX + Math.random() * 200;
            
            while (islandX < pX + pW - 100) {
                if (Math.random() < 0.6) { // 60% chance to have an island here
                    let numIslandTiles = Math.floor(Math.random() * 4) + 3; // 3 to 6 tiles
                    let islandWidth = numIslandTiles * 64;
                    
                    if (islandX + islandWidth > pX + pW) {
                        islandWidth = Math.max(128, Math.floor((pX + pW - islandX)/64) * 64);
                    }
                    
                    if (islandWidth >= 128) {
                        let island = {
                            x: islandX,
                            y: currentY,
                            width: islandWidth,
                            height: 64
                        };
                        platforms.push(island);
                        
                        // Spawn enemy on island
                        if (Math.random() < 0.375) { // Reduced by ~25% from 0.5
                            const eType = Math.random() > 0.4 ? 'patroller' : (Math.random() > 0.5 ? 'spike' : 'jumper');
                            obstacles.push({
                                x: island.x + island.width/2 - 30,
                                y: island.y - 60,
                                width: 60,
                                height: 60,
                                type: eType,
                                vx: eType === 'patroller' ? 2 : 0,
                                vy: 0,
                                minX: island.x,
                                maxX: island.x + island.width
                            });
                        }
                        
                        // Spawn powerup or coin on island
                        if (Math.random() < 0.05) { // Very low chance
                            let type = 'coin';
                            if (Math.random() < 0.2 && frameCount - lastHeartSpawn > 3600) {
                                type = 'heart';
                                lastHeartSpawn = frameCount;
                            } else if (Math.random() < 0.3 && frameCount - lastShieldSpawn > 1800) {
                                type = 'shield';
                                lastShieldSpawn = frameCount;
                            }
                            
                            powerups.push({
                                x: island.x + island.width/2 - 20,
                                y: island.y - 80,
                                width: 40,
                                height: 40,
                                type: type,
                                floatY: 0,
                                floatTimer: Math.random() * Math.PI * 2
                            });
                        }
                    }
                    islandX += islandWidth + Math.floor(Math.random() * 150) + 100; // gap
                } else {
                    islandX += Math.floor(Math.random() * 200) + 100; // empty gap
                }
            }
        }
    }
}

// Math Logic
function generateMathProblem() {
    const op = activeOps[Math.floor(Math.random() * activeOps.length)];
    let num1, num2, answer;
    const maxVal = difficulty * 10;
    
    if (op === 'mul') {
        num1 = Math.floor(Math.random() * (difficulty * 2 + 2)) + 2;
        num2 = Math.floor(Math.random() * (difficulty * 2 + 2)) + 2;
        answer = num1 * num2;
    } else if (op === 'div') {
        num2 = Math.floor(Math.random() * (difficulty * 2 + 2)) + 2;
        answer = Math.floor(Math.random() * (difficulty * 2 + 2)) + 2;
        num1 = num2 * answer;
    } else if (op === 'add') {
        num1 = Math.floor(Math.random() * maxVal) + 5;
        num2 = Math.floor(Math.random() * maxVal) + 5;
        answer = num1 + num2;
    } else { // sub
        num2 = Math.floor(Math.random() * maxVal) + 5;
        answer = Math.floor(Math.random() * maxVal) + 5;
        num1 = num2 + answer;
    }
    
    const options = [answer];
    while (options.length < 3) {
        let wrong = answer + Math.floor(Math.random() * 20) - 10;
        if (wrong > 0 && !options.includes(wrong)) options.push(wrong);
    }
    options.sort(() => Math.random() - 0.5);
    const symbols = { 'add': '+', 'sub': '-', 'mul': '×', 'div': '÷' };
    
    document.getElementById('math-problem').textContent = `${num1} ${symbols[op]} ${num2} = ?`;
    document.getElementById('math-problem-container').style.display = 'block';
    
    // Spawn math options across next chunks
    currentMathProblem = { question: `${num1} ${symbols[op]} ${num2} = ?`, answer: answer };
    setTimeout(() => spawnMathOptions(options, answer), 500);
}

function spawnMathOptions(options, correctAnswer) {
    const startX = canvas.width + 200;
    options.forEach((opt, index) => {
        // Find a platform to attach it above
        let p = platforms.find(p => p.x > startX + index * 300);
        let xPos = p ? p.x + p.width/2 - 50 : startX + index * 400;
        let yPos = p ? p.y - 120 : canvas.height / 2;
        
        mathOptions.push({
            x: xPos,
            y: yPos - (Math.random() * 80),
            width: 75,
            height: 75,
            value: opt,
            isCorrect: opt === correctAnswer
        });
    });
}

function spawnFloatingText(text, x, y, color) {
    visualEffects.push({
        text: text,
        x: x,
        y: y,
        color: color,
        life: 60,
        vy: -2,
        font: 'Orbitron' // Changed font to Orbitron
    });
}

function losePoints(amount = 100, makeInvincible = true) {
    if (makeInvincible && player.hitTimer > 0) return; // Prevent spam if invincible
    
    score = Math.max(0, score - amount);
    
    if (makeInvincible) {
        player.hitTimer = 60; // 1 second invincibility
        player.state = 'hit';
    }
    
    spawnFloatingText(`-${amount}`, player.x, player.y - 40, "#ff5722");
    updateHUD();
}

// Update Functions
function update() {
    frameCount++;
    backgroundOffset -= gameSpeed * 0.5;
    if (backgroundOffset < -canvas.width) backgroundOffset = 0;
    
    // Player physics
    if (keys.ArrowLeft) player.velocityX = -player.speed;
    else if (keys.ArrowRight) player.velocityX = player.speed;
    else player.velocityX *= 0.8;
    
    player.velocityY += 0.8; // gravity
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Update platforms - move them left
    platforms.forEach(p => {
        p.x -= gameSpeed;
    });

    // Platform collision
    player.jumping = true;
    player.state = 'walk'; // Default state, might be overridden
    platforms.forEach(p => {
        if (player.x < p.x + p.width && player.x + player.width > p.x &&
            player.y < p.y + p.height && player.y + player.height > p.y) {
            if (player.velocityY > 0 && player.y < p.y) {
                player.y = p.y - player.height;
                player.velocityY = 0;
                player.jumping = false;
                player.jumpsLeft = 2;
            }
        }
    });
    
    // World boundaries
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height) {
        loseLife();
        player.y = canvas.height / 2 - 100;
        player.velocityY = 0;
    }

    // Update obstacles
    obstacles.forEach(obs => {
        obs.x -= gameSpeed; // Moving with the world
        obs.minX -= gameSpeed; // Update patrol boundaries
        obs.maxX -= gameSpeed;
        
        if (obs.type === 'patroller') {
            obs.x += obs.vx;
            if (obs.x <= obs.minX || obs.x >= obs.maxX) obs.vx *= -1;
        } else if (obs.type === 'ghost' || obs.type === 'seeker') {
            obs.y += Math.sin(frameCount * 0.05) * 2;
            if (obs.type === 'seeker' && Math.abs(player.x - obs.x) < 200) {
                obs.x += (player.x - obs.x) * 0.02;
            }
        }
        
        // Collision with player
        if (player.invincibleTimer <= 0 &&
            player.x < obs.x + obs.width && player.x + player.width > obs.x &&
            player.y < obs.y + obs.height && player.y + player.height > obs.y) {
            loseLife();
        }
    });
    
    // Update powerups
    powerups = powerups.filter(p => {
        p.x -= gameSpeed; // Move with world
        p.floatY = Math.sin(frameCount * 0.05 + p.floatTimer) * 5;
        
        if (player.x < p.x + p.width && player.x + player.width > p.x &&
            player.y < p.y + p.height && player.y + player.height > p.y) {
            if (p.type === 'coin') {
                score += 100;
                spawnFloatingText("+100", p.x, p.y, "#4ade80");
            } else if (p.type === 'heart') {
                lives = Math.min(lives + 1, 5);
                spawnFloatingText("+1 ❤", p.x, p.y, "#ef4444");
            } else if (p.type === 'shield') {
                player.invincibleTimer = 300;
                spawnFloatingText("SKJOLD", p.x, p.y, "#3b82f6");
            }
            updateHUD();
            return false;
        }
        return true;
    });
    
    // Update math options
    let anyOptionOffscreen = false;
    mathOptions = mathOptions.filter(opt => {
        opt.x -= gameSpeed;
        if (opt.rotation) opt.rotation += 0.1;
        
        // Collision with player
        if (player.x < opt.x + opt.width && player.x + player.width > opt.x &&
            player.y < opt.y + opt.height && player.y + player.height > opt.y) {
            
            if (opt.isCorrect && !opt.hit) {
                opt.hit = true; // Mark as hit to prevent multiple triggers
                score += 500;
                spawnFloatingText("+500", opt.x, opt.y, "#22c55e");
                currentMathProblem = null;
                document.getElementById('math-problem-container').style.display = 'none';
                mathSpawnTimer = 180;
                updateHUD();
                return false; // Remove correct piece
            } else if (!opt.isCorrect && !opt.hit && player.hitTimer <= 0) {
                opt.hit = true;
                losePoints(350, true); // -350 points for wrong answer, with invincibility frames
                return false; // Remove wrong piece
            }
        }
        
        if (opt.x <= -opt.width) {
            anyOptionOffscreen = true;
            return false;
        }
        return true;
    });

    // If options went offscreen and problem is still active, reset it so a new one can spawn
    if (anyOptionOffscreen && mathOptions.length === 0 && currentMathProblem) {
        losePoints(500, false); // -500 points for missing the math problem, no invincibility frames needed
        currentMathProblem = null;
        document.getElementById('math-problem-container').style.display = 'none';
        mathSpawnTimer = 180;
    }
    
    // Update visual effects
    visualEffects = visualEffects.filter(v => v.life > 0);
    visualEffects.forEach(v => {
        v.y += v.vy;
        v.life--;
    });
    
    // Update timers
    if (player.invincibleTimer > 0) player.invincibleTimer--;
    if (player.hitTimer > 0) player.hitTimer--;
    
    if (!currentMathProblem && mathSpawnTimer === 0) {
        mathSpawnTimer = 180; // Start timer if no problem
    }
    
    if (mathSpawnTimer > 0) {
        mathSpawnTimer--;
        if (mathSpawnTimer === 0 && !currentMathProblem) {
            generateMathProblem();
        }
    }
    
    // Move next platform generation point with the world
    nextPlatformX -= gameSpeed;
    
    // Generate new platforms
    while (nextPlatformX < canvas.width + 1000) {
        generatePlatformChunk();
    }
    
    // Remove off-screen entities
    platforms = platforms.filter(p => p.x + p.width > -100);
    obstacles = obstacles.filter(obs => obs.x + obs.width > -100);
    
    // Increase difficulty
    if (frameCount % 600 === 0) {
        gameSpeed += 0.1;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background parallax simulation (even lighter gray with hint of red for better contrast)
    ctx.fillStyle = '#4a3f3f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Platforms
    platforms.forEach(p => {
        let tileW = 64;
        
        let pX = Math.floor(p.x);
        let pY = Math.floor(p.y);
        
        // Ensure minimum width to draw at least left and right
        if (p.width >= tileW * 2) {
            // Left tile
            drawSprite(images.tiles, spriteData.tiles.left, pX, pY, tileW, tileW);
            
            // Middle tiles (if any)
            let middleWidth = p.width - tileW * 2;
            if (middleWidth >= tileW) {
                let numMiddleTiles = Math.floor(middleWidth / tileW);
                for (let i = 0; i < numMiddleTiles; i++) {
                    drawSprite(images.tiles, spriteData.tiles.mid, pX + tileW + (i * tileW), pY, tileW, tileW);
                }
            }
            
            // Right tile (positioned at the right edge)
            drawSprite(images.tiles, spriteData.tiles.right, pX + p.width - tileW, pY, tileW, tileW);
        }
    });
    
    // Obstacles
    obstacles.forEach(obs => {
        let obsSprite = spriteData.enemies.slime1;
        if (obs.type === 'jumper') obsSprite = spriteData.enemies.slime2;
        else if (obs.type === 'patroller') obsSprite = (Math.floor(Date.now() / 200) % 2 === 0) ? spriteData.enemies.slime1 : spriteData.enemies.slime2;
        else if (obs.type === 'ghost') obsSprite = spriteData.enemies.fly1;
        else if (obs.type === 'seeker') obsSprite = (Math.floor(Date.now() / 150) % 2 === 0) ? spriteData.enemies.fly1 : spriteData.enemies.fly2;
        else if (obs.type === 'spike') obsSprite = spriteData.enemies.spike;

        if (obs.type === 'ghost' || obs.type === 'seeker') ctx.globalAlpha = 0.7;
        
        // Add subtle red glow to enemies
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#cc0000";
        drawSprite(images.enemies, obsSprite, obs.x, obs.y, obs.width, obs.height);
        ctx.restore();
        
        ctx.globalAlpha = 1.0;
    });
    
    // Powerups
    powerups.forEach(p => {
        let spr;
        if (p.type === 'heart') spr = spriteData.items.heart;
        else if (p.type === 'shield') spr = spriteData.items.shield;
        else spr = spriteData.items.coin;
        
        drawSprite(images.items, spr, p.x, p.y + p.floatY, p.width, p.height);
    });
    
    // Math Options
    mathOptions.forEach(opt => {
        ctx.save();
        // Move to center for rotation
        ctx.translate(opt.x + opt.width/2, opt.y + opt.height/2);
        
        if (opt.rotation) {
            ctx.rotate(opt.rotation);
        }
        
        // Draw puzzleRed background with yellow-orange glow
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff9800";
        drawSprite(images.items, spriteData.items.puzzleRed, -opt.width/2, -opt.height/2, opt.width, opt.height);
        ctx.restore();
        
        // Only draw text if it's not too small
        if (opt.width > 20) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(8, Math.floor(opt.width * 0.25))}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(opt.value, 0, 2);
        }
        
        ctx.restore();
    });
    
    // Player
    let playerSprite = spriteData.players.walk1;
    if (player.state === 'hit') {
        playerSprite = spriteData.players.hit;
    } else if (player.jumping) {
        playerSprite = spriteData.players.jump;
    } else if (player.ducking) {
        playerSprite = spriteData.players.duck;
    } else { // Always animate walking if on ground, since the world is moving
        player.animTimer++;
        if (player.animTimer > 8) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 2;
        }
        playerSprite = player.animFrame === 0 ? spriteData.players.walk1 : spriteData.players.walk2;
    }
    
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    if (player.hitTimer > 0) {
        ctx.globalAlpha = 0.7;
    }
    
    drawSprite(images.players, playerSprite, player.x, player.y, player.width, player.height);
    ctx.globalAlpha = 1.0;
    
    // Visual Effects (floating text)
    visualEffects.forEach(v => {
        ctx.save();
        ctx.globalAlpha = v.life / 60;
        ctx.fillStyle = v.color;
        ctx.font = `bold 20px ${v.font || 'Arial'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.text, v.x, v.y);
        ctx.restore();
    });
}

function drawSprite(img, spriteData, x, y, width, height) {
    if (!spriteData) return;
    ctx.drawImage(img, spriteData.x, spriteData.y, spriteData.width, spriteData.height, x, y, width, height);
}

function updateHUD() {
    document.getElementById('score-display').textContent = `Poeng: ${score}`;
    document.getElementById('lives-display').textContent = '❤️'.repeat(Math.max(0, lives));
}

function loseLife() {
    lives--;
    updateHUD();
    if (lives <= 0) {
        gameOver();
    } else {
        player.invincibleTimer = 120;
        spawnFloatingText("Ouch!", player.x, player.y - 40, "#ef4444");
    }
}

function gameOver() {
    gameRunning = false;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('final-score').textContent = score;
}

// Input handling
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    
    // Handle jumping on keypress to allow double jump
    if (e.key === 'ArrowUp') {
        if (!player.jumping || player.jumpsLeft > 0) {
            player.velocityY = -15;
            player.jumping = true;
            player.jumpsLeft--;
        }
    }
});
window.addEventListener('keyup', e => keys[e.key] = false);

function gameLoop() {
    update();
    draw();
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Initial draw to show background before start
draw();
