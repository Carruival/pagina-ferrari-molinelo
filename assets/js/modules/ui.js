// UI Module
import { Utils } from './utils.js';

export class UI {
    constructor() {
        this.loadingStates = new Map();
        this.modalStack = [];
        this.toastContainer = null;
        this.init();
    }

    init() {
        this.createToastContainer();
        this.attachGlobalEventListeners();
    }

    // Create toast notification container
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        this.toastContainer.setAttribute('role', 'region');
        this.toastContainer.setAttribute('aria-label', 'Notificaciones');
        document.body.appendChild(this.toastContainer);
    }

    // Global event listeners
    attachGlobalEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
        
        // Click outside modal to close
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        
        // Handle form submissions
        document.addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // Handle focus management
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
    }

    // Global keyboard handler
    handleGlobalKeydown(event) {
        // Escape key closes modals
        if (event.key === 'Escape' && this.modalStack.length > 0) {
            this.closeModal();
            return;
        }

        // Ctrl+/ for help (future feature)
        if (event.ctrlKey && event.key === '/') {
            event.preventDefault();
            this.showHelp();
            return;
        }
    }

    // Global click handler
    handleGlobalClick(event) {
        // Close modal if clicking on overlay
        if (event.target.classList.contains('modal-overlay')) {
            this.closeModal();
        }

        // Close dropdowns when clicking outside
        const openDropdowns = document.querySelectorAll('.dropdown.open');
        openDropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    // Handle form submissions with loading states
    handleFormSubmit(event) {
        const form = event.target;
        if (form.dataset.handled) return;

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            this.setLoadingState(submitButton, true);
            
            // Set timeout to remove loading state if form doesn't handle it
            setTimeout(() => {
                this.setLoadingState(submitButton, false);
            }, 5000);
        }
    }

    // Focus management
    handleFocusIn(event) {
        // Ensure focused element is visible
        if (event.target.scrollIntoViewIfNeeded) {
            event.target.scrollIntoViewIfNeeded();
        } else {
            event.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Loading states management
    setLoadingState(element, isLoading, text = 'Cargando...') {
        if (!element) return;

        const elementId = element.id || Utils.generateId();
        element.id = elementId;

        if (isLoading) {
            this.loadingStates.set(elementId, {
                originalText: element.textContent,
                originalDisabled: element.disabled
            });

            element.disabled = true;
            element.innerHTML = `<span class="spinner mr-2"></span>${text}`;
        } else {
            const savedState = this.loadingStates.get(elementId);
            if (savedState) {
                element.textContent = savedState.originalText;
                element.disabled = savedState.originalDisabled;
                this.loadingStates.delete(elementId);
            }
        }
    }

    // Create loading skeleton
    createSkeleton(config = {}) {
        const {
            width = '100%',
            height = '20px',
            className = '',
            count = 1
        } = config;

        const container = document.createElement('div');
        container.className = `space-y-2 ${className}`;

        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'loading-skeleton';
            skeleton.style.width = width;
            skeleton.style.height = height;
            skeleton.setAttribute('aria-hidden', 'true');
            container.appendChild(skeleton);
        }

        return container;
    }

    // Toast notifications
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };

        toast.innerHTML = `
            <div class="flex items-center gap-3 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
                <span class="text-lg">${icons[type]}</span>
                <span class="flex-1">${Utils.sanitizeInput(message)}</span>
                <button class="close-toast text-white hover:text-gray-200 ml-2" aria-label="Cerrar notificación">×</button>
            </div>
        `;

        const closeButton = toast.querySelector('.close-toast');
        closeButton.addEventListener('click', () => this.removeToast(toast));

        this.toastContainer.appendChild(toast);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        // Animate in
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'transform 0.3s ease-out';
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        return toast;
    }

    removeToast(toast) {
        if (!toast.parentNode) return;

        toast.style.transform = 'translateX(100%)';
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    // Modal management
    showModal(content, options = {}) {
        const {
            title = '',
            size = 'medium',
            closable = true,
            className = ''
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'modal-title');

        const modal = document.createElement('div');
        modal.className = `modal-content ${size} ${className}`;

        let modalHTML = '';
        
        if (title || closable) {
            modalHTML += `
                <div class="modal-header flex justify-between items-center mb-6">
                    ${title ? `<h2 id="modal-title" class="text-xl font-bold">${Utils.sanitizeInput(title)}</h2>` : '<div></div>'}
                    ${closable ? '<button class="modal-close text-2xl hover:text-red-500" aria-label="Cerrar modal">×</button>' : ''}
                </div>
            `;
        }

        modalHTML += `<div class="modal-body">${content}</div>`;
        modal.innerHTML = modalHTML;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Handle close button
        if (closable) {
            const closeButton = modal.querySelector('.modal-close');
            closeButton.addEventListener('click', () => this.closeModal());
        }

        // Focus management
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        this.modalStack.push(overlay);
        return overlay;
    }

    closeModal() {
        if (this.modalStack.length === 0) return;

        const modal = this.modalStack.pop();
        
        // Animate out
        modal.style.opacity = '0';
        modal.addEventListener('transitionend', () => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });

        // Return focus to previously focused element
        if (this.modalStack.length === 0) {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.blur) {
                activeElement.blur();
            }
        }
    }

    // Form helpers
    createFormField(config) {
        const {
            type = 'text',
            name,
            label,
            placeholder = '',
            required = false,
            value = '',
            options = [],
            className = '',
            helpText = '',
            validation = {}
        } = config;

        const fieldId = `field-${name}`;
        const wrapper = document.createElement('div');
        wrapper.className = `form-group ${className}`;

        let fieldHTML = '';

        // Label
        if (label) {
            fieldHTML += `
                <label for="${fieldId}" class="form-label">
                    ${Utils.sanitizeInput(label)}
                    ${required ? '<span class="text-red-500 ml-1">*</span>' : ''}
                </label>
            `;
        }

        // Field
        if (type === 'select') {
            fieldHTML += `
                <select id="${fieldId}" name="${name}" class="form-input" ${required ? 'required' : ''}>
                    ${options.map(opt => `
                        <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
                            ${Utils.sanitizeInput(opt.label)}
                        </option>
                    `).join('')}
                </select>
            `;
        } else if (type === 'textarea') {
            fieldHTML += `
                <textarea 
                    id="${fieldId}" 
                    name="${name}" 
                    class="form-input" 
                    placeholder="${Utils.sanitizeInput(placeholder)}"
                    ${required ? 'required' : ''}
                    rows="4"
                >${Utils.sanitizeInput(value)}</textarea>
            `;
        } else {
            fieldHTML += `
                <input 
                    type="${type}" 
                    id="${fieldId}" 
                    name="${name}" 
                    class="form-input" 
                    placeholder="${Utils.sanitizeInput(placeholder)}"
                    value="${Utils.sanitizeInput(value)}"
                    ${required ? 'required' : ''}
                    ${validation.min ? `min="${validation.min}"` : ''}
                    ${validation.max ? `max="${validation.max}"` : ''}
                    ${validation.pattern ? `pattern="${validation.pattern}"` : ''}
                />
            `;
        }

        // Help text
        if (helpText) {
            fieldHTML += `<div class="form-help text-sm text-gray-400 mt-1">${Utils.sanitizeInput(helpText)}</div>`;
        }

        // Error container
        fieldHTML += `<div class="form-error" id="${fieldId}-error"></div>`;

        wrapper.innerHTML = fieldHTML;
        return wrapper;
    }

    // Form validation
    validateForm(form) {
        const errors = [];
        const fields = form.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            const fieldErrors = this.validateField(field);
            if (fieldErrors.length > 0) {
                errors.push({ field: field.name, errors: fieldErrors });
                this.showFieldError(field, fieldErrors[0]);
            } else {
                this.clearFieldError(field);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateField(field) {
        const errors = [];
        const value = field.value.trim();

        // Required validation
        if (field.required && !value) {
            errors.push('Este campo es requerido');
            return errors;
        }

        // Type-specific validation
        if (value) {
            switch (field.type) {
                case 'email':
                    if (!Utils.validateEmail(value)) {
                        errors.push('Email inválido');
                    }
                    break;
                case 'number':
                    if (isNaN(value)) {
                        errors.push('Debe ser un número');
                    } else {
                        const num = parseFloat(value);
                        if (field.min && num < parseFloat(field.min)) {
                            errors.push(`Mínimo: ${field.min}`);
                        }
                        if (field.max && num > parseFloat(field.max)) {
                            errors.push(`Máximo: ${field.max}`);
                        }
                    }
                    break;
                case 'password':
                    const passwordValidation = Utils.validatePassword(value);
                    if (!passwordValidation.isValid) {
                        errors.push(...passwordValidation.errors);
                    }
                    break;
            }

            // Pattern validation
            if (field.pattern && !new RegExp(field.pattern).test(value)) {
                errors.push('Formato inválido');
            }
        }

        return errors;
    }

    showFieldError(field, message) {
        const errorContainer = document.getElementById(`${field.id}-error`);
        if (errorContainer) {
            errorContainer.innerHTML = `<span class="form-error">${Utils.sanitizeInput(message)}</span>`;
        }
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
    }

    clearFieldError(field) {
        const errorContainer = document.getElementById(`${field.id}-error`);
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
        field.classList.remove('error');
        field.setAttribute('aria-invalid', 'false');
    }

    // Utility UI components
    createButton(config) {
        const {
            text,
            type = 'button',
            variant = 'primary',
            size = 'md',
            icon = '',
            disabled = false,
            className = '',
            onClick = null
        } = config;

        const button = document.createElement('button');
        button.type = type;
        button.className = `btn btn-${variant} btn-${size} ${className}`;
        button.disabled = disabled;

        let content = '';
        if (icon) content += `<span class="icon">${icon}</span>`;
        content += Utils.sanitizeInput(text);

        button.innerHTML = content;

        if (onClick) {
            button.addEventListener('click', onClick);
        }

        return button;
    }

    // Data table component
    createTable(data, columns, options = {}) {
        const {
            searchable = true,
            sortable = true,
            pagination = false,
            pageSize = 10,
            className = ''
        } = options;

        const container = document.createElement('div');
        container.className = `table-container ${className}`;

        let tableHTML = '';

        // Search
        if (searchable) {
            tableHTML += `
                <div class="table-search mb-4">
                    <input 
                        type="text" 
                        class="form-input" 
                        placeholder="Buscar..."
                        data-table-search
                    />
                </div>
            `;
        }

        // Table
        tableHTML += `
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            ${columns.map(col => `
                                <th class="${sortable ? 'sortable' : ''}" data-column="${col.key}">
                                    ${Utils.sanitizeInput(col.label)}
                                    ${sortable ? '<span class="sort-icon">↕</span>' : ''}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody data-table-body>
                        ${this.renderTableRows(data, columns)}
                    </tbody>
                </table>
            </div>
        `;

        // Pagination
        if (pagination) {
            tableHTML += `
                <div class="table-pagination mt-4 flex justify-between items-center">
                    <div class="pagination-info"></div>
                    <div class="pagination-controls"></div>
                </div>
            `;
        }

        container.innerHTML = tableHTML;

        // Attach event listeners
        if (searchable) {
            const searchInput = container.querySelector('[data-table-search]');
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filterTable(container, data, columns, e.target.value);
            }, 300));
        }

        if (sortable) {
            const headers = container.querySelectorAll('th.sortable');
            headers.forEach(header => {
                header.addEventListener('click', () => {
                    this.sortTable(container, data, columns, header.dataset.column);
                });
            });
        }

        return container;
    }

    renderTableRows(data, columns) {
        return data.map(row => `
            <tr>
                ${columns.map(col => `
                    <td>
                        ${col.render ? col.render(row[col.key], row) : Utils.sanitizeInput(row[col.key] || '')}
                    </td>
                `).join('')}
            </tr>
        `).join('');
    }

    filterTable(container, data, columns, query) {
        const filteredData = Utils.fuzzySearch(data, query, columns.map(col => col.key));
        const tbody = container.querySelector('[data-table-body]');
        tbody.innerHTML = this.renderTableRows(filteredData, columns);
    }

    sortTable(container, data, columns, columnKey) {
        // Implementation for table sorting
        // This would be expanded based on requirements
    }

    // Help system
    showHelp() {
        const helpContent = `
            <div class="help-content">
                <h3 class="text-lg font-bold mb-4">Atajos de teclado</h3>
                <div class="space-y-2">
                    <div><kbd>Ctrl + /</kbd> - Mostrar ayuda</div>
                    <div><kbd>Escape</kbd> - Cerrar modal</div>
                    <div><kbd>Tab</kbd> - Navegar entre elementos</div>
                </div>
                
                <h3 class="text-lg font-bold mb-4 mt-6">Funcionalidades</h3>
                <div class="space-y-2">
                    <div><strong>Chat:</strong> Comunicación en tiempo real</div>
                    <div><strong>Estrategia:</strong> Calculadora de neumáticos y combustible</div>
                    <div><strong>Pilotos:</strong> Gestión de estadísticas</div>
                    <div><strong>Resultados:</strong> Historial de carreras</div>
                    <div><strong>Circuitos:</strong> Información detallada</div>
                </div>
            </div>
        `;

        this.showModal(helpContent, {
            title: 'Ayuda - Ferrari Racing Game',
            size: 'large'
        });
    }

    // Accessibility helpers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Progress indicator
    showProgress(current, total, label = '') {
        const percentage = Math.round((current / total) * 100);
        
        const progressHTML = `
            <div class="progress-container" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                ${label ? `<div class="progress-label mb-2">${Utils.sanitizeInput(label)}</div>` : ''}
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-text mt-1 text-sm text-center">${percentage}%</div>
            </div>
        `;

        return progressHTML;
    }
}