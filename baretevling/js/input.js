// BåreTevling - Coordinate Input Handling and Visual Feedback
const Input = {
    currentDirection: null,

    init() {
        this.setupPlacementInput();
        this.setupAttackInput();
    },

    setupPlacementInput() {
        const coordInput = document.getElementById('placementCoord');
        const feedback = document.getElementById('placementFeedback');
        
        coordInput.addEventListener('input', (e) => {
            const value = e.target.value.toUpperCase();
            const boardContainer = document.getElementById('placementBoard');
            
            // Highlight coordinates
            Board.highlightCoordinates(boardContainer, value);
            
            // Validate coordinate
            const coord = Board.parseCoord(value);
            if (coord) {
                feedback.textContent = `Koordinat: ${value}`;
                feedback.className = 'coord-feedback valid';
            } else if (value.length > 0) {
                const letterMatch = value.match(/^([A-Z]+)$/);
                if (letterMatch) {
                    feedback.textContent = `Kolonne: ${value}`;
                    feedback.className = 'coord-feedback valid';
                } else {
                    feedback.textContent = 'Ugyldig koordinat';
                    feedback.className = 'coord-feedback invalid';
                }
            } else {
                feedback.textContent = '';
                feedback.className = 'coord-feedback';
            }
        });

        // Direction buttons
        document.querySelectorAll('.dir-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.currentDirection = btn.dataset.dir;
                this.updatePreview();
            });
        });
    },

    setupAttackInput() {
        const coordInput = document.getElementById('attackCoord');
        const feedback = document.getElementById('attackFeedback');

        coordInput.addEventListener('input', (e) => {
            const value = e.target.value.toUpperCase();
            const boardContainer = this.getActiveBoardContainer();

            // Highlight coordinates
            Board.highlightCoordinates(boardContainer, value);

            // Validate coordinate
            const coord = Board.parseCoord(value);
            if (coord) {
                feedback.textContent = `Koordinat: ${value}`;
                feedback.className = 'coord-feedback valid';
            } else if (value.length > 0) {
                const letterMatch = value.match(/^([A-Z]+)$/);
                if (letterMatch) {
                    feedback.textContent = `Kolonne: ${value}`;
                    feedback.className = 'coord-feedback valid';
                } else {
                    feedback.textContent = 'Ugyldig koordinat';
                    feedback.className = 'coord-feedback invalid';
                }
            } else {
                feedback.textContent = '';
                feedback.className = 'coord-feedback';
            }
        });
    },

    getActiveBoardContainer() {
        return Game.state.activeBoard === 'attack' 
            ? document.getElementById('attackBoard') 
            : document.getElementById('playerBoard');
    },

    updateActiveBoard(target) {
        // This is called when the board toggle is changed
        // The next input event will use the new active board
    },

    updatePreview() {
        const coordInput = document.getElementById('placementCoord');
        const value = coordInput.value.toUpperCase();
        const coord = Board.parseCoord(value);
        
        if (!coord || !this.currentDirection) {
            return;
        }
        
        const boardSize = Game.state.boardSize;
        const ships = Game.state.currentPlayer === 1 ? Game.state.playerShips : Game.state.enemyShips;
        const currentShip = ships[Game.state.currentShipIndex];
        
        if (!currentShip) {
            return;
        }
        
        const boardData = Game.state.currentPlayer === 1 ? Game.state.playerBoard : Game.state.enemyBoard;
        
        const validation = Ships.validatePlacement(
            coord,
            currentShip.size,
            this.currentDirection,
            boardData,
            boardSize
        );
        
        const boardContainer = document.getElementById('placementBoard');
        
        if (validation.valid) {
            const validCells = validation.cells.map(([c, r]) => `${c},${r}`);
            Board.renderBoard(boardContainer, boardData, boardSize, {
                previewCells: { valid: validCells }
            });
        } else {
            Board.renderBoard(boardContainer, boardData, boardSize);
        }
    },

    getPlacementCoord() {
        const coordInput = document.getElementById('placementCoord');
        const value = coordInput.value.toUpperCase();
        return Board.parseCoord(value);
    },

    getAttackCoord() {
        const coordInput = document.getElementById('attackCoord');
        const value = coordInput.value.toUpperCase();
        return Board.parseCoord(value);
    },

    clearPlacementInput() {
        const coordInput = document.getElementById('placementCoord');
        const feedback = document.getElementById('placementFeedback');
        coordInput.value = '';
        feedback.textContent = '';
        feedback.className = 'coord-feedback';
        this.currentDirection = null;
        document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('selected'));
    },

    clearAttackInput() {
        const coordInput = document.getElementById('attackCoord');
        const feedback = document.getElementById('attackFeedback');
        coordInput.value = '';
        feedback.textContent = '';
        feedback.className = 'coord-feedback';
    }
};
