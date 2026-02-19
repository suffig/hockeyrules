# Hockey Rules - IIHF Regeln nach DEB-Regelbuch

Eine interaktive Webapp zur Darstellung der aktuellen IIHF-Regeln nach dem DEB-Regelbuch (Deutscher Eishockey-Bund).

## Features

- 📖 **Regeldarstellung**: Übersichtliche, strukturierte Anzeige aller Regeln
- 🔍 **Suche**: Volltextsuche durch alle Regelinhalte
- 🎯 **Filter**: Filterung nach Regelkategorien
- ⚠️ **Strafen-Übersicht**: Umfassende Darstellung aller Strafarten und Vergehen
- 📱 **Responsive**: Optimiert für Desktop, Tablet und Mobile
- 🌓 **Dark/Light Mode**: Umschaltbarer Anzeigemodus

## Installation

1. Repository klonen:
   ```bash
   git clone https://github.com/suffig/hockeyrules.git
   cd hockeyrules
   ```

2. Webapp öffnen:
   - Einfach `index.html` im Browser öffnen
   - Oder mit lokalem Server starten:
     ```bash
     python -m http.server 8000
     ```
   - Dann Browser öffnen: `http://localhost:8000`

## Nutzung

### Regelansicht
- Navigiere durch die verschiedenen Regelkategorien
- Klicke auf einzelne Regeln für Details

### Suche
- Nutze die Suchleiste oben
- Ergebnisse werden live angezeigt
- Suchbegriffe werden hervorgehoben

### Filter
- Wähle eine oder mehrere Kategorien
- Kombiniere Filter mit der Suche
- Setze Filter mit "Reset" zurück

### Strafen-Übersicht
- Übersicht über alle Strafarten im Eishockey
- Detaillierte Informationen zu Strafmaßen
- Filterbare Liste aller Vergehen
- Interaktive Darstellung

## Projektstruktur

```
hockeyrules/
├── index.html          # Hauptseite
├── css/
│   └── styles.css      # Styling
├── js/
│   ├── app.js          # Hauptlogik
│   ├── search.js       # Suchfunktion
│   └── filter.js       # Filterfunktion
├── data/
│   ├── rules.json              # Regeldaten
│   ├── penalties_reference.json # Strafendaten
│   └── quiz.json               # Quiz-Fragen (veraltet)
└── README.md
```