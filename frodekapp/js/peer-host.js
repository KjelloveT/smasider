/* ══════════════════════════════════════════════
   FRØDEKAPP — PeerJS Vert-kommunikasjon
   Handterer romoppretting og P2P-tilkoplingar
   ══════════════════════════════════════════════ */

class PeerHost {
    /**
     * @param {string} roomCode
     * @param {object} callbacks - { onPlayerJoin, onPlayerLeave, onPlayerMessage, onReady, onError }
     */
    constructor(roomCode, callbacks) {
        this.roomCode = roomCode;
        this.peerId = 'fk-' + roomCode;
        this.callbacks = callbacks;
        this.connections = new Map(); // playerId → { conn, name }
        this.peer = null;
        this.destroyed = false;

        this._initPeer();
    }

    _initPeer() {
        this.peer = new Peer(this.peerId, {
            debug: 0
        });

        this.peer.on('open', (id) => {
            console.log('[PeerHost] Opna med ID:', id);
            if (this.callbacks.onReady) this.callbacks.onReady(this.roomCode);
        });

        this.peer.on('connection', (conn) => {
            this._handleConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('[PeerHost] Feil:', err.type, err.message);
            if (err.type === 'unavailable-id') {
                if (this.callbacks.onError) this.callbacks.onError('Romkoden er allereie i bruk. Prøv ein annan.');
            } else if (err.type === 'network' || err.type === 'server-error') {
                if (this.callbacks.onError) this.callbacks.onError('Kunne ikkje koble til signaltenesta. Sjekk internett-tilkoplinga.');
            } else {
                if (this.callbacks.onError) this.callbacks.onError('Tilkoplingsfeil: ' + err.type);
            }
        });

        this.peer.on('disconnected', () => {
            console.log('[PeerHost] Fråkopla frå signalserver. Prøver å koble til igjen...');
            if (!this.destroyed) {
                setTimeout(() => {
                    if (!this.destroyed && this.peer && !this.peer.destroyed) {
                        this.peer.reconnect();
                    }
                }, 2000);
            }
        });
    }

    _handleConnection(conn) {
        conn.on('open', () => {
            console.log('[PeerHost] Ny tilkopling:', conn.peer);
        });

        conn.on('data', (data) => {
            if (data.type === 'join') {
                const playerId = data.playerId || conn.peer;
                this.connections.set(playerId, { conn, name: data.name });

                // Send velkommen
                conn.send({
                    type: 'welcome',
                    playerId: playerId,
                    players: this.getPlayerList()
                });

                // Varsle alle andre
                this.broadcast({
                    type: 'player-joined',
                    name: data.name,
                    count: this.connections.size
                }, playerId);

                if (this.callbacks.onPlayerJoin) {
                    this.callbacks.onPlayerJoin({ id: playerId, name: data.name });
                }
            } else {
                // Andre meldingar (t.d. svar)
                const playerId = this._findPlayerByConn(conn);
                if (this.callbacks.onPlayerMessage) {
                    this.callbacks.onPlayerMessage(playerId, data);
                }
            }
        });

        conn.on('close', () => {
            const playerId = this._findPlayerByConn(conn);
            if (playerId) {
                const playerName = this.connections.get(playerId)?.name;
                this.connections.delete(playerId);

                this.broadcast({
                    type: 'player-left',
                    name: playerName,
                    count: this.connections.size
                });

                if (this.callbacks.onPlayerLeave) {
                    this.callbacks.onPlayerLeave({ id: playerId, name: playerName });
                }
            }
        });

        conn.on('error', (err) => {
            console.error('[PeerHost] Tilkoplingsfeil:', err);
        });
    }

    _findPlayerByConn(conn) {
        for (const [id, data] of this.connections) {
            if (data.conn === conn) return id;
        }
        return null;
    }

    /**
     * Send melding til alle spelarar
     * @param {object} data
     * @param {string} [exceptId] - Utelat denne spelaren
     */
    broadcast(data, exceptId = null) {
        for (const [id, { conn }] of this.connections) {
            if (id !== exceptId && conn.open) {
                try { conn.send(data); } catch (e) { console.error('[PeerHost] Send feil:', e); }
            }
        }
    }

    /**
     * Send melding til éin spelar
     * @param {string} playerId
     * @param {object} data
     */
    sendTo(playerId, data) {
        const entry = this.connections.get(playerId);
        if (entry && entry.conn.open) {
            try { entry.conn.send(data); } catch (e) { console.error('[PeerHost] Send feil:', e); }
        }
    }

    /**
     * Hent liste av tilkopla spelarar
     * @returns {Array} [{id, name}]
     */
    getPlayerList() {
        return Array.from(this.connections).map(([id, { name }]) => ({ id, name }));
    }

    /**
     * Hent antal tilkopla spelarar
     * @returns {number}
     */
    getPlayerCount() {
        return this.connections.size;
    }

    /**
     * Avslutt og rydd opp
     */
    destroy() {
        this.destroyed = true;
        this.connections.forEach(({ conn }) => {
            try { conn.close(); } catch (e) { /* ignorer */ }
        });
        this.connections.clear();
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) { /* ignorer */ }
        }
    }
}
