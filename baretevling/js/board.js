// BåreTevling - Board Rendering and Coordinate System
const Board = {
    // Convert column number to letter (0 -> A, 25 -> Z, 26 -> AA, etc.)
    colToLetter(col) {
        let letter = '';
        let num = col;
        while (num >= 0) {
            letter = String.fromCharCode((num % 26) + 65) + letter;
            num = Math.floor(num / 26) - 1;
        }
        return letter;
    },

    // Convert letter to column number (A -> 0, Z -> 25, AA -> 26, etc.)
    letterToCol(letter) {
        let col = 0;
        for (let i = 0; i < letter.length; i++) {
            col = col * 26 + (letter.charCodeAt(i) - 64);
        }
        return col - 1;
    },

    // Parse coordinate string (e.g., "A1" -> {col: 0, row: 0})
    parseCoord(coordStr) {
        if (!coordStr || coordStr.length === 0) return null;
        
        coordStr = coordStr.toUpperCase();
        const match = coordStr.match(/^([A-Z]+)(\d+)$/);
        if (!match) return null;
        
        const col = this.letterToCol(match[1]);
        const row = parseInt(match[2]) - 1;
        
        return { col, row, letter: match[1], number: match[2] };
    },

    // Format coordinate from col/row (e.g., {col: 0, row: 0} -> "A1")
    formatCoord(col, row) {
        return this.colToLetter(col) + (row + 1);
    },

    // Check if coordinate is valid for given board size
    isValidCoord(coord, boardSize) {
        return coord && 
               coord.col >= 0 && coord.col < boardSize && 
               coord.row >= 0 && coord.row < boardSize;
    },

    // Create empty board data
    createEmptyBoard(size) {
        const board = [];
        for (let row = 0; row < size; row++) {
            board[row] = [];
            for (let col = 0; col < size; col++) {
                board[row][col] = {
                    ship: null,
                    hit: false,
                    miss: false
                };
            }
        }
        return board;
    },

    // Render board to DOM
    renderBoard(container, boardData, size, options = {}) {
        container.innerHTML = '';
        
        // Calculate cell size based on available space
        const containerWidth = container.clientWidth || 400;
        const maxCellSize = 50;
        const minCellSize = 25;
        const headerSize = 30;
        
        const availableWidth = containerWidth - headerSize;
        const availableHeight = window.innerHeight * 0.5 - headerSize;
        
        let cellSize = Math.min(
            availableWidth / size,
            availableHeight / size,
            maxCellSize
        );
        cellSize = Math.max(cellSize, minCellSize);
        
        // Set grid template
        container.style.gridTemplateColumns = `${headerSize}px repeat(${size}, ${cellSize}px)`;
        container.style.gridTemplateRows = `${headerSize}px repeat(${size}, ${cellSize}px)`;
        
        // Corner cell
        const corner = document.createElement('div');
        corner.className = 'cell header-corner';
        container.appendChild(corner);
        
        // Column headers
        for (let col = 0; col < size; col++) {
            const header = document.createElement('div');
            header.className = 'cell header-col';
            header.textContent = this.colToLetter(col);
            header.dataset.col = col;
            container.appendChild(header);
        }
        
        // Row headers and cells
        for (let row = 0; row < size; row++) {
            // Row header
            const rowHeader = document.createElement('div');
            rowHeader.className = 'cell header-row';
            rowHeader.textContent = row + 1;
            rowHeader.dataset.row = row;
            container.appendChild(rowHeader);
            
            // Cells
            for (let col = 0; col < size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.col = col;
                cell.dataset.row = row;
                cell.dataset.coord = this.formatCoord(col, row);
                
                // Apply cell state
                const cellData = boardData[row][col];
                if (cellData.ship !== null && cellData.ship !== undefined) {
                    cell.classList.add('ship');
                    if (cellData.hit) {
                        cell.classList.add('ship-hit');
                    }
                }
                if (cellData.hit) {
                    cell.classList.add('hit');
                }
                if (cellData.miss) {
                    cell.classList.add('miss');
                }
                
                // Apply preview if provided
                if (options.previewCells) {
                    const coordKey = `${col},${row}`;
                    if (options.previewCells.valid && options.previewCells.valid.includes(coordKey)) {
                        cell.classList.add('preview-valid');
                    }
                    if (options.previewCells.invalid && options.previewCells.invalid.includes(coordKey)) {
                        cell.classList.add('preview-invalid');
                    }
                }
                
                container.appendChild(cell);
            }
        }
    },

    // Highlight column, row, and cell based on input
    highlightCoordinates(container, input) {
        // Clear previous highlights
        container.querySelectorAll('.col-highlight, .row-highlight, .cell-highlight').forEach(el => {
            el.classList.remove('col-highlight', 'row-highlight', 'cell-highlight');
        });
        
        if (!input) return;
        
        const coord = this.parseCoord(input);
        if (!coord) {
            // If only letters, highlight column
            const letterMatch = input.match(/^([A-Z]+)$/);
            if (letterMatch) {
                const col = this.letterToCol(letterMatch[1]);
                container.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
                    el.classList.add('col-highlight');
                });
            }
            return;
        }
        
        // Highlight column
        container.querySelectorAll(`[data-col="${coord.col}"]`).forEach(el => {
            el.classList.add('col-highlight');
        });
        
        // Highlight row
        container.querySelectorAll(`[data-row="${coord.row}"]`).forEach(el => {
            el.classList.add('row-highlight');
        });
        
        // Highlight specific cell
        const cell = container.querySelector(`[data-col="${coord.col}"][data-row="${coord.row}"]`);
        if (cell) {
            cell.classList.add('cell-highlight');
        }
    },

    // Get cell element by coordinate
    getCell(container, col, row) {
        return container.querySelector(`[data-col="${col}"][data-row="${row}"]`);
    },

    // Mark cell as hit
    markHit(container, col, row) {
        const cell = this.getCell(container, col, row);
        if (cell) {
            cell.classList.add('hit');
        }
    },

    // Mark cell as miss
    markMiss(container, col, row) {
        const cell = this.getCell(container, col, row);
        if (cell) {
            cell.classList.add('miss');
        }
    },

    // Check if all ships are placed
    checkAllShipsPlaced(boardData) {
        for (let row = 0; row < boardData.length; row++) {
            for (let col = 0; col < boardData[row].length; col++) {
                if (boardData[row][col].ship !== null && boardData[row][col].ship !== undefined && !boardData[row][col].hit) {
                    return false;
                }
            }
        }
        return true;
    },

    // Check if all ships are sunk
    allShipsSunk(boardData) {
        for (let row = 0; row < boardData.length; row++) {
            for (let col = 0; col < boardData[row].length; col++) {
                if (boardData[row][col].ship !== null && boardData[row][col].ship !== undefined && !boardData[row][col].hit) {
                    return false;
                }
            }
        }
        return true;
    },

    // Count remaining ships
    countRemainingShips(boardData, ships) {
        let remaining = 0;
        ships.forEach(ship => {
            let hits = 0;
            ship.cells.forEach(([col, row]) => {
                if (boardData[row][col].hit) hits++;
            });
            if (hits < ship.size) remaining++;
        });
        return remaining;
    }
};
