/**
 * Hockey Rules - Main Application Logic
 * Handles UI management, data loading, theme switching, bookmarks, and navigation
 */

// Global state
const appState = {
    rules: null,
    quiz: null,
    currentView: 'rules',
    theme: 'light',
    bookmarks: new Set(),
    activeFilters: new Set()
};

// DOM elements
const elements = {
    rulesView: null,
    quizView: null,
    bookmarksView: null,
    penaltiesView: null,
    rulesContent: null,
    bookmarksContent: null,
    themeToggle: null,
    printBtn: null,
    navButtons: null,
    toast: null
};

/**
 * Initialize the application
 */
async function init() {
    // Cache DOM elements
    cacheElements();
    
    // Load data
    await loadData();
    
    // Initialize theme
    initTheme();
    
    // Load bookmarks from localStorage
    loadBookmarks();
    
    // Set up event listeners
    setupEventListeners();
    
    // Render initial view
    renderRules();
}

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
    elements.rulesView = document.getElementById('rulesView');
    elements.quizView = document.getElementById('quizView');
    elements.bookmarksView = document.getElementById('bookmarksView');
    elements.penaltiesView = document.getElementById('penaltiesView');
    elements.rulesContent = document.getElementById('rulesContent');
    elements.bookmarksContent = document.getElementById('bookmarksContent');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.printBtn = document.getElementById('printBtn');
    elements.navButtons = document.querySelectorAll('.nav-btn');
    elements.toast = document.getElementById('toast');
}

/**
 * Load rules and quiz data from JSON files
 */
async function loadData() {
    try {
        // Load rules
        const rulesResponse = await fetch('data/rules.json');
        appState.rules = await rulesResponse.json();
        
        // Load quiz questions
        const quizResponse = await fetch('data/quiz.json');
        appState.quiz = await quizResponse.json();
        
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Fehler beim Laden der Daten. Bitte Seite neu laden.', 'error');
    }
}

/**
 * Initialize theme from localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    appState.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', appState.theme);
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', appState.theme);
    localStorage.setItem('theme', appState.theme);
    
    const icon = appState.theme === 'dark' ? '☀️' : '🌓';
    elements.themeToggle.querySelector('.theme-icon').textContent = icon;
    
    showToast(`${appState.theme === 'dark' ? 'Dark' : 'Light'} Mode aktiviert`);
}

/**
 * Load bookmarks from localStorage
 */
function loadBookmarks() {
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
        appState.bookmarks = new Set(JSON.parse(saved));
    }
}

/**
 * Save bookmarks to localStorage
 */
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify([...appState.bookmarks]));
}

/**
 * Toggle bookmark for a rule
 */
function toggleBookmark(ruleNumber) {
    if (appState.bookmarks.has(ruleNumber)) {
        appState.bookmarks.delete(ruleNumber);
        showToast('Lesezeichen entfernt');
    } else {
        appState.bookmarks.add(ruleNumber);
        showToast('Lesezeichen hinzugefügt');
    }
    saveBookmarks();
    
    // Update UI
    if (appState.currentView === 'rules') {
        renderRules();
    } else if (appState.currentView === 'bookmarks') {
        renderBookmarks();
    }
}

/**
 * Share a rule via Web Share API or copy to clipboard
 */
function shareRule(rule) {
    const text = `${rule.number}: ${rule.title}\n${rule.description}`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: `Hockey Rules - Regel ${rule.number}`,
            text: text,
            url: url
        }).catch(err => {
            if (err.name !== 'AbortError') {
                copyToClipboard(text);
            }
        });
    } else {
        copyToClipboard(text);
    }
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Regel in Zwischenablage kopiert');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Kopieren fehlgeschlagen', 'error');
    });
}

/**
 * Print current view
 */
function printPage() {
    window.print();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Print button
    elements.printBtn.addEventListener('click', printPage);
    
    // Navigation buttons
    elements.navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
    
    // Back to rules button (in quiz results)
    const backToRulesBtn = document.getElementById('backToRules');
    if (backToRulesBtn) {
        backToRulesBtn.addEventListener('click', () => switchView('rules'));
    }
}

/**
 * Switch between different views
 */
function switchView(viewName) {
    appState.currentView = viewName;
    
    // Update active nav button
    elements.navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // Show/hide views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    switch(viewName) {
        case 'rules':
            elements.rulesView.classList.add('active');
            break;
        case 'penalties':
            elements.penaltiesView.classList.add('active');
            break;
        case 'quiz':
            elements.quizView.classList.add('active');
            break;
        case 'bookmarks':
            elements.bookmarksView.classList.add('active');
            renderBookmarks();
            break;
    }
}

/**
 * Render all rules in the rules view
 */
function renderRules() {
    if (!appState.rules) return;
    
    elements.rulesContent.innerHTML = '';
    
    appState.rules.categories.forEach(category => {
        // Skip if category is filtered out
        if (appState.activeFilters.size > 0 && !appState.activeFilters.has(category.id)) {
            return;
        }
        
        const categoryEl = createCategoryElement(category);
        elements.rulesContent.appendChild(categoryEl);
    });
    
    // Show empty state if no rules match filters
    if (elements.rulesContent.children.length === 0) {
        elements.rulesContent.innerHTML = '<p class="empty-state">Keine Regeln gefunden. Versuche es mit anderen Filtern.</p>';
    }
}

/**
 * Create HTML element for a category
 */
function createCategoryElement(category) {
    const div = document.createElement('div');
    div.className = 'rule-category';
    div.dataset.category = category.id;
    
    const header = `
        <div class="category-header">
            <h2 class="category-title">${category.icon} ${category.name}</h2>
        </div>
    `;
    
    const rulesList = category.rules.map(rule => createRuleElement(rule)).join('');
    
    div.innerHTML = `
        ${header}
        <div class="rules-list">
            ${rulesList}
        </div>
    `;
    
    // Add event listeners for bookmark and share buttons
    div.querySelectorAll('.btn-bookmark').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBookmark(btn.dataset.rule);
        });
    });
    
    div.querySelectorAll('.btn-share').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ruleNumber = btn.dataset.rule;
            const rule = findRuleByNumber(ruleNumber);
            if (rule) shareRule(rule);
        });
    });
    
    return div;
}

/**
 * Create HTML element for a rule
 */
function createRuleElement(rule) {
    const isBookmarked = appState.bookmarks.has(rule.number);
    
    return `
        <div class="rule-item" data-rule="${rule.number}">
            <div class="rule-header">
                <span class="rule-number">Regel ${rule.number}</span>
                <div class="rule-actions">
                    <button class="btn-bookmark ${isBookmarked ? 'active' : ''}" 
                            data-rule="${rule.number}" 
                            aria-label="Lesezeichen ${isBookmarked ? 'entfernen' : 'hinzufügen'}"
                            title="${isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen hinzufügen'}">
                        ${isBookmarked ? '⭐' : '☆'}
                    </button>
                    <button class="btn-share" 
                            data-rule="${rule.number}"
                            aria-label="Regel teilen"
                            title="Regel teilen">
                        🔗
                    </button>
                </div>
            </div>
            <h3 class="rule-title">${rule.title}</h3>
            <p class="rule-description">${rule.description}</p>
            ${rule.details ? `<p class="rule-details">${rule.details}</p>` : ''}
        </div>
    `;
}

/**
 * Find a rule by its number
 */
function findRuleByNumber(number) {
    for (const category of appState.rules.categories) {
        const rule = category.rules.find(r => r.number === number);
        if (rule) return rule;
    }
    return null;
}

/**
 * Render bookmarked rules
 */
function renderBookmarks() {
    if (appState.bookmarks.size === 0) {
        elements.bookmarksContent.innerHTML = '<p class="empty-state">Noch keine Lesezeichen gesetzt. Markiere Regeln, um sie hier wiederzufinden.</p>';
        return;
    }
    
    elements.bookmarksContent.innerHTML = '';
    
    // Get all bookmarked rules
    const bookmarkedRules = [];
    appState.rules.categories.forEach(category => {
        category.rules.forEach(rule => {
            if (appState.bookmarks.has(rule.number)) {
                bookmarkedRules.push({ ...rule, categoryIcon: category.icon, categoryName: category.name });
            }
        });
    });
    
    // Sort by rule number
    bookmarkedRules.sort((a, b) => {
        const aNum = parseFloat(a.number);
        const bNum = parseFloat(b.number);
        return aNum - bNum;
    });
    
    // Create rule elements
    bookmarkedRules.forEach(rule => {
        const ruleEl = document.createElement('div');
        ruleEl.className = 'rule-item';
        ruleEl.innerHTML = `
            <div class="rule-header">
                <span class="rule-number">${rule.categoryIcon} Regel ${rule.number}</span>
                <div class="rule-actions">
                    <button class="btn-bookmark active" 
                            data-rule="${rule.number}" 
                            aria-label="Lesezeichen entfernen"
                            title="Lesezeichen entfernen">
                        ⭐
                    </button>
                    <button class="btn-share" 
                            data-rule="${rule.number}"
                            aria-label="Regel teilen"
                            title="Regel teilen">
                        🔗
                    </button>
                </div>
            </div>
            <h3 class="rule-title">${rule.title}</h3>
            <p class="rule-description">${rule.description}</p>
            ${rule.details ? `<p class="rule-details">${rule.details}</p>` : ''}
            <p class="rule-details">Kategorie: ${rule.categoryName}</p>
        `;
        
        // Add event listeners
        ruleEl.querySelector('.btn-bookmark').addEventListener('click', () => {
            toggleBookmark(rule.number);
        });
        
        ruleEl.querySelector('.btn-share').addEventListener('click', () => {
            shareRule(rule);
        });
        
        elements.bookmarksContent.appendChild(ruleEl);
    });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for use in other modules
window.appState = appState;
window.showToast = showToast;
window.switchView = switchView;
window.renderRules = renderRules;
