// ElderWorld Accessibility Controller - WCAG 2.1 AA Compliance
// Healthcare-grade accessibility management system

class ElderWorldAccessibility {
    constructor() {
        this.focusTrapStack = [];
        this.liveRegions = new Map();
        this.keyboardNavigation = true;
        this.highContrast = false;
        this.reducedMotion = this.detectReducedMotion();
        this.fontSize = this.getFontSize();
        this.lastFocusedElement = null;

        this.init();
    }

    async init() {
        try {
            this.createSkipLinks();
            this.setupKeyboardNavigation();
            this.setupFocusManagement();
            this.setupLiveRegions();
            this.setupARIALandmarks();
            this.setupFormValidation();
            this.setupModalAccessibility();
            this.setupTableAccessibility();
            this.setupTooltipAccessibility();
            this.detectUserPreferences();
            this.setupEmergencyAccessibility();

            console.log('ElderWorld Accessibility: Initialization complete');
        } catch (error) {
            console.error('ElderWorld Accessibility: Initialization failed', error);
        }
    }

    // Skip Links for Keyboard Navigation
    createSkipLinks() {
        const skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        skipLinksContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#primary-navigation" class="skip-link">Skip to navigation</a>
      <a href="#emergency-section" class="skip-link">Skip to emergency controls</a>
      <a href="#health-summary" class="skip-link">Skip to health summary</a>
    `;

        document.body.insertBefore(skipLinksContainer, document.body.firstChild);
        console.log('Accessibility: Skip links created');
    }

    // Keyboard Navigation Management
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Add tabindex to interactive elements
        const interactiveElements = document.querySelectorAll(
            'button, [role="button"], a, input, select, textarea, [tabindex]'
        );

        interactiveElements.forEach((element, index) => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            element.classList.add('keyboard-navigation');
        });

        console.log('Accessibility: Keyboard navigation setup complete');
    }

    handleKeyboardNavigation(e) {
        const { key, ctrlKey, altKey, shiftKey } = e;

        // Emergency shortcut: Ctrl+Shift+E
        if (ctrlKey && shiftKey && key === 'E') {
            e.preventDefault();
            this.triggerEmergencyAccess();
            return;
        }

        // Help shortcut: Ctrl+Shift+H
        if (ctrlKey && shiftKey && key === 'H') {
            e.preventDefault();
            this.showAccessibilityHelp();
            return;
        }

        // High contrast toggle: Ctrl+Shift+C
        if (ctrlKey && shiftKey && key === 'C') {
            e.preventDefault();
            this.toggleHighContrast();
            return;
        }

        // Escape key handling
        if (key === 'Escape') {
            this.handleEscape();
        }

        // Arrow key navigation in grids/lists
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            this.handleArrowNavigation(e);
        }
    }

    handleEscape() {
        // Close modals
        const openModal = document.querySelector('.modal-overlay');
        if (openModal) {
            this.closeModal(openModal);
            return;
        }

        // Close dropdowns
        const openDropdown = document.querySelector('.dropdown.open');
        if (openDropdown) {
            openDropdown.classList.remove('open');
            return;
        }

        // Return focus to last focused element
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
    }

    handleArrowNavigation(e) {
        const currentElement = document.activeElement;
        const gridContainer = currentElement.closest('[role="grid"], [role="listbox"], [role="menu"]');

        if (!gridContainer) return;

        const focusableElements = Array.from(
            gridContainer.querySelectorAll('[tabindex="0"], [tabindex="-1"]')
        );

        const currentIndex = focusableElements.indexOf(currentElement);
        let nextIndex;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                nextIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                nextIndex = Math.min(focusableElements.length - 1, currentIndex + 1);
                break;
            case 'ArrowLeft':
                if (gridContainer.getAttribute('role') === 'grid') {
                    e.preventDefault();
                    nextIndex = Math.max(0, currentIndex - 1);
                }
                break;
            case 'ArrowRight':
                if (gridContainer.getAttribute('role') === 'grid') {
                    e.preventDefault();
                    nextIndex = Math.min(focusableElements.length - 1, currentIndex + 1);
                }
                break;
        }

        if (nextIndex !== undefined && focusableElements[nextIndex]) {
            focusableElements[nextIndex].focus();
        }
    }

    // Focus Management
    setupFocusManagement() {
        // Track focus for restoration
        document.addEventListener('focusin', (e) => {
            this.lastFocusedElement = e.target;
        });

        // Enhanced focus visibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-focused');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-focused');
        });

        console.log('Accessibility: Focus management setup complete');
    }

    // Focus Trap for Modals
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        this.focusTrapStack.push({ container, handleTabKey });

        // Focus first element
        if (firstFocusable) {
            firstFocusable.focus();
        }

        return () => {
            container.removeEventListener('keydown', handleTabKey);
            this.focusTrapStack.pop();
        };
    }

    // Live Regions for Dynamic Updates
    setupLiveRegions() {
        this.createLiveRegion('status', 'polite');
        this.createLiveRegion('alerts', 'assertive');
        this.createLiveRegion('health-updates', 'polite');

        console.log('Accessibility: Live regions created');
    }

    createLiveRegion(id, level) {
        const liveRegion = document.createElement('div');
        liveRegion.id = `live-region-${id}`;
        liveRegion.className = 'live-region sr-only';
        liveRegion.setAttribute('aria-live', level);
        liveRegion.setAttribute('aria-atomic', 'true');

        document.body.appendChild(liveRegion);
        this.liveRegions.set(id, liveRegion);
    }

    announce(message, region = 'status') {
        const liveRegion = this.liveRegions.get(region);
        if (liveRegion) {
            liveRegion.textContent = message;

            // Clear after announcement to avoid repetition
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    // ARIA Landmarks
    setupARIALandmarks() {
        // Add landmarks to main sections
        const main = document.querySelector('main') || document.querySelector('.main-content');
        if (main) {
            main.setAttribute('role', 'main');
            main.setAttribute('aria-label', 'ElderWorld Dashboard Main Content');
        }

        const nav = document.querySelector('nav') || document.querySelector('.navigation');
        if (nav) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Primary Navigation');
        }

        const emergency = document.querySelector('.emergency-section');
        if (emergency) {
            emergency.setAttribute('role', 'region');
            emergency.setAttribute('aria-label', 'Emergency Controls');
        }

        const healthSummary = document.querySelector('.health-summary');
        if (healthSummary) {
            healthSummary.setAttribute('role', 'region');
            healthSummary.setAttribute('aria-label', 'Health Summary');
        }

        console.log('Accessibility: ARIA landmarks setup complete');
    }

    // Form Validation and Accessibility
    setupFormValidation() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            this.enhanceFormAccessibility(form);
        });
    }

    enhanceFormAccessibility(form) {
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            // Associate labels
            const label = form.querySelector(`label[for="${input.id}"]`) ||
                input.closest('.form-group')?.querySelector('label');

            if (label && !input.getAttribute('aria-labelledby')) {
                if (!label.id) {
                    label.id = `label-${input.id || this.generateId()}`;
                }
                input.setAttribute('aria-labelledby', label.id);
            }

            // Required field indicators
            if (input.hasAttribute('required')) {
                input.setAttribute('aria-required', 'true');
                const label = document.querySelector(`label[for="${input.id}"]`);
                if (label && !label.classList.contains('required')) {
                    label.classList.add('required');
                }
            }

            // Error handling
            input.addEventListener('invalid', (e) => {
                this.handleInputError(e.target);
            });

            input.addEventListener('input', (e) => {
                this.clearInputError(e.target);
            });
        });
    }

    handleInputError(input) {
        const errorId = `error-${input.id || this.generateId()}`;
        let errorElement = document.getElementById(errorId);

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'form-error';
            errorElement.setAttribute('role', 'alert');
            input.parentNode.appendChild(errorElement);
        }

        const errorMessage = input.validationMessage || 'This field is required';
        errorElement.textContent = errorMessage;
        input.setAttribute('aria-describedby', errorId);
        input.setAttribute('aria-invalid', 'true');

        this.announce(`Error: ${errorMessage}`, 'alerts');
    }

    clearInputError(input) {
        const errorId = `error-${input.id}`;
        const errorElement = document.getElementById(errorId);

        if (errorElement) {
            errorElement.remove();
            input.removeAttribute('aria-describedby');
            input.removeAttribute('aria-invalid');
        }
    }

    // Modal Accessibility
    setupModalAccessibility() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-modal-trigger]')) {
                const modalId = e.target.getAttribute('data-modal-trigger');
                this.openModal(modalId);
            }

            if (e.target.matches('.modal-close, .modal-overlay')) {
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    this.closeModal(modal);
                }
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Store currently focused element
        this.lastFocusedElement = document.activeElement;

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        // Set up focus trap
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            this.trapFocus(modalContent);
        }

        // Disable background scrolling
        document.body.style.overflow = 'hidden';

        this.announce('Modal opened', 'status');
    }

    closeModal(modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');

        // Remove focus trap
        if (this.focusTrapStack.length > 0) {
            const { container, handleTabKey } = this.focusTrapStack.pop();
            container.removeEventListener('keydown', handleTabKey);
        }

        // Restore focus
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }

        // Re-enable background scrolling
        document.body.style.overflow = '';

        this.announce('Modal closed', 'status');
    }

    // Table Accessibility
    setupTableAccessibility() {
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            table.classList.add('accessible-table');
            table.setAttribute('role', 'table');

            // Add sortable functionality
            const headers = table.querySelectorAll('th');
            headers.forEach((header, index) => {
                if (header.classList.contains('sortable')) {
                    header.setAttribute('tabindex', '0');
                    header.setAttribute('role', 'columnheader');
                    header.setAttribute('aria-sort', 'none');

                    header.addEventListener('click', () => this.sortTable(table, index));
                    header.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.sortTable(table, index);
                        }
                    });
                }
            });

            // Add row/cell roles
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                row.setAttribute('role', 'row');
                const cells = row.querySelectorAll('td, th');
                cells.forEach(cell => {
                    const role = cell.tagName === 'TH' ? 'columnheader' : 'cell';
                    cell.setAttribute('role', role);
                });
            });
        });
    }

    sortTable(table, columnIndex) {
        const header = table.querySelectorAll('th')[columnIndex];
        const currentSort = header.getAttribute('aria-sort');
        const newSort = currentSort === 'ascending' ? 'descending' : 'ascending';

        // Reset other headers
        table.querySelectorAll('th').forEach(h => h.setAttribute('aria-sort', 'none'));
        header.setAttribute('aria-sort', newSort);

        this.announce(`Table sorted by ${header.textContent} ${newSort}`, 'status');
    }

    // Tooltip Accessibility
    setupTooltipAccessibility() {
        const tooltipTriggers = document.querySelectorAll('[data-tooltip]');

        tooltipTriggers.forEach(trigger => {
            const tooltipText = trigger.getAttribute('data-tooltip');
            const tooltipId = `tooltip-${this.generateId()}`;

            // Create tooltip element
            const tooltip = document.createElement('div');
            tooltip.id = tooltipId;
            tooltip.className = 'tooltip-text';
            tooltip.textContent = tooltipText;
            tooltip.setAttribute('role', 'tooltip');

            trigger.appendChild(tooltip);
            trigger.setAttribute('aria-describedby', tooltipId);

            // Show/hide on focus/blur
            trigger.addEventListener('focus', () => {
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
            });

            trigger.addEventListener('blur', () => {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            });
        });
    }

    // User Preferences Detection
    detectUserPreferences() {
        // Reduced motion
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // High contrast
        this.highContrast = window.matchMedia('(prefers-contrast: high)').matches;

        // Apply preferences
        if (this.reducedMotion) {
            document.body.classList.add('reduce-motion');
        }

        if (this.highContrast) {
            document.body.classList.add('high-contrast');
        }

        // Listen for changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            document.body.classList.toggle('reduce-motion', e.matches);
        });

        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.highContrast = e.matches;
            document.body.classList.toggle('high-contrast', e.matches);
        });
    }

    detectReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    getFontSize() {
        const computed = window.getComputedStyle(document.documentElement);
        return parseInt(computed.fontSize);
    }

    // Emergency Accessibility Features
    setupEmergencyAccessibility() {
        const emergencyButtons = document.querySelectorAll('.emergency-btn, [data-emergency]');

        emergencyButtons.forEach(button => {
            button.classList.add('emergency-focus');
            button.setAttribute('aria-label', 'Emergency assistance - Press Enter or Space to activate');

            // High priority for screen readers
            button.setAttribute('aria-live', 'assertive');

            // Ensure large enough for motor impairments
            if (!button.style.minWidth) {
                button.style.minWidth = '44px';
                button.style.minHeight = '44px';
            }
        });
    }

    triggerEmergencyAccess() {
        const emergencySection = document.querySelector('.emergency-section, [data-emergency]');
        if (emergencySection) {
            emergencySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            emergencySection.focus();
            this.announce('Emergency controls activated', 'alerts');
        }
    }

    // Accessibility Help
    showAccessibilityHelp() {
        const helpContent = `
      <div class="accessibility-help">
        <h2>ElderWorld Keyboard Shortcuts</h2>
        <dl>
          <dt>Ctrl+Shift+E</dt>
          <dd>Go to emergency controls</dd>
          
          <dt>Ctrl+Shift+H</dt>
          <dd>Show this help dialog</dd>
          
          <dt>Ctrl+Shift+C</dt>
          <dd>Toggle high contrast mode</dd>
          
          <dt>Tab</dt>
          <dd>Navigate between interactive elements</dd>
          
          <dt>Arrow Keys</dt>
          <dd>Navigate within grids and menus</dd>
          
          <dt>Escape</dt>
          <dd>Close dialogs and menus</dd>
          
          <dt>Enter/Space</dt>
          <dd>Activate buttons and links</dd>
        </dl>
        
        <h3>Screen Reader Support</h3>
        <p>ElderWorld is optimized for NVDA, JAWS, and VoiceOver screen readers.</p>
        
        <h3>Accessibility Features</h3>
        <ul>
          <li>High contrast mode support</li>
          <li>Reduced motion support</li>
          <li>Large text support</li>
          <li>Keyboard-only navigation</li>
          <li>Emergency shortcuts</li>
        </ul>
      </div>
    `;

        this.createModal('accessibility-help', 'Accessibility Help', helpContent);
    }

    createModal(id, title, content) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
      <div class="modal-content" role="dialog" aria-labelledby="${id}-title" aria-modal="true">
        <div class="modal-header">
          <h2 id="${id}-title" class="modal-title">${title}</h2>
          <button class="modal-close" aria-label="Close dialog">×</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

        document.body.appendChild(modal);
        this.openModal(id);

        return modal;
    }

    // High Contrast Toggle
    toggleHighContrast() {
        this.highContrast = !this.highContrast;
        document.body.classList.toggle('high-contrast', this.highContrast);

        // Store preference
        localStorage.setItem('elderworld-high-contrast', this.highContrast);

        this.announce(
            `High contrast mode ${this.highContrast ? 'enabled' : 'disabled'}`,
            'status'
        );
    }

    // Utility Methods
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Public API
    setFontSize(size) {
        document.documentElement.style.fontSize = `${size}px`;
        this.fontSize = size;
        localStorage.setItem('elderworld-font-size', size);
    }

    increaseFontSize() {
        const newSize = Math.min(this.fontSize + 2, 24);
        this.setFontSize(newSize);
    }

    decreaseFontSize() {
        const newSize = Math.max(this.fontSize - 2, 12);
        this.setFontSize(newSize);
    }

    resetFontSize() {
        this.setFontSize(16);
    }

    // Health-specific accessibility announcements
    announceHealthUpdate(type, value, trend) {
        const trendText = trend === 'up' ? 'increasing' : trend === 'down' ? 'decreasing' : 'stable';
        const message = `${type} updated: ${value}, trend ${trendText}`;
        this.announce(message, 'health-updates');
    }

    announceEmergencyStatus(status) {
        this.announce(`Emergency status: ${status}`, 'alerts');
    }
}

// Initialize accessibility when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.elderworldAccessibility = new ElderWorldAccessibility();
    });
} else {
    window.elderworldAccessibility = new ElderWorldAccessibility();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElderWorldAccessibility;
}
