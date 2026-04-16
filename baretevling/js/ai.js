// BåreTevling - AI Algorithm for Single-Player Mode
const AI = {
    // Track AI state
    state: {
        targetQueue: [], // Queue of cells to check around hits
        huntedShips: [], // Ships currently being hunted
        randomMode: true
    },

    // Reset AI state
    reset() {
        this.state = {
            targetQueue: [],
            huntedShips: [],
            randomMode: true
        };
    },

    // Get AI's next attack coordinate
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

        // Prefer cells that could fit remaining ships
        const weighted = unattacked.map(cell => {
            let weight = 1;
            
            // Check if this cell is part of a potential ship placement
            for (const ship of Game.state.enemyShips) {
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

    // Process AI attack result
    processAttackResult(coord, isHit, playerBoard, boardSize) {
        if (isHit) {
            // Add adjacent cells to target queue
            this.addAdjacentTargets(coord, playerBoard, boardSize);
            this.state.randomMode = false;
        } else {
            // If no more targets, switch to random mode
            if (this.state.targetQueue.length === 0) {
                this.state.randomMode = true;
            }
        }
    },

    // Add adjacent cells to target queue
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

    // Check if a ship is sunk and remove its cells from queue
    checkShipSunk(shipCells, board) {
        if (!Ships.isShipSunk(board, shipCells)) return;

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
