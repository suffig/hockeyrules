# Hockey Rules - IIHF Regeln nach DEB-Regelbuch

Eine interaktive Webapp zur Darstellung der aktuellen IIHF-Regeln nach dem DEB-Regelbuch (Deutscher Eishockey-Bund).

## Features

- 📖 **Regeldarstellung**: Übersichtliche, strukturierte Anzeige aller Regeln
- 🔍 **Suche**: Volltextsuche durch alle Regelinhalte
- 🎯 **Filter**: Filterung nach Regelkategorien
- 🧠 **Quiz-Modus**: Interaktiver Test zum Regelwissen
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

### Quiz-Modus
- Starte das Quiz über den "Quiz" Button
- Beantworte Multiple-Choice-Fragen
- Erhalte sofortiges Feedback
- Siehe deine Punktzahl am Ende

## Projektstruktur

```
hockeyrules/
├── index.html          # Hauptseite
├── css/
│   └── styles.css      # Styling
├── js/
│   ├── app.js          # Hauptlogik
│   ├── search.js       # Suchfunktion
│   ├── filter.js       # Filterfunktion
│   └── quiz.js         # Quiz-Logik
├── data/
│   ├── rules.json      # Regeldaten
│   └── quiz.json       # Quiz-Fragen
└── README.md
```