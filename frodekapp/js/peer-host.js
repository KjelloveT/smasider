/* ══════════════════════════════════════════════
   FRØDEKAPP — PeerJS Vert-kommunikasjon
   Handterer romoppretting og P2P-tilkoplingar
   ══════════════════════════════════════════════ */

const FK_MAX_PLAYER_NAME_LENGTH = 20;
const FK_MAX_PEER_ID_LENGTH = 128;

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
        this.serverIndex = 0;
        this.opened = false;
        this.openTimer = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this._initPeer();
    }

    _initPeer() {
        const options = FKPeerConfig.optionsFor(this.serverIndex);
        console.log('[PeerHost] Koplar til signalvert:', options.host);
        const peer = new Peer(this.peerId, options);
        this.peer = peer;

        // Ein utgått peer held fram med å sende hendingar etter at vi har gått
        // vidare til neste vert. Utan denne sjekken ville dei handterast som om
        // dei kom frå den peer-en vi faktisk brukar no.
        const utgått = () => this.destroyed || this.peer !== peer;

        // Ein hengande signalvert gjev inga error-hending — då må vi sjølve gje opp.
        this.openTimer = setTimeout(() => {
            console.warn('[PeerHost] Signalverten svarte ikkje innan tidsfristen:', options.host);
            this._handleServerFailure('Kunne ikkje koble til signaltenesta. Sjekk internett-tilkoplinga.');
        }, FKPeerConfig.OPEN_TIMEOUT_MS);

        peer.on('open', (id) => {
            if (utgått()) return;
            this._clearOpenTimer();
            this.opened = true;
            this.reconnectAttempts = 0;
            console.log('[PeerHost] Opna med ID:', id);
            if (this.callbacks.onReady) this.callbacks.onReady(this.roomCode);
        });

        peer.on('connection', (conn) => {
            if (utgått()) return;
            this._handleConnection(conn);
        });

        peer.on('error', (err) => {
            if (utgått()) return;
            console.error('[PeerHost] Feil:', err.type, err.message);
            if (err.type === 'unavailable-id') {
                this._clearOpenTimer();
                if (this.callbacks.onError) this.callbacks.onError('Romkoden er allereie i bruk. Prøv ein annan.');
            } else if (err.type === 'network' || err.type === 'server-error') {
                this._handleServerFailure('Kunne ikkje koble til signaltenesta. Sjekk internett-tilkoplinga.');
            } else {
                this._clearOpenTimer();
                if (this.callbacks.onError) this.callbacks.onError('Tilkoplingsfeil: ' + err.type);
            }
        });

        peer.on('disconnected', () => {
            if (utgått()) return;

            // Har vi aldri vore oppe, er dette ein vert som ikkje svarar — då eig
            // failover-logikken situasjonen, ikkje reconnect. Elles ville vi hamra
            // laus på ein daud vert i det uendelege.
            if (!this.opened) return;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.warn('[PeerHost] Gav opp å kople til signalserveren att.');
                if (this.callbacks.onError) {
                    this.callbacks.onError('Mista kontakten med signaltenesta. Spelarar som alt er inne held fram, men nye kjem ikkje inn. Last sida på nytt for eit nytt rom.');
                }
                return;
            }

            this.reconnectAttempts++;
            const delay = Math.min(2000 * this.reconnectAttempts, 10000);
            console.log(`[PeerHost] Fråkopla frå signalserver. Prøver igjen (${this.reconnectAttempts}/${this.maxReconnectAttempts}) om ${delay}ms`);
            setTimeout(() => {
                if (!utgått() && !peer.destroyed) {
                    peer.reconnect();
                }
            }, delay);
        });
    }

    _clearOpenTimer() {
        if (this.openTimer) {
            clearTimeout(this.openTimer);
            this.openTimer = null;
        }
    }

    /**
     * Signalverten svarar ikkje: prøv neste i lista, eller meld frå om lista er tom.
     * Gjeld berre den første oppkoplinga — etter 'open' tek reconnect-logikken over.
     * @param {string} message
     */
    _handleServerFailure(message) {
        this._clearOpenTimer();
        if (this.destroyed || this.opened) return;

        if (!FKPeerConfig.hasFallbackAfter(this.serverIndex)) {
            if (this.callbacks.onError) this.callbacks.onError(message);
            return;
        }

        try { this.peer.destroy(); } catch (e) { /* ignorer */ }
        this.serverIndex++;
        this._initPeer();
    }

    _handleConnection(conn) {
        conn.on('open', () => {
            console.log('[PeerHost] Ny tilkopling:', conn.peer);
        });

        conn.on('data', (data) => {
            if (!data || typeof data !== 'object' || Array.isArray(data) ||
                typeof data.type !== 'string' || data.type.length < 1 || data.type.length > 32) return;

            if (data.type === 'join') {
                // Ein etablert kanal får ikkje registrere seg på nytt eller endre namn.
                if (this._findPlayerByConn(conn) !== null) return;

                // Spelar-ID frå meldinga er berre klientdata. PeerJS-ID-en på sjølve
                // kanalen er identiteten verten brukar og sender attende til klienten.
                const playerId = conn.peer;
                const name = typeof data.name === 'string' && data.name.length <= FK_MAX_PLAYER_NAME_LENGTH
                    ? data.name.trim() : '';
                if (typeof playerId !== 'string' || !playerId || playerId.length > FK_MAX_PEER_ID_LENGTH ||
                    playerId === this.peerId || this.connections.has(playerId) ||
                    !name || name.length > FK_MAX_PLAYER_NAME_LENGTH || /[\u0000-\u001f\u007f]/.test(name) ||
                    (data.playerId !== undefined && (typeof data.playerId !== 'string' || data.playerId.length > 64))) {
                    this._rejectConnection(conn);
                    return;
                }

                this.connections.set(playerId, { conn, name });

                // Send velkommen
                conn.send({
                    type: 'welcome',
                    playerId: playerId,
                    players: this.getPlayerList()
                });

                // Varsle alle andre
                this.broadcast({
                    type: 'player-joined',
                    name: name,
                    count: this.connections.size
                }, playerId);

                if (this.callbacks.onPlayerJoin) {
                    this.callbacks.onPlayerJoin({ id: playerId, name: name });
                }
            } else {
                // Ikkje lever svar eller andre handlingar før kanalen er registrert.
                const playerId = this._findPlayerByConn(conn);
                if (playerId !== null && this.callbacks.onPlayerMessage) {
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

    _rejectConnection(conn) {
        try { conn.close(); } catch (e) { /* ignorer */ }
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
        this._clearOpenTimer();
        this.connections.forEach(({ conn }) => {
            try { conn.close(); } catch (e) { /* ignorer */ }
        });
        this.connections.clear();
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) { /* ignorer */ }
        }
    }
}
