/**
 * Hockey Rules - Filter Functionality
 * Handles category filtering with multi-select support
 */

let filterButtonsContainer;
let resetFiltersBtn;

/**
 * Initialize filter functionality
 */
function initFilters() {
    filterButtonsContainer = document.getElementById('filterButtons');
    resetFiltersBtn = document.getElementById('resetFilters');
    
    if (!filterButtonsContainer) return;
    
    // Generate filter buttons from categories
    generateFilterButtons();
    
    // Reset filters button
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
}

/**
 * Generate filter buttons for all categories
 */
function generateFilterButtons() {
    if (!window.appState || !window.appState.rules) {
        // Retry after a short delay if rules not loaded yet
        setTimeout(generateFilterButtons, 100);
        return;
    }
    
    filterButtonsContainer.innerHTML = '';
    
    window.appState.rules.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.dataset.category = category.id;
        button.textContent = `${category.icon} ${category.name}`;
        button.setAttribute('aria-label', `Filter nach ${category.name}`);
        button.setAttribute('aria-pressed', 'false');
        
        button.addEventListener('click', () => toggleFilter(category.id, button));
        
        filterButtonsContainer.appendChild(button);
    });
}

/**
 * Toggle filter for a category
 */
function toggleFilter(categoryId, button) {
    if (window.appState.activeFilters.has(categoryId)) {
        window.appState.activeFilters.delete(categoryId);
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
    } else {
        window.appState.activeFilters.add(categoryId);
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
    }
    
    // Apply filters
    applyFilters();
}

/**
 * Reset all filters
 */
function resetFilters() {
    window.appState.activeFilters.clear();
    
    // Remove active class from all filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    // Re-render rules
    applyFilters();
    
    window.showToast('Filter zurückgesetzt');
}

/**
 * Apply current filters and re-render
 */
function applyFilters() {
    // Check if there's an active search
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput && searchInput.value.trim() !== '') {
        // Re-run search with filters
        const searchEvent = new Event('input');
        searchInput.dispatchEvent(searchEvent);
    } else {
        // Just render with filters
        if (window.renderRules) {
            window.renderRules();
        }
    }
    
    // Show toast if filters are active
    if (window.appState.activeFilters.size > 0) {
        const filterCount = window.appState.activeFilters.size;
        window.showToast(`${filterCount} ${filterCount === 1 ? 'Filter' : 'Filter'} aktiv`);
    }
}

/**
 * Get currently active filter names
 */
function getActiveFilterNames() {
    const names = [];
    
    if (window.appState && window.appState.rules) {
        window.appState.rules.categories.forEach(category => {
            if (window.appState.activeFilters.has(category.id)) {
                names.push(category.name);
            }
        });
    }
    
    return names;
}

/**
 * Check if a category is currently filtered
 */
function isCategoryFiltered(categoryId) {
    return window.appState.activeFilters.has(categoryId);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFilters);
} else {
    initFilters();
}

// Export functions for use in other modules
window.resetFilters = resetFilters;
window.getActiveFilterNames = getActiveFilterNames;
window.isCategoryFiltered = isCategoryFiltered;
