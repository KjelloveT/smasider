/* ══════════════════════════════════════════════
   FRØDEKAPP — PeerJS Spelar-kommunikasjon
   Kobler til verten sin Peer-ID via romkode
   ══════════════════════════════════════════════ */

class PeerPlayer {
    /**
     * @param {string} roomCode
     * @param {string} playerName
     * @param {object} callbacks - { onConnected, onMessage, onDisconnected, onError }
     */
    constructor(roomCode, playerName, callbacks) {
        this.roomCode = roomCode;
        this.hostPeerId = 'fk-' + roomCode;
        this.playerName = playerName;
        this.playerId = QuizEngine.generatePlayerId();
        this.callbacks = callbacks;
        this.peer = null;
        this.conn = null;
        this.destroyed = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this._initPeer();
    }

    _initPeer() {
        this.peer = new Peer(undefined, {
            debug: 0
        });

        this.peer.on('open', () => {
            console.log('[PeerPlayer] Peer opna, koplar til vert:', this.hostPeerId);
            this._connectToHost();
        });

        this.peer.on('error', (err) => {
            console.error('[PeerPlayer] Feil:', err.type, err.message);
            if (err.type === 'peer-unavailable') {
                if (this.callbacks.onError) this.callbacks.onError('Fann ikkje rommet. Sjekk at romkoden er rett og at verten er tilkopla.');
            } else if (err.type === 'network' || err.type === 'server-error') {
                if (this.callbacks.onError) this.callbacks.onError('Kunne ikkje koble til signaltenesta. Sjekk internett-tilkoplinga.');
            } else {
                if (this.callbacks.onError) this.callbacks.onError('Tilkoplingsfeil: ' + err.type);
            }
        });

        this.peer.on('disconnected', () => {
            console.log('[PeerPlayer] Fråkopla frå signalserver');
            if (!this.destroyed) {
                setTimeout(() => {
                    if (!this.destroyed && this.peer && !this.peer.destroyed) {
                        this.peer.reconnect();
                    }
                }, 2000);
            }
        });
    }

    _connectToHost() {
        this.conn = this.peer.connect(this.hostPeerId, {
            reliable: true
        });

        this.conn.on('open', () => {
            console.log('[PeerPlayer] Kopla til vert!');
            this.reconnectAttempts = 0;

            // Send join-melding
            this.conn.send({
                type: 'join',
                playerId: this.playerId,
                name: this.playerName
            });
        });

        this.conn.on('data', (data) => {
            if (data.type === 'welcome') {
                this.playerId = data.playerId || this.playerId;
                if (this.callbacks.onConnected) {
                    this.callbacks.onConnected(this.playerId, data.players);
                }
            } else {
                if (this.callbacks.onMessage) {
                    this.callbacks.onMessage(data);
                }
            }
        });

        this.conn.on('close', () => {
            console.log('[PeerPlayer] Tilkopling til vert lukka');
            if (!this.destroyed) {
                if (this.callbacks.onDisconnected) this.callbacks.onDisconnected();
                this._tryReconnect();
            }
        });

        this.conn.on('error', (err) => {
            console.error('[PeerPlayer] Tilkoplingsfeil:', err);
        });
    }

    _tryReconnect() {
        if (this.destroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
            if (this.callbacks.onError) this.callbacks.onError('Mista tilkoplinga til verten. Prøv å laste sida på nytt.');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * this.reconnectAttempts, 5000);
        console.log(`[PeerPlayer] Prøver å koble til igjen (${this.reconnectAttempts}/${this.maxReconnectAttempts}) om ${delay}ms`);

        setTimeout(() => {
            if (!this.destroyed && this.peer && !this.peer.destroyed) {
                this._connectToHost();
            }
        }, delay);
    }

    /**
     * Send melding til verten
     * @param {object} data
     */
    send(data) {
        if (this.conn && this.conn.open) {
            try {
                this.conn.send(data);
            } catch (e) {
                console.error('[PeerPlayer] Send feil:', e);
            }
        }
    }

    /**
     * Avslutt og rydd opp
     */
    destroy() {
        this.destroyed = true;
        if (this.conn) {
            try { this.conn.close(); } catch (e) { /* ignorer */ }
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) { /* ignorer */ }
        }
    }
}
