// Heimsank - State Management

// Global state object
const S = {
  cats: [],           // Available categories
  selCat: null,      // Selected category
  level: 'middels',  // Difficulty level
  ops: ['*', '/'],     // Active operations
  cards: [],         // All cards for current category
  groups: {          // Cards grouped by rarity
    vanleg: [],
    sjeldgjevt: [],
    segngjeten: [],
    gudebore: []
  },
  idx: {},           // Card lookup by ID
  correct: 0,        // Correct answers count
  q: null,           // Current question
  collection: [],    // [{catId, cardId, difficulty, operations, earnedAt}]
  pending: null,     // Card object when waiting for drop decision
  paused: false      // Game paused state
};

// Rarity labels (Nynorsk)
const RL = {
  vanleg: 'Vanleg',
  sjeldgjevt: 'Sjeldgjævt',
  segngjeten: 'Segngjeten',
  gudebore: 'Gudebore'
};

// Rarity order and weights
const RO = ['vanleg', 'sjeldgjevt', 'segngjeten', 'gudebore'];
const RW = [65, 25, 7, 3];

// Questions per card
const QPC = 6;

// Drag state
let DS = null; // {type:'coll'|'pending', idx:number}

// Export for modules (if using ES modules later)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { S, RL, RO, RW, QPC, DS };
}
