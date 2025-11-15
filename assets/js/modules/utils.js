// Utility Functions Module
export class Utils {
    // Input sanitization
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Basic HTML sanitization
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Input validation
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePassword(password) {
        return {
            isValid: password.length >= 6,
            errors: password.length < 6 ? ['La contraseña debe tener al menos 6 caracteres'] : []
        };
    }

    static validateUsername(username) {
        const errors = [];
        
        if (!username || username.trim().length === 0) {
            errors.push('El nombre de usuario es requerido');
        } else if (username.length < 3) {
            errors.push('El nombre de usuario debe tener al menos 3 caracteres');
        } else if (username.length > 20) {
            errors.push('El nombre de usuario no puede tener más de 20 caracteres');
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('El nombre de usuario solo puede contener letras, números y guiones bajos');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Number formatting
    static formatNumber(num, decimals = 2) {
        if (isNaN(num)) return '0';
        return Number(num).toFixed(decimals);
    }

    static formatLargeNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Date formatting
    static formatTime(date = new Date()) {
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    static formatDate(date = new Date()) {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatDateTime(date = new Date()) {
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Flag emoji from country code
    static getFlag(code) {
        if (!code || code.length !== 2) return '🏁';
        
        const codePoints = code
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
            
        return String.fromCodePoint(...codePoints);
    }

    // Simple hash function (not cryptographically secure)
    static simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = Utils.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    // Generate unique ID
    static generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Local storage helpers with error handling
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Error saving to localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Error removing from localStorage:', error);
            return false;
        }
    }

    // Array helpers
    static arrayMove(arr, fromIndex, toIndex) {
        const element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
        return arr;
    }

    static arrayUnique(arr, key = null) {
        if (key) {
            const seen = new Set();
            return arr.filter(item => {
                const keyValue = item[key];
                if (seen.has(keyValue)) {
                    return false;
                } else {
                    seen.add(keyValue);
                    return true;
                }
            });
        }
        return [...new Set(arr)];
    }

    // Search and filter
    static fuzzySearch(items, query, keys = []) {
        if (!query) return items;
        
        const normalizedQuery = query.toLowerCase().trim();
        
        return items.filter(item => {
            if (keys.length === 0) {
                return String(item).toLowerCase().includes(normalizedQuery);
            }
            
            return keys.some(key => {
                const value = Utils.getNestedProperty(item, key);
                return String(value).toLowerCase().includes(normalizedQuery);
            });
        });
    }

    static getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Error handling
    static handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // You could extend this to send errors to a logging service
        const errorMessage = error.message || 'Ha ocurrido un error inesperado';
        
        return {
            success: false,
            error: errorMessage,
            context
        };
    }

    // Success response
    static handleSuccess(data = null, message = 'Operación exitosa') {
        return {
            success: true,
            data,
            message
        };
    }

    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return Utils.handleSuccess(null, 'Copiado al portapapeles');
        } catch (error) {
            return Utils.handleError(error, 'Copy to clipboard');
        }
    }

    // Device detection
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Performance measurement
    static performanceStart(label) {
        performance.mark(`${label}-start`);
    }

    static performanceEnd(label) {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        
        const measure = performance.getEntriesByName(label)[0];
        console.log(`${label} took ${measure.duration}ms`);
        
        return measure.duration;
    }

    // Color utilities
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // URL utilities
    static getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setUrlParameter(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.pushState({}, '', url);
    }
}