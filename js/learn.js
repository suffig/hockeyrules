/**
 * Hockey Rules - Lerntool (Learn Tool)
 * Manages mode switching (Quiz/Flashcards), flashcard logic, and quiz stats display
 */

const learnState = {
    mode: 'quiz',
    allCards: [],
    filteredCards: [],
    currentIndex: 0,
    learnedCards: new Set(),
    isFlipped: false
};

/**
 * Initialize the learn tool
 */
function initLearnTool() {
    // Mode tab switching
    document.querySelectorAll('.learn-tab').forEach(tab => {
        tab.addEventListener('click', () => switchLearnMode(tab.dataset.mode));
    });

    // Flashcard controls
    const flipEl = document.getElementById('flashcard');
    if (flipEl) {
        flipEl.addEventListener('click', flipCard);
        flipEl.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(); }
            if (e.key === 'ArrowRight') nextCard();
            if (e.key === 'ArrowLeft') prevCard();
        });
    }

    document.getElementById('prevCard')?.addEventListener('click', prevCard);
    document.getElementById('nextCard')?.addEventListener('click', nextCard);
    document.getElementById('markLearned')?.addEventListener('click', markCurrentLearned);
    document.getElementById('shuffleCards')?.addEventListener('click', shuffleFlashcards);
    document.getElementById('resetLearned')?.addEventListener('click', resetLearnedCards);
    document.getElementById('flashcardCategory')?.addEventListener('change', filterFlashcards);
    document.getElementById('goToRulesBtn')?.addEventListener('click', () => window.switchView('rules'));

    // Load learned state from localStorage
    const saved = localStorage.getItem('learnedCards');
    if (saved) learnState.learnedCards = new Set(JSON.parse(saved));
}

/**
 * Called when the learn view is opened – populate data from appState
 */
function onLearnViewOpen() {
    buildFlashcards();
    renderQuizStats();
}

/**
 * Switch between quiz and flashcards modes
 */
function switchLearnMode(mode) {
    learnState.mode = mode;

    document.querySelectorAll('.learn-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    const quizSection = document.getElementById('learnQuizSection');
    const flashSection = document.getElementById('learnFlashcardsSection');

    if (mode === 'quiz') {
        quizSection.style.display = '';
        flashSection.style.display = 'none';
        renderQuizStats();
    } else {
        quizSection.style.display = 'none';
        flashSection.style.display = '';
        buildFlashcards();
    }
}

// ===========================
// Flashcard Logic
// ===========================

/**
 * Build flashcard deck from rules data
 */
function buildFlashcards() {
    if (!window.appState || !window.appState.rules) return;

    learnState.allCards = [];
    const categorySelect = document.getElementById('flashcardCategory');
    const existingOptions = new Set(['all']);

    window.appState.rules.categories.forEach(cat => {
        // Populate category dropdown (only once)
        if (categorySelect && !existingOptions.has(cat.id)) {
            existingOptions.add(cat.id);
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = `${cat.icon} ${cat.name}`;
            categorySelect.appendChild(opt);
        }

        cat.rules.forEach(rule => {
            learnState.allCards.push({
                ...rule,
                categoryId: cat.id,
                categoryName: cat.name,
                categoryIcon: cat.icon
            });
        });
    });

    // Prevent duplicate options on repeated calls
    if (categorySelect) {
        const opts = categorySelect.querySelectorAll('option');
        const seen = new Set();
        opts.forEach(opt => {
            if (seen.has(opt.value)) opt.remove();
            else seen.add(opt.value);
        });
    }

    learnState.filteredCards = [...learnState.allCards];
    learnState.currentIndex = 0;
    learnState.isFlipped = false;

    displayCurrentCard();
}

/**
 * Filter flashcards by selected category
 */
function filterFlashcards() {
    const cat = document.getElementById('flashcardCategory')?.value || 'all';
    learnState.filteredCards = cat === 'all'
        ? [...learnState.allCards]
        : learnState.allCards.filter(c => c.categoryId === cat);
    learnState.currentIndex = 0;
    learnState.isFlipped = false;
    resetCardFlip();
    displayCurrentCard();
}

/**
 * Shuffle the filtered card deck
 */
function shuffleFlashcards() {
    const arr = learnState.filteredCards;
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    learnState.currentIndex = 0;
    learnState.isFlipped = false;
    resetCardFlip();
    displayCurrentCard();
    window.showToast('Karten gemischt!');
}

/**
 * Show the current card
 */
function displayCurrentCard() {
    const cards = learnState.filteredCards;
    const idx = learnState.currentIndex;

    if (cards.length === 0) {
        document.getElementById('flashcardFront').innerHTML = '<p class="flashcard-empty">Keine Karten in dieser Kategorie.</p>';
        document.getElementById('flashcardBack').innerHTML = '';
        updateFlashcardMeta(0, 0);
        return;
    }

    const card = cards[idx];
    const isLearned = learnState.learnedCards.has(card.number);

    // Front
    document.getElementById('flashcardCategoryBadge').textContent = `${card.categoryIcon} ${card.categoryName}`;
    document.getElementById('flashcardRuleNumber').textContent = `Regel ${card.number}`;
    document.getElementById('flashcardRuleTitle').textContent = card.title;

    // Back
    document.getElementById('flashcardRuleNumberBack').textContent = `Regel ${card.number} – ${card.title}`;
    document.getElementById('flashcardDescription').textContent = card.description || '';

    const detailsEl = document.getElementById('flashcardDetails');
    detailsEl.textContent = card.details || '';
    detailsEl.style.display = card.details ? '' : 'none';

    const examplesEl = document.getElementById('flashcardExamples');
    if (card.examples && card.examples.length > 0) {
        examplesEl.innerHTML = '<strong>Beispiele:</strong><ul>' +
            card.examples.slice(0, 3).map(ex => `<li>${ex}</li>`).join('') + '</ul>';
        examplesEl.style.display = '';
    } else {
        examplesEl.style.display = 'none';
    }

    // Learned state styling
    const flashcardEl = document.getElementById('flashcard');
    flashcardEl.classList.toggle('is-learned', isLearned);

    const markBtn = document.getElementById('markLearned');
    if (markBtn) {
        markBtn.textContent = isLearned ? '✓ Gelernt' : '☆ Als gelernt markieren';
        markBtn.classList.toggle('is-learned', isLearned);
    }

    updateFlashcardMeta(idx + 1, cards.length);
}

/**
 * Update counter / progress bar
 */
function updateFlashcardMeta(current, total) {
    document.getElementById('cardCounter').textContent = `Karte ${current} / ${total}`;

    const learnedCount = learnState.filteredCards.filter(c =>
        learnState.learnedCards.has(c.number)
    ).length;
    document.getElementById('learnedCounter').textContent = `${learnedCount} gelernt`;

    const pct = total > 0 ? Math.round((learnedCount / total) * 100) : 0;
    document.getElementById('flashcardProgressFill').style.width = pct + '%';
    document.getElementById('flashcardProgressLabel').textContent = `${pct}% gelernt`;
}

/**
 * Flip the flashcard
 */
function flipCard() {
    learnState.isFlipped = !learnState.isFlipped;
    document.getElementById('flashcardInner').classList.toggle('flipped', learnState.isFlipped);
}

/**
 * Reset flip state without animation flicker
 */
function resetCardFlip() {
    learnState.isFlipped = false;
    const inner = document.getElementById('flashcardInner');
    if (inner) inner.classList.remove('flipped');
}

/**
 * Go to next card
 */
function nextCard() {
    if (learnState.filteredCards.length === 0) return;
    learnState.currentIndex = (learnState.currentIndex + 1) % learnState.filteredCards.length;
    learnState.isFlipped = false;
    resetCardFlip();
    displayCurrentCard();
}

/**
 * Go to previous card
 */
function prevCard() {
    if (learnState.filteredCards.length === 0) return;
    learnState.currentIndex =
        (learnState.currentIndex - 1 + learnState.filteredCards.length) % learnState.filteredCards.length;
    learnState.isFlipped = false;
    resetCardFlip();
    displayCurrentCard();
}

/**
 * Mark or unmark the current card as learned
 */
function markCurrentLearned() {
    const cards = learnState.filteredCards;
    if (cards.length === 0) return;

    const card = cards[learnState.currentIndex];
    if (learnState.learnedCards.has(card.number)) {
        learnState.learnedCards.delete(card.number);
        window.showToast(`Regel ${card.number} als unbekannt markiert`);
    } else {
        learnState.learnedCards.add(card.number);
        window.showToast(`Regel ${card.number} als gelernt markiert!`);
        // Auto-advance to next card after marking as learned
        setTimeout(() => {
            if (learnState.currentIndex < cards.length - 1) {
                nextCard();
            }
        }, 600);
    }

    saveLearnedCards();
    displayCurrentCard();
}

/**
 * Reset all learned cards
 */
function resetLearnedCards() {
    learnState.learnedCards.clear();
    saveLearnedCards();
    displayCurrentCard();
    window.showToast('Lernfortschritt zurückgesetzt');
}

/**
 * Persist learned cards to localStorage
 */
function saveLearnedCards() {
    localStorage.setItem('learnedCards', JSON.stringify([...learnState.learnedCards]));
}

// ===========================
// Quiz Stats Panel
// ===========================

/**
 * Render quiz statistics below the difficulty buttons
 */
function renderQuizStats() {
    const stats = getQuizStatistics ? getQuizStatistics() : null;
    if (!stats) return;

    const panel = document.getElementById('quizStats');
    const content = document.getElementById('quizStatsContent');
    if (!panel || !content) return;

    if (stats.totalGames === 0) {
        panel.style.display = 'none';
        return;
    }

    const avgScore = stats.totalGames > 0
        ? Math.round((stats.totalScore / stats.totalGames / 10) * 100)
        : 0;

    content.innerHTML = `
        <div class="stats-card">
            <span class="stats-value">${stats.totalGames}</span>
            <span class="stats-label">Gespiele Quizze</span>
        </div>
        <div class="stats-card">
            <span class="stats-value">${stats.bestScore}/10</span>
            <span class="stats-label">Bestes Ergebnis</span>
        </div>
        <div class="stats-card">
            <span class="stats-value">${avgScore}%</span>
            <span class="stats-label">Ø Trefferquote</span>
        </div>
    `;
    panel.style.display = '';
}

// ===========================
// Rule Number Lookup
// ===========================

/**
 * Initialize the quick rule lookup widget
 */
function initRuleLookup() {
    const input = document.getElementById('ruleLookupInput');
    const btn = document.getElementById('ruleLookupBtn');
    if (!input || !btn) return;

    btn.addEventListener('click', doRuleLookup);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') doRuleLookup();
    });
}

/**
 * Jump to a rule by number
 */
function doRuleLookup() {
    const input = document.getElementById('ruleLookupInput');
    const query = input.value.trim();
    if (!query) return;

    // Find the rule element in the DOM
    const ruleEl = document.querySelector(`.rule-item[data-rule="${query}"]`);
    if (ruleEl) {
        ruleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ruleEl.classList.add('rule-highlight');
        setTimeout(() => ruleEl.classList.remove('rule-highlight'), 2500);
        input.value = '';
    } else {
        window.showToast(`Regel ${query} nicht gefunden. Versuche die Suche.`, 'error');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLearnTool();
        initRuleLookup();
    });
} else {
    initLearnTool();
    initRuleLookup();
}

// Exports
window.learnState = learnState;
window.onLearnViewOpen = onLearnViewOpen;
window.flipCard = flipCard;
window.renderQuizStats = renderQuizStats;
