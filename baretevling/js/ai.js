// BåreTevling - Algorithm for Single-Player Mode (datamaskinen)
const AI = {
    // Track state
    state: {
        targetQueue: [], // Queue of cells to check around hits
        huntedShips: [], // Ships currently being hunted
        randomMode: true,
        hitAxis: null,   // 'horizontal' | 'vertical' | null
        hitCells: []     // Cells hit during current hunt sequence
    },

    // Reset state
    reset() {
        this.state = {
            targetQueue: [],
            huntedShips: [],
            randomMode: true,
            hitAxis: null,
            hitCells: []
        };
    },

    // Get next attack coordinate
    getNextAttack(playerBoard, boardSize) {
        // If we have targets in queue, use them
        if (this.state.targetQueue.length > 0) {
            return this.state.targetQueue.shift();
        }

        // Random attack
        return this.getRandomAttack(playerBoard, boardSize);
    },

    // Get random unattacked cell
    getRandomAttack(playerBoard, boardSize) {
        const unattacked = [];
        
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (!playerBoard[row][col].hit && !playerBoard[row][col].miss) {
                    unattacked.push({ col, row });
                }
            }
        }

        if (unattacked.length === 0) return null;

        // Prefer cells that could fit remaining player ships
        const weighted = unattacked.map(cell => {
            let weight = 1;
            
            // Check if this cell is part of a potential ship placement
            for (const ship of Game.state.playerShips) {
                if (this.couldFitShip(cell, ship.size, playerBoard, boardSize)) {
                    weight += ship.size;
                }
            }
            
            return { cell, weight };
        });

        // Weighted random selection
        const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const { cell, weight } of weighted) {
            random -= weight;
            if (random <= 0) {
                return cell;
            }
        }

        return weighted[weighted.length - 1].cell;
    },

    // Check if a ship could fit at this position
    couldFitShip(startCell, size, board, boardSize) {
        const directions = ['N', 'S', 'Ø', 'V'];
        
        for (const dir of directions) {
            const cells = Ships.getShipCells(startCell, size, dir, boardSize);
            if (cells && Ships.isValidPlacement(cells, board)) {
                return true;
            }
        }
        
        return false;
    },

    // Process attack result and update hunt state
    processAttackResult(coord, isHit, playerBoard, boardSize) {
        if (isHit) {
            this.state.hitCells.push(coord);
            this.state.randomMode = false;

            if (this.state.hitCells.length >= 2) {
                // Determine axis from first two hits
                const c1 = this.state.hitCells[0];
                const c2 = this.state.hitCells[1];
                this.state.hitAxis = (c1.row === c2.row) ? 'horizontal' : 'vertical';
                // Rebuild queue along detected axis only
                this.rebuildAxisQueue(playerBoard, boardSize);
            } else {
                // First hit – add all four adjacent cells
                this.addAdjacentTargets(coord, playerBoard, boardSize);
            }
        } else {
            // If no more targets, switch to random mode
            if (this.state.targetQueue.length === 0) {
                this.state.randomMode = true;
            }
        }
    },

    // Rebuild target queue along the locked axis (called after axis is determined)
    rebuildAxisQueue(board, boardSize) {
        this.state.targetQueue = [];
        const cells = this.state.hitCells;

        if (this.state.hitAxis === 'horizontal') {
            const row = cells[0].row;
            const cols = cells.map(c => c.col);
            const minCol = Math.min(...cols);
            const maxCol = Math.max(...cols);

            if (minCol - 1 >= 0 && !board[row][minCol - 1].hit && !board[row][minCol - 1].miss) {
                this.state.targetQueue.push({ col: minCol - 1, row });
            }
            if (maxCol + 1 < boardSize && !board[row][maxCol + 1].hit && !board[row][maxCol + 1].miss) {
                this.state.targetQueue.push({ col: maxCol + 1, row });
            }
        } else {
            const col = cells[0].col;
            const rows = cells.map(c => c.row);
            const minRow = Math.min(...rows);
            const maxRow = Math.max(...rows);

            if (minRow - 1 >= 0 && !board[minRow - 1][col].hit && !board[minRow - 1][col].miss) {
                this.state.targetQueue.push({ col, row: minRow - 1 });
            }
            if (maxRow + 1 < boardSize && !board[maxRow + 1][col].hit && !board[maxRow + 1][col].miss) {
                this.state.targetQueue.push({ col, row: maxRow + 1 });
            }
        }
    },

    // Add adjacent cells to target queue (used on first hit before axis is known)
    addAdjacentTargets(coord, board, boardSize) {
        const directions = [
            { col: 0, row: -1 }, // N
            { col: 0, row: 1 },  // S
            { col: 1, row: 0 },  // Ø
            { col: -1, row: 0 }  // V
        ];

        for (const dir of directions) {
            const newCol = coord.col + dir.col;
            const newRow = coord.row + dir.row;

            // Check bounds
            if (newCol >= 0 && newCol < boardSize && newRow >= 0 && newRow < boardSize) {
                // Check if not already attacked
                if (!board[newRow][newCol].hit && !board[newRow][newCol].miss) {
                    // Check if not already in queue
                    const alreadyQueued = this.state.targetQueue.some(
                        c => c.col === newCol && c.row === newRow
                    );
                    
                    if (!alreadyQueued) {
                        this.state.targetQueue.push({ col: newCol, row: newRow });
                    }
                }
            }
        }
    },

    // Check if a ship is sunk and clean up queue
    checkShipSunk(shipCells, board) {
        if (!Ships.isShipSunk(board, shipCells)) return;

        // Reset hunt axis state for next ship
        this.state.hitAxis = null;
        this.state.hitCells = [];

        // Remove cells around this ship from target queue
        this.state.targetQueue = this.state.targetQueue.filter(target => {
            // Keep target if it's not adjacent to the sunk ship
            for (const [shipCol, shipRow] of shipCells) {
                const colDiff = Math.abs(target.col - shipCol);
                const rowDiff = Math.abs(target.row - shipRow);
                
                // If adjacent (including diagonal), remove from queue
                if (colDiff <= 1 && rowDiff <= 1) {
                    return false;
                }
            }
            return true;
        });

        // If queue is empty, switch to random mode
        if (this.state.targetQueue.length === 0) {
            this.state.randomMode = true;
        }
    }
};
