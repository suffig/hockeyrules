/**
 * Hockey Rules - Main Application Logic
 * Handles UI management, data loading, theme switching, bookmarks, and navigation
 */

// Global state
const appState = {
    rules: null,
    penalties: null,
    quiz: null,
    currentView: 'rules',
    theme: 'light',
    bookmarks: new Set(),
    activeFilters: new Set()
};

// DOM elements
const elements = {
    rulesView: null,
    bookmarksView: null,
    penaltiesView: null,
    learnView: null,
    rulesContent: null,
    bookmarksContent: null,
    penaltiesContent: null,
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
    elements.bookmarksView = document.getElementById('bookmarksView');
    elements.penaltiesView = document.getElementById('penaltiesView');
    elements.learnView = document.getElementById('learnView');
    elements.rulesContent = document.getElementById('rulesContent');
    elements.bookmarksContent = document.getElementById('bookmarksContent');
    elements.penaltiesContent = document.getElementById('penaltiesContent');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.printBtn = document.getElementById('printBtn');
    elements.navButtons = document.querySelectorAll('.nav-btn');
    elements.toast = document.getElementById('toast');
}

/**
 * Load rules and penalties data from JSON files
 */
async function loadData() {
    try {
        const [rulesRes, penaltiesRes, quizRes] = await Promise.all([
            fetch('data/rules.json'),
            fetch('data/penalties_reference.json'),
            fetch('data/quiz.json')
        ]);
        appState.rules = await rulesRes.json();
        appState.penalties = await penaltiesRes.json();
        appState.quiz = await quizRes.json();
        console.log('Data loaded successfully');
        updateRulesCoverageInfo();
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
            renderPenaltiesView();
            break;
        case 'learn':
            elements.learnView.classList.add('active');
            if (window.onLearnViewOpen) onLearnViewOpen();
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
 * Update visible rule coverage info in the UI
 */
function updateRulesCoverageInfo() {
    const coverageEl = document.getElementById('rulesCoverageInfo');
    if (!coverageEl || !appState.rules || !appState.rules.metadata) return;
    const meta = appState.rules.metadata;
    const total = meta.totalRules || appState.rules.categories.reduce((sum, cat) => sum + cat.rules.length, 0);
    const version = meta.version || 'unbekannt';
    coverageEl.textContent = `📚 ${total} gelistete Regeln · Version ${version} · Quelle: offizielles IIHF-Regelbuch`;
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
    
    // Add event listeners for related-rule jump tags
    div.querySelectorAll('.related-rule-tag[data-jump]').forEach(tag => {
        const handler = (e) => {
            e.stopPropagation();
            const target = document.querySelector(`.rule-item[data-rule="${tag.dataset.jump}"]`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.classList.add('rule-highlight');
                setTimeout(() => target.classList.remove('rule-highlight'), 2500);
            } else {
                showToast(`Regel ${tag.dataset.jump} nicht gefunden`);
            }
        };
        tag.addEventListener('click', handler);
        tag.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(e); });
    });

    // Add event listeners for expand buttons
    div.querySelectorAll('.btn-expand').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ruleNumber = btn.dataset.rule;
            const ruleItem = div.querySelector(`.rule-item[data-rule="${ruleNumber}"]`);
            const detailsContent = ruleItem.querySelector('.rule-detailed-content');
            
            if (detailsContent) {
                const isExpanded = detailsContent.style.display !== 'none';
                detailsContent.style.display = isExpanded ? 'none' : 'block';
                btn.textContent = isExpanded ? '▼' : '▲';
                btn.setAttribute('aria-label', isExpanded ? 'Details anzeigen' : 'Details ausblenden');
                btn.setAttribute('title', isExpanded ? 'Details anzeigen' : 'Details ausblenden');
                ruleItem.classList.toggle('expanded', !isExpanded);
            }
        });
    });
    
    return div;
}

/**
 * Create HTML element for a rule
 */
function createRuleElement(rule) {
    const isBookmarked = appState.bookmarks.has(rule.number);
    const hasDetailedContent = rule.detailedExplanation || rule.examples || rule.whatToWatchFor || rule.relatedRules;
    
    let html = `
        <div class="rule-item ${hasDetailedContent ? 'rule-item-expandable' : ''}" data-rule="${rule.number}">
            <div class="rule-header">
                <span class="rule-number">Regel ${rule.number}</span>
                <div class="rule-actions">
                    ${hasDetailedContent ? '<button class="btn-expand" data-rule="' + rule.number + '" aria-label="Details anzeigen" title="Details anzeigen">▼</button>' : ''}
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
    `;
    
    // Add detailed content section if available
    if (hasDetailedContent) {
        html += `
            <div class="rule-detailed-content" style="display: none;">
                ${rule.detailedExplanation ? `
                    <div class="detail-section">
                        <h4>📋 Detaillierte Erklärung</h4>
                        <p>${rule.detailedExplanation}</p>
                    </div>
                ` : ''}
                
                ${rule.examples && rule.examples.length > 0 ? `
                    <div class="detail-section">
                        <h4>💡 Beispiele</h4>
                        <ul class="examples-list">
                            ${rule.examples.map(ex => `<li>${ex}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${rule.whatToWatchFor && rule.whatToWatchFor.length > 0 ? `
                    <div class="detail-section detail-watch">
                        <h4>👁️ Worauf achten?</h4>
                        <ul class="watch-list">
                            ${rule.whatToWatchFor.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${rule.exceptions ? `
                    <div class="detail-section detail-exceptions">
                        <h4>⚠️ Ausnahmen</h4>
                        <p>${rule.exceptions}</p>
                    </div>
                ` : ''}
                
                ${rule.procedureDetails ? `
                    <div class="detail-section">
                        <h4>📝 Ablauf</h4>
                        <p>${rule.procedureDetails}</p>
                    </div>
                ` : ''}
                
                ${rule.relatedRules && rule.relatedRules.length > 0 ? `
                    <div class="detail-section detail-related">
                        <h4>🔗 Verwandte Regeln</h4>
                        <div class="related-rules">
                            ${rule.relatedRules.map(ruleNum => `<span class="related-rule-tag" data-jump="${ruleNum}" role="button" tabindex="0" title="Zur Regel ${ruleNum} springen">Regel ${ruleNum}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
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

/**
 * Render comprehensive penalties view with data from penalties_reference.json
 */
function renderPenaltiesView() {
    if (!appState.penalties) return;
    
    // Generate complete infractions table from penalties_reference.json
    const tableBody = document.querySelector('.infractions-table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    const allInfractions = [];
    const infractions = appState.penalties.penalty_infractions;
    
    // Mapping of German translations for common terms
    const translations = {
        'Aggressor': 'Angreifer',
        'Boarding': 'Bandencheck',
        'Broken Stick': 'Gebrochener Schläger',
        'Butt-Ending': 'Schlägerknauf-Stoß',
        'Charging': 'Anlaufen',
        'Checking from Behind': 'Check von hinten',
        'Clipping': 'Tiefcheck',
        'Closing Hand on Puck': 'Puck mit Hand bedecken',
        'Cross-Checking': 'Querschlag',
        'Delay of Game': 'Spielverzögerung',
        'Delaying the Game': 'Spielverzögerung',
        'Diving': 'Schwalbe',
        'Elbowing': 'Ellbogencheck',
        'Embellishment': 'Übertreibung',
        'Face-off Violation': 'Bully-Verstoß',
        'Fighting': 'Kämpfen',
        'Goal Celebration': 'Torjubel',
        'Goalkeeper Interference': 'Behinderung des Torhüters',
        'Head-Butting': 'Kopfstoß',
        'High-Sticking': 'Hoher Stock',
        'Holding': 'Halten',
        'Holding the Stick': 'Schlägerhalten',
        'Hooking': 'Haken',
        'Illegal Check to Head': 'Illegaler Check gegen Kopf',
        'Illegal Equipment': 'Illegale Ausrüstung',
        'Illegal Stick': 'Illegaler Schläger',
        'Illegal Substitution': 'Illegaler Wechsel',
        'Instigator': 'Anstifter',
        'Interference': 'Behinderung',
        'Interference by/with Spectator': 'Behinderung durch/von Zuschauer',
        'Kneeing': 'Kniestoß',
        'Leaving the Bench': 'Verlassen der Spielerbank',
        'Misconduct': 'Disziplinarstrafe',
        'Physical Harassment of Officials': 'Physische Belästigung von Offiziellen',
        'Puck Out of Bounds': 'Puck aus dem Spielfeld',
        'Refusing to Start Play': 'Spielverweigerung',
        'Refusing to Surrender Stick': 'Weigerung Schläger abzugeben',
        'Roughing': 'Übertriebene Härte',
        'Slashing': 'Schlagen',
        'Slew-Footing': 'Beinfang',
        'Spearing': 'Speeren',
        'Throwing Equipment': 'Werfen von Ausrüstung',
        'Throwing Puck': 'Werfen des Pucks',
        'Too Many Players': 'Zu viele Spieler',
        'Tripping': 'Beinstellen',
        'Unsportsmanlike Conduct': 'Unsportliches Verhalten'
    };
    
    // Helper function to get German name
    const getGermanName = (englishName) => {
        return translations[englishName] || englishName;
    };
    
    // Helper function to get category badge
    const getCategoryInfo = (rules) => {
        if (!rules || rules.length === 0) return { type: 'gameplay', label: 'Spielweise' };
        
        const firstRule = rules[0];
        // Physical contact rules (IIHF Rules 40-60): Checking, hitting, physical play
        if ((firstRule >= 41 && firstRule <= 51) || (firstRule >= 56 && firstRule <= 58)) {
            return { type: 'physical', label: 'Körperkontakt' };
        }
        // Stick infractions (IIHF Rules 55-62): Hooking, slashing, high-sticking, etc.
        if (firstRule >= 55 && firstRule <= 62) {
            return { type: 'stick', label: 'Schläger' };
        }
        // Default to gameplay rules
        return { type: 'gameplay', label: 'Spielweise' };
    };
    
    // Add minor penalties
    if (infractions.minor_penalties) {
        infractions.minor_penalties.forEach(inf => {
            const category = getCategoryInfo(inf.rules);
            allInfractions.push({
                german: getGermanName(inf.infraction),
                english: inf.infraction,
                badge: '<span class="badge-minor">2 Min.</span>',
                rules: inf.rules ? inf.rules.map(r => r.toString()).join(', ') : '',
                category: category.type,
                categoryLabel: category.label,
                sortOrder: 1
            });
        });
    }
    
    // Add double-minor penalties
    if (infractions.double_minor_penalties) {
        infractions.double_minor_penalties.forEach(inf => {
            const category = getCategoryInfo(inf.rules);
            allInfractions.push({
                german: getGermanName(inf.infraction),
                english: inf.infraction,
                badge: '<span class="badge-double">4 Min.</span>',
                rules: inf.rules ? inf.rules.map(r => r.toString()).join(', ') : '',
                category: category.type,
                categoryLabel: category.label,
                sortOrder: 2
            });
        });
    }
    
    // Add major penalties
    if (infractions.major_penalties) {
        infractions.major_penalties.forEach(inf => {
            const category = getCategoryInfo(inf.rules);
            allInfractions.push({
                german: getGermanName(inf.infraction),
                english: inf.infraction,
                badge: '<span class="badge-major">5 Min.</span>',
                rules: inf.rules ? inf.rules.map(r => r.toString()).join(', ') : '',
                category: category.type,
                categoryLabel: category.label,
                sortOrder: 3
            });
        });
    }
    
    // Add misconduct penalties
    if (infractions.misconduct_penalties) {
        infractions.misconduct_penalties.forEach(inf => {
            const category = getCategoryInfo(inf.rules);
            allInfractions.push({
                german: getGermanName(inf.infraction),
                english: inf.infraction,
                badge: '<span class="badge-misconduct">10 Min.</span>',
                rules: inf.rules ? inf.rules.map(r => r.toString()).join(', ') : '',
                category: category.type,
                categoryLabel: category.label,
                sortOrder: 4
            });
        });
    }
    
    // Sort by German name
    allInfractions.sort((a, b) => a.german.localeCompare(b.german));
    
    // Remove duplicates (keep the one with most severe penalty)
    const uniqueInfractions = [];
    const seen = new Map();
    
    allInfractions.forEach(inf => {
        if (!seen.has(inf.english)) {
            seen.set(inf.english, inf);
            uniqueInfractions.push(inf);
        } else {
            // If we've seen this before, update the badge to show all possible penalties
            const existing = seen.get(inf.english);
            if (!existing.badge.includes(inf.badge)) {
                existing.badge += ' ' + inf.badge;
            }
        }
    });
    
    // Render all infractions
    uniqueInfractions.forEach(inf => {
        const row = document.createElement('tr');
        row.dataset.category = inf.category;
        row.innerHTML = `
            <td><strong>${inf.german}</strong></td>
            <td>${inf.english}</td>
            <td>${inf.badge}</td>
            <td><code>${inf.rules || 'N/A'}</code></td>
            <td><span class="cat-badge">${inf.categoryLabel}</span></td>
        `;
        tableBody.appendChild(row);
    });
    
    // Initialize filter if not already done
    if (!window.infractionsFilterInitialized) {
        initInfractionsFilter();
        window.infractionsFilterInitialized = true;
    }
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

/**
 * Initialize infractions filter functionality
 */
function initInfractionsFilter() {
    const filterButtons = document.querySelectorAll('.infractions-filter .filter-btn');
    const infractionRows = document.querySelectorAll('.infractions-table tbody tr');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            
            // Filter rows
            infractionRows.forEach(row => {
                if (category === 'all' || row.dataset.category === category) {
                    row.classList.remove('hidden');
                } else {
                    row.classList.add('hidden');
                }
            });
        });
    });
}
