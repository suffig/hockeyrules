/**
 * Hockey Rules - Search Functionality
 * Handles advanced full-text search with keyword matching, normalization and highlighting
 */

let searchInput;
let clearSearchBtn;
let searchTimeout = null;
let searchChips = [];

const SEARCH_SYNONYMS = {
    'abseits': ['offside', 'off-side', 'off side'],
    'offside': ['abseits'],
    'icing': ['unerlaubter weitschuss'],
    'unerlaubter': ['icing'],
    'haken': ['hooking'],
    'hooking': ['haken'],
    'beinstellen': ['tripping'],
    'tripping': ['beinstellen'],
    'check': ['checking'],
    'checking': ['check'],
    'penalty': ['strafe'],
    'strafe': ['penalty', 'minor', 'major', 'misconduct'],
    'torhueter': ['goalkeeper'],
    'goalkeeper': ['torhueter'],
    'bully': ['face-off', 'faceoff'],
    'faceoff': ['bully', 'face-off'],
    'face-off': ['bully', 'faceoff']
};

/**
 * Initialize search functionality
 */
function initSearch() {
    searchInput = document.getElementById('searchInput');
    clearSearchBtn = document.getElementById('clearSearch');
    searchChips = Array.from(document.querySelectorAll('.search-chip'));
    
    if (!searchInput) return;
    
    // Search input event listener
    searchInput.addEventListener('input', handleSearchInput);
    
    // Clear search button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    // Enter key to search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });

    // Keyboard shortcut: "/" focuses search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    });

    // Quick search chips
    searchChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const value = chip.dataset.search || chip.textContent.trim();
            searchInput.value = value;
            performSearch(value);
            searchInput.focus();
        });
    });
}

/**
 * Handle search input with debouncing
 */
function handleSearchInput(e) {
    const query = e.target.value;
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Debounce search (wait 300ms after user stops typing)
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

/**
 * Perform search on rules
 */
function performSearch(query) {
    if (!window.appState || !window.appState.rules) return;
    
    const trimmedQuery = query.trim();
    
    // If query is empty, show all rules
    if (trimmedQuery === '') {
        renderAllRules();
        return;
    }
    
    // Search through all rules
    const results = searchRules(trimmedQuery);
    
    // Render search results
    renderSearchResults(results, trimmedQuery);
}

/**
 * Search through all rules and return matches
 */
function searchRules(query) {
    const results = [];
    const normalizedQuery = normalizeText(query);
    const queryTokens = tokenize(normalizedQuery);
    const expandedTokens = expandTokens(queryTokens);
    
    window.appState.rules.categories.forEach(category => {
        // Skip if category is filtered out
        if (window.appState.activeFilters.size > 0 && !window.appState.activeFilters.has(category.id)) {
            return;
        }
        
        category.rules.forEach(rule => {
            const scoring = scoreRule(rule, category, normalizedQuery, expandedTokens);
            if (scoring.score > 0) {
                results.push({
                    rule: rule,
                    category: category,
                    score: scoring.score,
                    matchedTerms: scoring.matchedTerms,
                    matchedKeywords: scoring.matchedKeywords
                });
            }
        });
    });
    
    return results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return parseFloat(a.rule.number) - parseFloat(b.rule.number);
    });
}

/**
 * Render search results with highlighting
 */
function renderSearchResults(results, query) {
    const rulesContent = document.getElementById('rulesContent');
    
    if (results.length === 0) {
        rulesContent.innerHTML = `
            <p class="empty-state">
                Keine Regeln gefunden für "${escapeHtml(query)}". 
                <br>Versuche Stichwörter wie <strong>Haken</strong>, <strong>Abseits</strong>, <strong>Regel 55</strong> oder <strong>Penalty</strong>.
            </p>
        `;
        return;
    }
    
    rulesContent.innerHTML = `
        <div class="search-results-header" style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--bg-secondary); border-radius: 8px;">
            <p style="color: var(--text-secondary); margin: 0;">
                <strong>${results.length}</strong> ${results.length === 1 ? 'Regel gefunden' : 'Regeln gefunden'} für 
                "<strong>${escapeHtml(query)}</strong>"
            </p>
            <p style="color: var(--text-muted); margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                Suche in Titel, Beschreibung, Kategorie, Regelnummer und hinterlegten Stichwörtern.
            </p>
        </div>
    `;
    
    // Group results by category
    const groupedResults = {};
    results.forEach(result => {
        const catId = result.category.id;
        if (!groupedResults[catId]) {
            groupedResults[catId] = {
                category: result.category,
                rules: []
            };
        }
        groupedResults[catId].rules.push(result.rule);
    });
    
    // Render each category with highlighted rules
    Object.values(groupedResults).forEach(group => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'rule-category';
        
        const header = `
            <div class="category-header">
                <h2 class="category-title">${group.category.icon} ${group.category.name}</h2>
            </div>
        `;
        
        const rulesList = group.rules.map(result => 
            createHighlightedRuleElement(result.rule, query, group.category, result)
        ).join('');
        
        categoryEl.innerHTML = `
            ${header}
            <div class="rules-list">
                ${rulesList}
            </div>
        `;
        
        // Add event listeners
        addRuleEventListeners(categoryEl);
        
        rulesContent.appendChild(categoryEl);
    });
}

/**
 * Create rule element with highlighted search terms
 */
function createHighlightedRuleElement(rule, query, category, searchMeta = {}) {
    const isBookmarked = window.appState.bookmarks.has(rule.number);
    
    // Highlight search terms in text
    const highlightedTitle = highlightText(rule.title, query);
    const highlightedDescription = highlightText(rule.description, query);
    const highlightedDetails = rule.details ? highlightText(rule.details, query) : '';
    const matchedKeywords = searchMeta.matchedKeywords || [];
    
    return `
        <div class="rule-item" data-rule="${rule.number}">
            <div class="rule-header">
                <span class="rule-number">${highlightText(`Regel ${rule.number}`, query)}</span>
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
            <h3 class="rule-title">${highlightedTitle}</h3>
            <p class="rule-description">${highlightedDescription}</p>
            ${rule.details ? `<p class="rule-details">${highlightedDetails}</p>` : ''}
            ${matchedKeywords.length > 0 ? `
                <div class="search-keyword-hits">
                    ${matchedKeywords.slice(0, 6).map(keyword => `<span class="search-keyword-tag">${escapeHtml(keyword)}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Highlight search query in text
 */
function highlightText(text, query) {
    if (!query || !text) return escapeHtml(text);
    
    let escapedText = escapeHtml(text);
    const terms = getHighlightTerms(query);
    
    terms.forEach(term => {
        const escapedQuery = escapeRegex(term);
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        escapedText = escapedText.replace(regex, '<span class="highlight">$1</span>');
    });
    
    return escapedText;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Escape special regex characters
 */
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize text for robust search (case, umlauts, punctuation)
 */
function normalizeText(text) {
    return (text || '')
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9.\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Tokenize normalized text
 */
function tokenize(text) {
    if (!text) return [];
    return text.split(' ').filter(token => token.length >= 2);
}

/**
 * Expand tokens with known synonyms
 */
function expandTokens(tokens) {
    const expanded = new Set(tokens);
    tokens.forEach(token => {
        (SEARCH_SYNONYMS[token] || []).forEach(syn => expanded.add(normalizeText(syn)));
    });
    return Array.from(expanded);
}

/**
 * Build term list for visual highlights
 */
function getHighlightTerms(query) {
    return Array.from(new Set(
        query
            .toLowerCase()
            .replace(/[^\p{L}\p{N}.\s-]/gu, ' ')
            .split(/\s+/)
            .filter(term => term.length >= 2)
    )).sort((a, b) => b.length - a.length);
}

/**
 * Score one rule for ranking
 */
function scoreRule(rule, category, normalizedQuery, expandedTokens) {
    const normalizedNumber = normalizeText(rule.number || '');
    const normalizedTitle = normalizeText(rule.title || '');
    const normalizedDescription = normalizeText(rule.description || '');
    const normalizedDetails = normalizeText(rule.details || '');
    const normalizedCategory = normalizeText(category.name || '');
    const normalizedCategoryDescription = normalizeText(category.description || '');
    const normalizedKeywords = (rule.keywords || []).map(k => normalizeText(k));
    const keywordSet = new Set(normalizedKeywords);
    const allText = [
        normalizedNumber,
        normalizedTitle,
        normalizedDescription,
        normalizedDetails,
        normalizedCategory,
        normalizedCategoryDescription,
        ...normalizedKeywords
    ].join(' ');
    
    let score = 0;
    const matchedTerms = new Set();
    const matchedKeywords = new Set();
    
    // Phrase bonus
    if (normalizedQuery && allText.includes(normalizedQuery)) {
        score += 40;
    }
    
    // Rule number exact shortcuts (e.g., "55", "regel 55")
    const plainNumber = normalizedQuery.replace(/^regel\s+/, '');
    if (plainNumber === normalizedNumber || normalizedQuery === `regel ${normalizedNumber}` || normalizedQuery === `rule ${normalizedNumber}`) {
        score += 120;
        matchedTerms.add(normalizedNumber);
    }
    
    expandedTokens.forEach(token => {
        let tokenMatched = false;
        
        if (normalizedTitle.includes(token)) {
            score += 22;
            tokenMatched = true;
        }
        if (keywordSet.has(token)) {
            score += 20;
            tokenMatched = true;
            matchedKeywords.add(token);
        } else {
            normalizedKeywords.forEach(keyword => {
                if (keyword.includes(token)) {
                    score += 14;
                    tokenMatched = true;
                    matchedKeywords.add(keyword);
                }
            });
        }
        if (normalizedDescription.includes(token)) {
            score += 10;
            tokenMatched = true;
        }
        if (normalizedDetails.includes(token)) {
            score += 8;
            tokenMatched = true;
        }
        if (normalizedCategory.includes(token) || normalizedCategoryDescription.includes(token)) {
            score += 6;
            tokenMatched = true;
        }
        if (normalizedNumber === token || normalizedNumber.startsWith(token)) {
            score += 30;
            tokenMatched = true;
        }
        
        if (tokenMatched) {
            matchedTerms.add(token);
        }
    });
    
    // Require at least one token match for non-empty query
    if (expandedTokens.length > 0 && matchedTerms.size === 0 && score < 40) {
        return { score: 0, matchedTerms: [], matchedKeywords: [] };
    }
    
    return {
        score,
        matchedTerms: Array.from(matchedTerms),
        matchedKeywords: Array.from(matchedKeywords)
    };
}

/**
 * Clear search and show all rules
 */
function clearSearch() {
    searchInput.value = '';
    renderAllRules();
}

/**
 * Render all rules (no search filter)
 */
function renderAllRules() {
    if (window.renderRules) {
        window.renderRules();
    }
}

/**
 * Add event listeners to rule elements
 */
function addRuleEventListeners(container) {
    // Bookmark buttons
    container.querySelectorAll('.btn-bookmark').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ruleNumber = btn.dataset.rule;
            if (window.appState && typeof window.appState.bookmarks !== 'undefined') {
                // Toggle bookmark
                if (window.appState.bookmarks.has(ruleNumber)) {
                    window.appState.bookmarks.delete(ruleNumber);
                    window.showToast('Lesezeichen entfernt');
                } else {
                    window.appState.bookmarks.add(ruleNumber);
                    window.showToast('Lesezeichen hinzugefügt');
                }
                // Save and re-render
                localStorage.setItem('bookmarks', JSON.stringify([...window.appState.bookmarks]));
                performSearch(searchInput.value); // Re-render with current search
            }
        });
    });
    
    // Share buttons
    container.querySelectorAll('.btn-share').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ruleNumber = btn.dataset.rule;
            
            // Find the rule
            let foundRule = null;
            for (const category of window.appState.rules.categories) {
                const rule = category.rules.find(r => r.number === ruleNumber);
                if (rule) {
                    foundRule = rule;
                    break;
                }
            }
            
            if (foundRule) {
                const text = `${foundRule.number}: ${foundRule.title}\n${foundRule.description}`;
                const url = window.location.href;
                
                if (navigator.share) {
                    navigator.share({
                        title: `Hockey Rules - Regel ${foundRule.number}`,
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
        });
    });
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        window.showToast('Regel in Zwischenablage kopiert');
    }).catch(err => {
        console.error('Failed to copy:', err);
        window.showToast('Kopieren fehlgeschlagen', 'error');
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    initSearch();
}
