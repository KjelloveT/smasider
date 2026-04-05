# Kviss - Live Quiz System

Personvern-venleg live quiz for klasserommet som fungerer på lokalt nettverk.

## Funksjonalitet

- ✅ **Live quiz** med sanntids spørsmål og svar
- ✅ **Fullt personvern** - ingen data forlader klasserommet
- ✅ **Lokalt nettverk** - ingen internett påkrevd etter første lasting
- ✅ **Sanntids leaderboard** med poeng og rangering
- ✅ **Timer** for kvart spørsmål
- ✅ **Poengsystem** basert på korrekthet og svar-tid

## Hvordan bruke

### Metode 1: Demo med localStorage (enkel)
1. Lærar åpner `quiz-host.html` i nettlesaren
2. Trykk "Start Server" (simulert)
3. Elevar åpner `quiz-join.html` i **samme nettlesar** (nye tabs)
4. Skriv inn rom-kode og namn
5. Start quiz!

### Metode 2: Ekte WebSocket server (anbefalt)
1. Installer Node.js: https://nodejs.org/
2. Start server:
   ```bash
   cd quiz
   npm install ws
   node server.js
   ```
3. Lærar går til: `http://localhost:8082/quiz-host.html`
4. Elevar går til: `http://localhost:8082/quiz-join.html` (på sine enheter)
5. Alle må være på **samme WiFi-nettverk**

### Metode 3: Lokal nettverks-server
1. Start server med `node server.js`
2. Finn IP-adressen til lærar-PC:
   - Windows: `ipconfig` (IPv4 Address)
   - Mac: `ifconfig` (inet)
3. Elevar går til: `http://[IP-adresse]:8082/quiz-join.html`
4. Lærar går til: `http://localhost:8082/quiz-host.html`

## Personvern

- **Ingen data til skyen** - alt køyrer lokalt
- **Ingen registrering** - berre rom-kode og namn
- **Ingen sporing** - ingen cookies eller analytics
- **Lokal lagring** - quiz-resultater lagrast berre i nettlesar
- **GDPR-kompatibelt** - perfekt for skolebruk

## Teknisk

### WebSocket Kommunikasjon
```
Lærar (Host) ←→ WebSocket Server ←→ Elevar (Clients)
```

### Dataflyt
- **Spørsmål**: Host → Server → Alle elevar
- **Svar**: Elev → Server → Host
- **Resultater**: Host → Server → Alle elevar

### Lagret data
```javascript
// Lærar sin maskin:
localStorage.setItem('quiz-results', JSON.stringify({
  sessionId: 'quiz-abc123',
  anonymousResults: [
    {playerId: 'hash123', score: 850, answers: [0, 1, 2]}
  ]
}));

// Elev sin maskin:
localStorage.setItem('quiz-history', JSON.stringify({
  lastSession: 'quiz-abc123',
  score: 850
}));
```

## Quiz-struktur

### Eksempelspørsmål
```javascript
{
  question: "Hva er hovedstaden i Norge?",
  options: ["Oslo", "Bergen", "Trondheim", "Stavanger"],
  correct: 0,
  timeLimit: 20
}
```

### Poengsystem
- **Korrekt svar**: 1000 poeng + tidsbonus
- **Tidsbonus**: Opptil 500 ekstra poeng for raske svar
- **Feil svar**: 0 poeng

## Filer

- `quiz-host.html` - Lærar-kontrollpanel
- `quiz-join.html` - Elev-deltakelse
- `server.js` - WebSocket server (Node.js)
- `README.md` - Denne fila

## Utvidelsar

### Kommende funksjoner
- 📝 **Quiz Editor** - lag egne spørsmål
- 🎨 **Temaer** - ulike visuelle stilar
- 📊 **Statistikk** - detaljerte quiz-rapportar
- 🏆 **Lag-konkurranse** - team vs team
- 📱 **Mobil-app** - native app for elevar

### Tilpassing
- Endre spørsmål i `quiz-host.html` (`getSampleQuestions()`)
- Tilpass poengsystem i `handleAnswer()`
- Endre visuell stil i CSS

## Feilsøking

### "Elevar kan ikke koble til"
- Sjekk at alle er på samme WiFi-nettverk
- Sjekk at brannmur tillater port 8082
- Test med `http://localhost:8082` først

### "Server vil ikke starte"
- Installer Node.js: https://nodejs.org/
- Kjør `npm install ws` i quiz-mappen
- Sjekk at port 8082 er ledig

### "Ingen ser spørsmål"
- Sjekk WebSocket tilkobling i konsollen
- Test med demo-modus først (localStorage)

## Sikkerhet

- Kun lokal nettverkskommunikasjon
- Ingen ekstern tilgang uten konfigurasjon
- Validering av alle input-data
- Rate limiting kan legges til ved behov

## Support

For spørsmål eller problemer:
1. Sjekk nettlesar-konsollen (F12)
2. Verifiser nettverkskobling
3. Test med demo-modus først

---

**Laga for grunnskolen** - med personvern i fokus 🛡️
