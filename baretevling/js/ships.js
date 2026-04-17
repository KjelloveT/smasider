// BåreTevling - Ship Placement and Configuration
const Ships = {
    // Direction vectors
    directions: {
        'N': { col: 0, row: -1 },
        'S': { col: 0, row: 1 },
        'Ø': { col: 1, row: 0 },
        'V': { col: -1, row: 0 }
    },

    // Get ship cells based on start position and direction
    getShipCells(startCoord, size, direction, boardSize) {
        const cells = [];
        const dir = this.directions[direction];
        
        for (let i = 0; i < size; i++) {
            const col = startCoord.col + dir.col * i;
            const row = startCoord.row + dir.row * i;
            
            // Check if cell is within board bounds
            if (col < 0 || col >= boardSize || row < 0 || row >= boardSize) {
                return null; // Ship would be out of bounds
            }
            
            cells.push([col, row]);
        }
        
        return cells;
    },

    // Check if ship placement is valid (no overlap with existing ships)
    isValidPlacement(cells, boardData) {
        for (const [col, row] of cells) {
            // Check if cell already has a ship
            if (boardData[row][col].ship !== null && boardData[row][col].ship !== undefined) {
                return false;
            }
        }
        return true;
    },

    // Place ship on board
    placeShip(boardData, cells, shipId) {
        for (const [col, row] of cells) {
            boardData[row][col].ship = shipId;
        }
    },

    // Remove ship from board
    removeShip(boardData, shipId) {
        for (let row = 0; row < boardData.length; row++) {
            for (let col = 0; col < boardData[row].length; col++) {
                if (boardData[row][col].ship === shipId) {
                    boardData[row][col].ship = null;
                }
            }
        }
    },

    // Check if ship is sunk
    isShipSunk(boardData, cells) {
        for (const [col, row] of cells) {
            if (!boardData[row][col].hit) {
                return false;
            }
        }
        return true;
    },

    // Get ship configuration from UI inputs
    getShipConfig() {
        const config = {};
        document.querySelectorAll('.ship-input').forEach(input => {
            const size = parseInt(input.dataset.size);
            const count = parseInt(input.value) || 0;
            config[size] = count;
        });
        return config;
    },

    // Generate ship list from configuration
    generateShipList(config) {
        const ships = [];
        let shipId = 0;
        
        // Sort sizes in descending order
        const sizes = Object.keys(config).map(Number).sort((a, b) => b - a);
        
        for (const size of sizes) {
            for (let i = 0; i < config[size]; i++) {
                ships.push({
                    id: shipId++,
                    size: size,
                    cells: [],
                    placed: false
                });
            }
        }
        
        return ships;
    },

    // Auto-place all ships randomly
    autoPlaceShips(boardData, ships, boardSize) {
        const directions = ['N', 'S', 'Ø', 'V'];
        const placedShips = [];
        
        // Sort ships by size (largest first) for better placement
        const sortedShips = [...ships].sort((a, b) => b.size - a.size);
        
        for (const ship of sortedShips) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 1000;
            
            while (!placed && attempts < maxAttempts) {
                attempts++;
                
                // Random start position
                const startCol = Math.floor(Math.random() * boardSize);
                const startRow = Math.floor(Math.random() * boardSize);
                const startCoord = { col: startCol, row: startRow };
                
                // Random direction
                const direction = directions[Math.floor(Math.random() * directions.length)];
                
                // Get ship cells
                const cells = this.getShipCells(startCoord, ship.size, direction, boardSize);
                
                if (cells && this.isValidPlacement(cells, boardData)) {
                    // Place the ship
                    this.placeShip(boardData, cells, ship.id);
                    ship.cells = cells;
                    ship.placed = true;
                    placedShips.push(ship);
                    placed = true;
                }
            }
            
            if (!placed) {
                console.error(`Failed to place ship of size ${ship.size} after ${maxAttempts} attempts`);
                return null;
            }
        }
        
        return placedShips;
    },

    // Validate ship placement before placing
    validatePlacement(startCoord, size, direction, boardData, boardSize) {
        // Check if start coordinate is valid
        if (!Board.isValidCoord(startCoord, boardSize)) {
            return { valid: false, message: 'Ugyldig koordinat' };
        }
        
        // Check if direction is valid
        if (!this.directions[direction]) {
            return { valid: false, message: 'Ugyldig himmelretning' };
        }
        
        // Get ship cells
        const cells = this.getShipCells(startCoord, size, direction, boardSize);
        
        if (!cells) {
            return { valid: false, message: 'Skipet går utanfor brettet' };
        }
        
        // Check for overlap
        if (!this.isValidPlacement(cells, boardData)) {
            return { valid: false, message: 'Skipet overlappar med eit anna skip' };
        }
        
        return { valid: true, cells };
    },

    // Render ship preview
    renderShipPreview(container, size) {
        container.innerHTML = '';
        const parts = Board.shipImages[size];
        if (parts) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.gap = '2px';
            wrapper.style.alignItems = 'center';
            for (const part of parts) {
                const img = document.createElement('img');
                img.src = part.img;
                img.alt = `Skip (${size})`;
                img.style.maxHeight = '60px';
                img.style.width = 'auto';
                wrapper.appendChild(img);
            }
            container.appendChild(wrapper);
        } else {
            for (let i = 0; i < size; i++) {
                const cell = document.createElement('div');
                cell.className = 'ship-preview-cell';
                container.appendChild(cell);
            }
        }
    }
};
