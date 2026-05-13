// BåreTevling - Board Rendering and Coordinate System
const Board = {
    // Ship image config based on size
    // Each entry is an array of {img, cells} where cells = number of cells this part spans
    shipImages: {
        1: [{ img: 'resources/scooter.png', cells: 1 }],
        2: [{ img: 'resources/sports_red.png', cells: 2 }],
        3: [{ img: 'resources/towtruck.png', cells: 3 }],
        4: [{ img: 'resources/trucktank.png', cells: 4 }],
        5: [{ img: 'resources/trucktank_trailer.png', cells: 2 }, { img: 'resources/trucktank.png', cells: 3 }]
    },

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
        const headerSize = 30;

        // Set grid template using flexible CSS
        container.style.gridTemplateColumns = `${headerSize}px repeat(${size}, minmax(18px, 1fr))`;
        container.style.gridAutoRows = '1fr';
        // Force the first row (headers) to match the header size
        container.style.gridTemplateRows = `${headerSize}px repeat(${size}, minmax(18px, 1fr))`;
        container.style.width = '100%';
        container.style.margin = '0 auto';

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
                    // Add Lucide icon for hit (circle-check)
                    const hitIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    hitIcon.setAttribute('class', 'hit-icon');
                    hitIcon.setAttribute('width', '24');
                    hitIcon.setAttribute('height', '24');
                    hitIcon.setAttribute('viewBox', '0 0 24 24');
                    hitIcon.setAttribute('fill', '#90EE90');
                    hitIcon.setAttribute('stroke', '#000');
                    hitIcon.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>';
                    cell.appendChild(hitIcon);
                }
                if (cellData.miss) {
                    cell.classList.add('miss');
                    // Add Lucide icon for miss (circle-x)
                    const missIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    missIcon.setAttribute('class', 'miss-icon');
                    missIcon.setAttribute('width', '24');
                    missIcon.setAttribute('height', '24');
                    missIcon.setAttribute('viewBox', '0 0 24 24');
                    missIcon.setAttribute('fill', '#ff0000');
                    missIcon.setAttribute('stroke', '#000');
                    missIcon.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>';
                    cell.appendChild(missIcon);
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

        // Render ship images as absolute positioned elements
        if (options.ships) {
            this.renderShipImages(container, boardData, size, options.ships);
        }
    },

    // Helper: get a DOM cell element by row/col
    getCellElement(container, col, row) {
        return container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    },

    // Render ship images spanning multiple cells
    renderShipImages(container, boardData, size, ships) {
        const rendered = new Set();

        for (const ship of ships) {
            if (!ship.placed || !ship.cells || ship.cells.length === 0) continue;
            if (rendered.has(ship.id)) continue;
            rendered.add(ship.id);

            const parts = this.shipImages[ship.size];
            if (!parts) continue;

            // Find bounding box from cells [col, row]
            const cols = ship.cells.map(c => c[0]);
            const rows = ship.cells.map(c => c[1]);
            const minCol = Math.min(...cols);
            const minRow = Math.min(...rows);
            const maxCol = Math.max(...cols);
            const maxRow = Math.max(...rows);

            const isVertical = (minCol === maxCol && minRow !== maxRow);

            // Detect direction: compare first cell to last cell
            const firstCol = ship.cells[0][0];
            const firstRow = ship.cells[0][1];
            const goesNorth = isVertical && firstRow > rows[rows.length - 1];
            const goesWest = !isVertical && firstCol > cols[cols.length - 1];

            // For North/West the "front" of the vehicle is at the min end,
            // so reverse parts order so trailer is at the max end
            const orderedParts = (goesNorth || goesWest) ? [...parts].reverse() : [...parts];

            // Render each image part, always laying out from min corner
            let cellOffset = 0;
            for (const part of orderedParts) {
                let partStartCol, partStartRow, partEndCol, partEndRow;
                if (isVertical) {
                    partStartCol = minCol;
                    partStartRow = minRow + cellOffset;
                    partEndCol = minCol;
                    partEndRow = minRow + cellOffset + part.cells - 1;
                } else {
                    partStartCol = minCol + cellOffset;
                    partStartRow = minRow;
                    partEndCol = minCol + cellOffset + part.cells - 1;
                    partEndRow = minRow;
                }

                const startEl = this.getCellElement(container, partStartCol, partStartRow);
                const endEl = this.getCellElement(container, partEndCol, partEndRow);
                if (!startEl || !endEl) { cellOffset += part.cells; continue; }

                // Get pixel positions from DOM
                const x1 = startEl.offsetLeft;
                const y1 = startEl.offsetTop;
                const x2 = endEl.offsetLeft + endEl.offsetWidth;
                const y2 = endEl.offsetTop + endEl.offsetHeight;

                const spanW = x2 - x1;
                const spanH = y2 - y1;

                const shipImg = document.createElement('img');
                shipImg.src = part.img;
                shipImg.className = 'ship-image-spanning';
                shipImg.style.position = 'absolute';
                shipImg.style.pointerEvents = 'none';
                shipImg.style.zIndex = '10';
                shipImg.style.objectFit = 'contain';

                if (isVertical) {
                    // Image is horizontal; rotate to fit vertical span
                    const cx = x1 + spanW / 2;
                    const cy = y1 + spanH / 2;
                    shipImg.style.width = `${spanH}px`;
                    shipImg.style.height = `${spanW}px`;
                    shipImg.style.left = `${cx - spanH / 2}px`;
                    shipImg.style.top = `${cy - spanW / 2}px`;
                    // South: rotate 90deg (vehicle points down)
                    // North: rotate -90deg (vehicle points up)
                    shipImg.style.transform = goesNorth ? 'rotate(-90deg)' : 'rotate(90deg)';
                } else {
                    shipImg.style.left = `${x1}px`;
                    shipImg.style.top = `${y1}px`;
                    shipImg.style.width = `${spanW}px`;
                    shipImg.style.height = `${spanH}px`;
                    // West: flip horizontally
                    if (goesWest) {
                        shipImg.style.transform = 'scaleX(-1)';
                    }
                }

                container.appendChild(shipImg);
                cellOffset += part.cells;
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
