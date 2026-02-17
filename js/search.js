/**
 * Hockey Rules - Search Functionality
 * Handles full-text search with live results and highlighting
 */

let searchInput;
let clearSearchBtn;
let searchTimeout = null;

/**
 * Initialize search functionality
 */
function initSearch() {
    searchInput = document.getElementById('searchInput');
    clearSearchBtn = document.getElementById('clearSearch');
    
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
    
    const trimmedQuery = query.trim().toLowerCase();
    
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
    
    window.appState.rules.categories.forEach(category => {
        // Skip if category is filtered out
        if (window.appState.activeFilters.size > 0 && !window.appState.activeFilters.has(category.id)) {
            return;
        }
        
        category.rules.forEach(rule => {
            // Search in rule number, title, description, and details
            const searchText = [
                rule.number,
                rule.title,
                rule.description,
                rule.details || ''
            ].join(' ').toLowerCase();
            
            if (searchText.includes(query)) {
                results.push({
                    rule: rule,
                    category: category
                });
            }
        });
    });
    
    return results;
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
                <br>Versuche es mit anderen Suchbegriffen.
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
        
        const rulesList = group.rules.map(rule => 
            createHighlightedRuleElement(rule, query, group.category)
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
function createHighlightedRuleElement(rule, query, category) {
    const isBookmarked = window.appState.bookmarks.has(rule.number);
    
    // Highlight search terms in text
    const highlightedTitle = highlightText(rule.title, query);
    const highlightedDescription = highlightText(rule.description, query);
    const highlightedDetails = rule.details ? highlightText(rule.details, query) : '';
    
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
        </div>
    `;
}

/**
 * Highlight search query in text
 */
function highlightText(text, query) {
    if (!query || !text) return escapeHtml(text);
    
    const escapedText = escapeHtml(text);
    const escapedQuery = escapeRegex(query);
    
    // Case-insensitive highlighting
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(regex, '<span class="highlight">$1</span>');
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
