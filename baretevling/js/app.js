// BåreTevling - Main Application
const Game = {
    state: {
        screen: 'menu',
        mode: 'local', // 'local' or 'ai'
        boardSize: 12,
        shipConfig: { 5: 1, 4: 1, 3: 2, 2: 2, 1: 1 },
        playerBoard: null,
        enemyBoard: null,
        playerShips: [],
        enemyShips: [],
        attackBoard: null, // Tracks player's attacks on enemy
        enemyAttackBoard: null, // Tracks enemy's attacks on player
        currentShipIndex: 0,
        currentPlayer: 1, // 1 or 2 for local mode
        activeBoard: 'player', // 'attack' or 'player' - which board to mark on
        hits: 0,
        misses: 0
    },

    init() {
        this.setupMenu();
        this.checkSavedGame();
        Input.init();
    },

    setupMenu() {
        // Mode buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.mode = btn.dataset.mode;
            });
        });

        // Board size buttons
        document.querySelectorAll('[data-size]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.boardSize = parseInt(btn.dataset.size);
            });
        });

        // Start button
        document.getElementById('btnStart').addEventListener('click', () => this.startNewGame());

        // Resume button
        document.getElementById('btnResume').addEventListener('click', () => this.resumeGame());

        // Placement buttons
        document.getElementById('btnPlaceShip').addEventListener('click', () => this.placeCurrentShip());
        document.getElementById('btnStartGame').addEventListener('click', () => this.startGame());

        // Attack buttons
        document.getElementById('btnHit').addEventListener('click', () => this.recordAttack(true));
        document.getElementById('btnMiss').addEventListener('click', () => this.recordAttack(false));
        document.getElementById('btnShoot').addEventListener('click', () => this.shoot());

        // Board toggle buttons
        document.getElementById('btnToggleAttack').addEventListener('click', () => this.toggleBoard('attack'));
        document.getElementById('btnTogglePlayer').addEventListener('click', () => this.toggleBoard('player'));

        // Game over buttons
        document.getElementById('btnPlayAgain').addEventListener('click', () => this.startNewGame());
        document.getElementById('btnMenu').addEventListener('click', () => this.showScreen('menu'));

        // Back to menu button
        document.getElementById('btnBackToMenu').addEventListener('click', () => {
            if (confirm('Er du sikker på at du vil avslutte spelet?')) {
                this.showScreen('menu');
            }
        });
    },

    checkSavedGame() {
        if (Storage.hasSavedGame()) {
            document.getElementById('btnResume').style.display = 'block';
        }
    },

    startNewGame() {
        if (Storage.hasSavedGame()) {
            if (!confirm('Vil du slette førre spel og starte eit nytt?')) {
                return;
            }
        }

        Storage.clear();

        // Reset state
        this.state.mode = document.querySelector('[data-mode].selected').dataset.mode;
        this.state.boardSize = parseInt(document.querySelector('[data-size].selected').dataset.size);
        this.state.shipConfig = Ships.getShipConfig();
        this.state.playerBoard = Board.createEmptyBoard(this.state.boardSize);
        this.state.enemyBoard = Board.createEmptyBoard(this.state.boardSize);
        this.state.attackBoard = Board.createEmptyBoard(this.state.boardSize);
        this.state.enemyAttackBoard = Board.createEmptyBoard(this.state.boardSize);
        this.state.playerShips = Ships.generateShipList(this.state.shipConfig);
        this.state.enemyShips = Ships.generateShipList(this.state.shipConfig);
        this.state.currentShipIndex = 0;
        this.state.currentPlayer = 1;
        this.state.activeBoard = 'player';
        this.state.hits = 0;
        this.state.misses = 0;

        // Reset start button state
        document.getElementById('btnStartGame').disabled = true;
        document.getElementById('btnPlaceShip').disabled = false;

        // Auto-place enemy ships
        const enemyPlaced = Ships.autoPlaceShips(this.state.enemyBoard, this.state.enemyShips, this.state.boardSize);
        if (!enemyPlaced) {
            alert('Klarte ikkje plassere fiendens skip. Prøv ein mindre brett eller færre skip.');
            return;
        }
        this.state.enemyShips = enemyPlaced;

        // Start placement phase
        this.showScreen('placement');
        this.setupPlacementPhase();
    },

    resumeGame() {
        const savedState = Storage.load();
        if (savedState) {
            this.state = savedState;
            
            if (this.state.screen === 'game') {
                this.showScreen('game');
                this.renderGameBoards();
                this.updateGameInfo();
            } else if (this.state.screen === 'placement') {
                this.showScreen('placement');
                this.setupPlacementPhase();
            }
        }
    },

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenName + 'Screen').classList.remove('hidden');
        this.state.screen = screenName;
        this.saveGame();
    },

    setupPlacementPhase() {
        const title = document.getElementById('placementTitle');
        const sub = document.getElementById('placementSub');

        if (this.state.mode === 'ai') {
            title.textContent = 'Plasser skip';
            sub.textContent = 'Plasser dine skip før spelet startar';
        } else {
            title.textContent = `Plasser skip - Spelar ${this.state.currentPlayer}`;
            sub.textContent = `Spelar ${this.state.currentPlayer} plasserer sine skip`;
        }

        // Render board
        const boardContainer = document.getElementById('placementBoard');
        const boardData = this.state.currentPlayer === 1 ? this.state.playerBoard : this.state.enemyBoard;
        const ships = this.state.currentPlayer === 1 ? this.state.playerShips : this.state.enemyShips;
        Board.renderBoard(boardContainer, boardData, this.state.boardSize, { ships });

        // Update ship preview
        this.updateShipPreview();

        // Clear input
        Input.clearPlacementInput();
    },

    updateShipPreview() {
        const ships = this.state.currentPlayer === 1 ? this.state.playerShips : this.state.enemyShips;
        const currentShip = ships[this.state.currentShipIndex];
        const preview = document.getElementById('shipPreview');

        if (currentShip) {
            Ships.renderShipPreview(preview, currentShip.size);
        } else {
            preview.innerHTML = 'Alle skip plassert!';
        }
    },

    placeCurrentShip() {
        const coord = Input.getPlacementCoord();
        const direction = Input.currentDirection;

        if (!coord) {
            alert('Skriv inn ein gyldig koordinat');
            return;
        }

        if (!direction) {
            alert('Vel ein himmelretning');
            return;
        }

        const ships = this.state.currentPlayer === 1 ? this.state.playerShips : this.state.enemyShips;
        const currentShip = ships[this.state.currentShipIndex];
        const boardData = this.state.currentPlayer === 1 ? this.state.playerBoard : this.state.enemyBoard;

        const validation = Ships.validatePlacement(
            coord,
            currentShip.size,
            direction,
            boardData,
            this.state.boardSize
        );

        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        // Place the ship
        Ships.placeShip(boardData, validation.cells, currentShip.id);
        currentShip.cells = validation.cells;
        currentShip.placed = true;

        // Move to next ship
        this.state.currentShipIndex++;
        Input.clearPlacementInput();

        // Check if all ships are placed
        if (this.state.currentShipIndex >= ships.length) {
            // Enable start game button
            document.getElementById('btnStartGame').disabled = false;
            document.getElementById('btnPlaceShip').disabled = true;
            document.getElementById('shipPreview').innerHTML = 'Alle skip plassert!';
        } else {
            this.updateShipPreview();
            this.setupPlacementPhase();
        }
    },

    autoPlaceShips() {
        const boardData = this.state.currentPlayer === 1 ? this.state.playerBoard : this.state.enemyBoard;
        const ships = this.state.currentPlayer === 1 ? this.state.playerShips : this.state.enemyShips;
        
        const placed = Ships.autoPlaceShips(boardData, ships, this.state.boardSize);
        
        if (placed) {
            if (this.state.currentPlayer === 1) {
                this.state.playerShips = placed;
            } else {
                this.state.enemyShips = placed;
            }
            
            if (this.state.mode === 'local' && this.state.currentPlayer === 1) {
                // Switch to player 2 placement
                this.state.currentPlayer = 2;
                this.state.currentShipIndex = 0;
                this.state.enemyShips = Ships.generateShipList(this.state.shipConfig);
                this.setupPlacementPhase();
            } else {
                this.startGame();
            }
        } else {
            alert('Klarte ikkje plassere alle skipa. Prøv ein mindre brett eller færre skip.');
        }
    },

    startGame() {
        AI.reset();

        this.showScreen('game');
        
        // Show/hide buttons based on mode
        if (this.state.mode === 'ai') {
            document.getElementById('boardToggle').classList.add('hidden');
            document.getElementById('hitMissButtons').classList.add('hidden');
            document.getElementById('shootButton').classList.remove('hidden');
            document.getElementById('attackLabel').textContent = 'Angrepskoordinat';
            // In AI mode, always show attack board (enemy's board)
            this.state.activeBoard = 'attack';
        } else {
            document.getElementById('boardToggle').classList.remove('hidden');
            document.getElementById('hitMissButtons').classList.remove('hidden');
            document.getElementById('shootButton').classList.add('hidden');
            document.getElementById('attackLabel').textContent = 'Koordinat på ditt brett';
            // In local mode, default to player board
            this.state.activeBoard = 'player';
        }
        
        this.renderGameBoards();
        this.updateGameInfo();
        Input.clearAttackInput();
    },

    renderGameBoards() {
        const playerBoardContainer = document.getElementById('playerBoard');
        const attackBoardContainer = document.getElementById('attackBoard');

        // Show player's board with their ships and enemy attacks
        Board.renderBoard(playerBoardContainer, this.state.playerBoard, this.state.boardSize, { ships: this.state.playerShips });

        // Show attack board (enemy's board without ships, just hits/misses)
        const attackBoardData = this.createAttackBoardData();
        Board.renderBoard(attackBoardContainer, attackBoardData, this.state.boardSize);
    },

    createAttackBoardData() {
        const attackData = Board.createEmptyBoard(this.state.boardSize);
        
        for (let row = 0; row < this.state.boardSize; row++) {
            for (let col = 0; col < this.state.boardSize; col++) {
                attackData[row][col].hit = this.state.attackBoard[row][col].hit;
                attackData[row][col].miss = this.state.attackBoard[row][col].miss;
            }
        }
        
        return attackData;
    },

    toggleBoard(target) {
        this.state.activeBoard = target;

        // Update button states
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-target="${target}"]`).classList.add('selected');

        // Update label
        const label = document.getElementById('attackLabel');
        label.textContent = target === 'player' ? 'Koordinat på ditt brett' : 'Koordinat på motstandar sitt brett';

        // Clear input and feedback
        Input.clearAttackInput();

        // Update which board gets coordinate highlighting
        Input.updateActiveBoard(target);
    },

    shoot() {
        const coord = Input.getAttackCoord();

        if (!coord) {
            alert('Skriv inn ein gyldig koordinat');
            return;
        }

        if (!Board.isValidCoord(coord, this.state.boardSize)) {
            alert('Koordinatet er utanfor brettet');
            return;
        }

        // Check if already attacked
        if (this.state.attackBoard[coord.row][coord.col].hit ||
            this.state.attackBoard[coord.row][coord.col].miss) {
            alert('Du har allereie angripe denne ruten');
            return;
        }

        // Determine if it's a hit (ship at this position)
        const isHit = this.state.enemyBoard[coord.row][coord.col].ship !== null;

        // Record attack
        if (isHit) {
            this.state.attackBoard[coord.row][coord.col].hit = true;
            this.state.enemyBoard[coord.row][coord.col].hit = true;
            this.state.hits++;
            this.checkShipSunk(coord.row, coord.col, this.state.enemyShips);
            alert('🎯 TREFF!');
        } else {
            this.state.attackBoard[coord.row][coord.col].miss = true;
            this.state.enemyBoard[coord.row][coord.col].miss = true;
            this.state.misses++;
            alert('💥 BOM');
        }

        Input.clearAttackInput();
        this.renderGameBoards();
        this.updateGameInfo();

        // Check for game over
        if (this.checkGameOver()) {
            return;
        }

        // AI turn
        setTimeout(() => this.aiTurn(), 500);
    },

    recordAttack(isHit) {
        const coord = Input.getAttackCoord();

        if (!coord) {
            alert('Skriv inn ein gyldig koordinat');
            return;
        }

        if (!Board.isValidCoord(coord, this.state.boardSize)) {
            alert('Koordinatet er utanfor brettet');
            return;
        }

        // Mark on the correct board based on activeBoard
        if (this.state.activeBoard === 'attack') {
            // Mark on attack board (player attacking enemy)
            if (this.state.attackBoard[coord.row][coord.col].hit ||
                this.state.attackBoard[coord.row][coord.col].miss) {
                alert('Du har allereie angripe denne ruten');
                return;
            }

            if (isHit) {
                this.state.attackBoard[coord.row][coord.col].hit = true;
                this.state.enemyBoard[coord.row][coord.col].hit = true;
                this.state.hits++;
                this.checkShipSunk(coord.row, coord.col, this.state.enemyShips);
            } else {
                this.state.attackBoard[coord.row][coord.col].miss = true;
                this.state.enemyBoard[coord.row][coord.col].miss = true;
                this.state.misses++;
            }
        } else {
            // Mark on player board (enemy attacks on player)
            if (this.state.playerBoard[coord.row][coord.col].hit ||
                this.state.playerBoard[coord.row][coord.col].miss) {
                alert('Denne ruten er allereie markert');
                return;
            }

            if (isHit) {
                this.state.playerBoard[coord.row][coord.col].hit = true;
                this.state.enemyAttackBoard[coord.row][coord.col].hit = true;
                this.checkPlayerShipSunk(coord.row, coord.col);
            } else {
                this.state.playerBoard[coord.row][coord.col].miss = true;
                this.state.enemyAttackBoard[coord.row][coord.col].miss = true;
            }
        }

        Input.clearAttackInput();
        this.renderGameBoards();
        this.updateGameInfo();

        // Check for game over
        if (this.checkGameOver()) {
            return;
        }

        // AI turn if in AI mode
        if (this.state.mode === 'ai') {
            setTimeout(() => this.aiTurn(), 500);
        }
    },

    checkShipSunk(row, col, ships) {
        const shipId = this.state.enemyBoard[row][col].ship;
        if (shipId === null || shipId === undefined) return;

        const ship = ships.find(s => s.id === shipId);
        if (ship && Ships.isShipSunk(this.state.enemyBoard, ship.cells)) {
            alert(`Du senka eit skip på ${ship.size} celler!`);
        }
    },

    aiTurn() {
        const coord = AI.getNextAttack(this.state.playerBoard, this.state.boardSize);
        
        if (!coord) {
            alert('AI har ingen fleire moglege treff');
            return;
        }

        const isHit = this.state.playerBoard[coord.row][coord.col].ship !== null;
        
        if (isHit) {
            this.state.playerBoard[coord.row][coord.col].hit = true;
            this.state.enemyAttackBoard[coord.row][coord.col].hit = true;
            
            // Check if ship is sunk
            this.checkPlayerShipSunk(coord.row, coord.col);
        } else {
            this.state.playerBoard[coord.row][coord.col].miss = true;
            this.state.enemyAttackBoard[coord.row][coord.col].miss = true;
        }

        AI.processAttackResult(coord, isHit, this.state.playerBoard, this.state.boardSize);

        this.renderGameBoards();
        this.updateGameInfo();

        // Check for game over
        if (this.checkGameOver()) {
            return;
        }

        // Alert player about AI attack
        const coordStr = Board.formatCoord(coord.col, coord.row);
        alert(`Datamaskinen angrip ${coordStr} – ${isHit ? 'TREFF!' : 'BOM'}`);
    },

    checkPlayerShipSunk(row, col) {
        const shipId = this.state.playerBoard[row][col].ship;
        if (shipId === null || shipId === undefined) return;

        const ship = this.state.playerShips.find(s => s.id === shipId);
        if (ship && Ships.isShipSunk(this.state.playerBoard, ship.cells)) {
            AI.checkShipSunk(ship.cells, this.state.playerBoard);
            alert(`Datamaskinen senka skipet ditt på ${ship.size} celler!`);
        }
    },

    checkGameOver() {
        const playerShipsLeft = Board.countRemainingShips(this.state.playerBoard, this.state.playerShips);
        const enemyShipsLeft = Board.countRemainingShips(this.state.enemyBoard, this.state.enemyShips);

        if (playerShipsLeft === 0 || enemyShipsLeft === 0) {
            this.showGameOver(playerShipsLeft === 0);
            return true;
        }

        return false;
    },

    showGameOver(playerLost) {
        const title = document.getElementById('gameOverTitle');
        const sub = document.getElementById('gameOverSub');
        const hits = document.getElementById('statHits');
        const misses = document.getElementById('statMisses');
        const accuracy = document.getElementById('statAccuracy');

        if (playerLost) {
            title.textContent = 'Du tapte!';
            sub.textContent = 'Datamaskinen senka alle skipa dine';
        } else {
            title.textContent = 'Du vann!';
            sub.textContent = 'Gratulerer - du senka alle fiendens skip!';
        }

        hits.textContent = this.state.hits;
        misses.textContent = this.state.misses;
        
        const total = this.state.hits + this.state.misses;
        const acc = total > 0 ? Math.round((this.state.hits / total) * 100) : 0;
        accuracy.textContent = acc + '%';

        this.showScreen('gameOver');
        Storage.clear();
    },

    updateGameInfo() {
        const playerShipsLeft = Board.countRemainingShips(this.state.playerBoard, this.state.playerShips);
        const enemyShipsLeft = Board.countRemainingShips(this.state.enemyBoard, this.state.enemyShips);

        document.getElementById('playerShipsLeft').textContent = playerShipsLeft;
        document.getElementById('enemyShipsLeft').textContent = enemyShipsLeft;
    },

    saveGame() {
        Storage.save(this.state);
    }
};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
