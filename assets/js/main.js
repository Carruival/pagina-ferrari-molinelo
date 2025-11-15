// Main Application Module
import { config } from './modules/config.js';
import { Utils } from './modules/utils.js';
import { Database } from './modules/database.js';
import { Auth } from './modules/auth.js';
import { Calculations } from './modules/calculations.js';
import { UI } from './modules/ui.js';

class FerrariApp {
    constructor() {
        // Initialize modules
        this.config = config;
        this.ui = new UI();
        this.database = new Database(this.config.firebaseConfig);
        this.auth = new Auth(this.database);
        this.calculations = new Calculations();
        
        // Application state
        this.state = {
            currentSection: 'chat',
            isLoading: true,
            messages: [],
            drivers: [],
            results: [],
            circuits: [],
            customStats: [],
            filterCategory: 'Todas',
            editingStates: {
                driver: null,
                result: null,
                circuit: null,
                stat: null
            },
            strategy: {
                circuit: 'FRA',
                tyrePoints: 49,
                fuelPoints: 100,
                stints: [{ compound: 'M', laps: 6, boost: 'neutral' }]
            }
        };

        this.init();
    }

    async init() {
        try {
            // Show loading state
            this.showLoadingState();

            // Wait for database initialization
            await this.database.initPromise;

            // Initialize data subscriptions
            await this.initializeDataSubscriptions();

            // Load user strategy if authenticated
            if (this.auth.isAuthenticated()) {
                await this.loadUserStrategy();
            }

            // Initial render
            this.render();

            // Hide loading state
            this.hideLoadingState();

            // Show success message
            this.ui.showToast('Aplicación cargada correctamente', 'success');

        } catch (error) {
            console.error('Error initializing app:', error);
            this.ui.showToast('Error cargando la aplicación', 'error');
            this.showErrorState(error.message);
        }
    }

    showLoadingState() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="spinner mx-auto mb-4"></div>
                    <h1 class="text-5xl font-bold text-red-600 mb-4">FERRARI</h1>
                    <p class="text-zinc-400">Cargando aplicación...</p>
                    <div class="mt-4">
                        ${this.ui.showProgress(1, 3, 'Inicializando módulos')}
                    </div>
                </div>
            </div>
        `;
    }

    hideLoadingState() {
        this.state.isLoading = false;
    }

    showErrorState(message) {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center max-w-md">
                    <div class="error-message mb-6">
                        <span class="text-4xl">⚠️</span>
                        <h2 class="text-2xl font-bold mt-4 mb-2">Error de Aplicación</h2>
                        <p>${Utils.sanitizeInput(message)}</p>
                    </div>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Recargar Página
                    </button>
                </div>
            </div>
        `;
    }

    async initializeDataSubscriptions() {
        // Subscribe to real-time data updates
        await this.database.subscribe('messages', (data) => {
            this.state.messages = data ? Object.values(data).sort((a, b) => a.timestamp - b.timestamp) : [];
            if (this.state.currentSection === 'chat') this.render();
        });

        await this.database.subscribe('drivers', (data) => {
            this.state.drivers = data ? Object.values(data) : [];
            if (this.state.currentSection === 'drivers') this.render();
        });

        await this.database.subscribe('results', (data) => {
            this.state.results = data ? Object.values(data) : [];
            if (this.state.currentSection === 'results') this.render();
        });

        await this.database.subscribe('circuits', (data) => {
            this.state.circuits = data ? Object.values(data) : [];
            if (this.state.currentSection === 'circuits') this.render();
        });

        await this.database.subscribe('customStats', (data) => {
            this.state.customStats = data ? Object.values(data) : this.config.getDefaultCustomStats();
            if (this.state.currentSection === 'drivers') this.render();
        });
    }

    async loadUserStrategy() {
        if (!this.auth.isAuthenticated()) return;

        const strategy = await this.database.getStrategy(this.auth.getCurrentUser().username);
        if (strategy) {
            this.state.strategy = strategy;
            if (this.state.currentSection === 'strategy') this.render();
        }
    }

    async saveStrategy() {
        if (!this.auth.isAuthenticated()) return;

        try {
            const result = await this.database.saveStrategy(
                this.auth.getCurrentUser().username, 
                this.state.strategy
            );
            
            if (result.success) {
                this.ui.showToast('Estrategia guardada', 'success');
            } else {
                this.ui.showToast('Error guardando estrategia', 'error');
            }
        } catch (error) {
            console.error('Error saving strategy:', error);
            this.ui.showToast('Error guardando estrategia', 'error');
        }
    }

    render() {
        if (this.state.isLoading) return;

        const appDiv = document.getElementById('app');
        
        if (!this.auth.isAuthenticated()) {
            this.renderAuthScreen();
            return;
        }

        const user = this.auth.getCurrentUser();
        const isAdmin = this.auth.isAdmin();

        appDiv.innerHTML = `
            ${this.renderHeader(user, isAdmin)}
            ${this.renderNavigation()}
            <main class="container mx-auto py-6" role="main">
                ${this.renderCurrentSection()}
            </main>
            ${this.renderFooter()}
        `;

        this.attachEventListeners();
    }

    renderAuthScreen() {
        const appDiv = document.getElementById('app');
        
        // Check if we're in register mode
        const showRegister = this.state.showRegister || false;
        
        if (showRegister) {
            appDiv.innerHTML = this.renderRegisterForm();
        } else {
            appDiv.innerHTML = this.renderLoginForm();
        }
    }

    renderLoginForm() {
        return `
            <div class="min-h-screen flex items-center justify-center p-4">
                <div class="card max-w-md w-full">
                    <div class="text-center mb-8">
                        <h1 class="text-5xl font-bold text-red-600 mb-2">FERRARI</h1>
                        <p class="text-zinc-400">Racing Game Manager</p>
                    </div>
                    <form id="loginForm" class="space-y-4" novalidate>
                        <div class="form-group">
                            <label for="login-username" class="form-label">Usuario</label>
                            <input 
                                id="login-username"
                                name="username" 
                                type="text"
                                class="form-input" 
                                required 
                                autocomplete="username"
                                aria-describedby="username-error"
                            />
                            <div id="username-error" class="form-error"></div>
                        </div>
                        <div class="form-group">
                            <label for="login-password" class="form-label">Contraseña</label>
                            <input 
                                id="login-password"
                                name="password" 
                                type="password" 
                                class="form-input" 
                                required 
                                autocomplete="current-password"
                                aria-describedby="password-error"
                            />
                            <div id="password-error" class="form-error"></div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-lg w-full">
                            ENTRAR
                        </button>
                        <button type="button" id="showRegister" class="btn btn-ghost w-full">
                            ¿No tienes cuenta? Regístrate
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    renderRegisterForm() {
        return `
            <div class="min-h-screen flex items-center justify-center p-4">
                <div class="card max-w-md w-full">
                    <div class="text-center mb-8">
                        <h1 class="text-5xl font-bold text-red-600 mb-2">FERRARI</h1>
                        <p class="text-zinc-400">Crear Cuenta</p>
                    </div>
                    <form id="registerForm" class="space-y-4" novalidate>
                        <div class="form-group">
                            <label for="reg-username" class="form-label">Usuario</label>
                            <input 
                                id="reg-username"
                                name="username" 
                                type="text" 
                                class="form-input" 
                                required 
                                autocomplete="username"
                                aria-describedby="reg-username-error"
                            />
                            <div id="reg-username-error" class="form-error"></div>
                        </div>
                        <div class="form-group">
                            <label for="reg-password" class="form-label">Contraseña</label>
                            <input 
                                id="reg-password"
                                name="password" 
                                type="password" 
                                class="form-input" 
                                required 
                                autocomplete="new-password"
                                aria-describedby="reg-password-error"
                            />
                            <div class="form-help">Mínimo 6 caracteres</div>
                            <div id="reg-password-error" class="form-error"></div>
                        </div>
                        <div class="form-group">
                            <label for="reg-confirm" class="form-label">Confirmar Contraseña</label>
                            <input 
                                id="reg-confirm"
                                name="confirm" 
                                type="password" 
                                class="form-input" 
                                required 
                                autocomplete="new-password"
                                aria-describedby="reg-confirm-error"
                            />
                            <div id="reg-confirm-error" class="form-error"></div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-lg w-full">
                            CREAR CUENTA
                        </button>
                        <button type="button" id="backToLogin" class="btn btn-ghost w-full">
                            ← Volver al login
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    renderHeader(user, isAdmin) {
        return `
            <header class="header" role="banner">
                <div class="header-content container mx-auto">
                    <div>
                        <h1 class="header-title">FERRARI RACING</h1>
                        <p class="header-subtitle">
                            ${user.username} ${isAdmin ? '👑 Admin' : ''}
                        </p>
                    </div>
                    <button id="logoutBtn" class="btn btn-secondary">
                        Salir
                    </button>
                </div>
            </header>
        `;
    }

    renderNavigation() {
        const sections = [
            { id: 'chat', label: '💬 Chat', icon: '💬' },
            { id: 'strategy', label: '🏁 Estrategia', icon: '🏁' },
            { id: 'circuits', label: '🏁 Circuitos', icon: '🏛️' },
            { id: 'results', label: '🏆 Resultados', icon: '🏆' },
            { id: 'drivers', label: '👥 Pilotos', icon: '👥' }
        ];

        return `
            <nav class="bg-zinc-900 border-b border-zinc-800" role="navigation" aria-label="Navegación principal">
                <div class="container mx-auto">
                    <div class="nav-tabs">
                        ${sections.map(section => `
                            <button 
                                data-section="${section.id}" 
                                class="nav-tab ${this.state.currentSection === section.id ? 'active' : ''}"
                                aria-pressed="${this.state.currentSection === section.id}"
                            >
                                <span class="sr-only">${section.label}</span>
                                <span aria-hidden="true">${section.icon} ${section.label.split(' ')[1]}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </nav>
        `;
    }

    renderCurrentSection() {
        switch (this.state.currentSection) {
            case 'chat': return this.renderChatSection();
            case 'strategy': return this.renderStrategySection();
            case 'drivers': return this.renderDriversSection();
            case 'results': return this.renderResultsSection();
            case 'circuits': return this.renderCircuitsSection();
            default: return '<div class="error-message">Sección no encontrada</div>';
        }
    }

    renderChatSection() {
        return `
            <section aria-labelledby="chat-title">
                <div class="card">
                    <h2 id="chat-title" class="card-title">Chat 🔥</h2>
                    <div class="chat-container">
                        <div class="chat-messages" id="chatMessages" role="log" aria-live="polite" aria-label="Mensajes del chat">
                            ${this.state.messages.map(msg => `
                                <div class="chat-message">
                                    <div class="chat-message-header">
                                        <span class="chat-username">${Utils.sanitizeInput(msg.user)}</span>
                                        <span class="chat-timestamp">${msg.time}</span>
                                    </div>
                                    <p class="text-zinc-200">${Utils.sanitizeInput(msg.text)}</p>
                                </div>
                            `).join('')}
                        </div>
                        <form id="chatForm" class="chat-input-container">
                            <label for="chatInput" class="sr-only">Escribir mensaje</label>
                            <input 
                                id="chatInput"
                                name="message" 
                                class="form-input flex-1" 
                                placeholder="Escribe tu mensaje..."
                                autocomplete="off"
                                maxlength="500"
                            />
                            <button type="submit" class="btn btn-primary">
                                Enviar
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        `;
    }

    renderStrategySection() {
        const circuitsData = this.config.getCircuitsData();
        const totalLaps = this.state.strategy.stints.reduce((sum, s) => sum + s.laps, 0);
        const circuit = circuitsData[this.state.strategy.circuit];
        
        let totalFuel = 0;
        this.state.strategy.stints.forEach(stint => {
            const fuelCalc = this.calculations.calculateStintFuel(
                this.state.strategy.circuit, 
                this.state.strategy.fuelPoints, 
                stint.laps, 
                stint.boost
            );
            if (fuelCalc.success) {
                totalFuel += parseFloat(fuelCalc.data.stintFuel);
            }
        });

        return `
            <section aria-labelledby="strategy-title">
                <div class="card">
                    <h2 id="strategy-title" class="card-title">🏁 Planificador de Estrategia</h2>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <!-- Configuration Panel -->
                        <div class="card">
                            <h3 class="text-xl font-bold mb-4">Configuración</h3>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="circuitSelect" class="form-label">Circuito</label>
                                    <select id="circuitSelect" class="form-input">
                                        ${Object.entries(circuitsData).map(([code, data]) => `
                                            <option value="${code}" ${this.state.strategy.circuit === code ? 'selected' : ''}>
                                                ${data.name} (${code})
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="tyrePointsInput" class="form-label">
                                        Puntos de Neumático
                                        <div class="tooltip">
                                            <span class="text-info cursor-help">ℹ️</span>
                                            <div class="tooltip-content">
                                                Afecta el desgaste de los neumáticos
                                            </div>
                                        </div>
                                    </label>
                                    <input 
                                        id="tyrePointsInput" 
                                        type="number" 
                                        value="${this.state.strategy.tyrePoints}" 
                                        class="form-input"
                                        min="1"
                                        max="200"
                                    />
                                </div>
                                
                                <div class="form-group">
                                    <label for="fuelPointsInput" class="form-label">
                                        Puntos de Combustible
                                        <div class="tooltip">
                                            <span class="text-info cursor-help">ℹ️</span>
                                            <div class="tooltip-content">
                                                Afecta el consumo de combustible
                                            </div>
                                        </div>
                                    </label>
                                    <input 
                                        id="fuelPointsInput" 
                                        type="number" 
                                        value="${this.state.strategy.fuelPoints}" 
                                        class="form-input"
                                        min="1"
                                        max="200"
                                    />
                                </div>
                                
                                <div class="form-group">
                                    <label for="stintsInput" class="form-label">Número de Stints</label>
                                    <input 
                                        id="stintsInput" 
                                        type="number" 
                                        min="1" 
                                        max="5" 
                                        value="${this.state.strategy.stints.length}" 
                                        class="form-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Circuit Information -->
                        <div class="card">
                            <h3 class="text-xl font-bold mb-4">Información del Circuito</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-zinc-400">Longitud:</span>
                                    <span class="font-bold">${circuit.length} km</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-zinc-400">Vueltas totales:</span>
                                    <span class="font-bold">${circuit.laps}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-zinc-400">Desgaste base:</span>
                                    <span class="font-bold">${circuit.tyreWear}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-zinc-400">Dificultad:</span>
                                    <span class="font-bold">${circuit.difficulty}</span>
                                </div>
                                <div class="pt-4 border-t border-zinc-700">
                                    <div class="flex justify-between">
                                        <span class="text-zinc-400">Combustible total:</span>
                                        <span class="text-2xl font-bold text-red-500">${Utils.formatNumber(totalFuel, 2)} L</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Stints Configuration -->
                    <div class="card">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold">Stints</h3>
                            <button id="optimizeStrategy" class="btn btn-secondary btn-sm" 
                                    title="Optimizar estrategia automáticamente">
                                🧠 Optimizar
                            </button>
                        </div>
                        
                        <div class="space-y-4">
                            ${this.renderStints()}
                        </div>
                        
                        ${this.state.strategy.stints.length < 5 ? `
                            <button id="addStint" class="btn btn-primary w-full mt-4">
                                + Añadir Stint
                            </button>
                        ` : ''}
                        
                        <!-- Strategy Summary -->
                        <div class="mt-6 p-4 bg-gradient-to-r from-red-900 to-red-800 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-xl font-bold">Total de vueltas:</span>
                                <span class="text-3xl font-bold ${totalLaps === circuit.laps ? 'text-green-400' : 'text-yellow-400'}">
                                    ${totalLaps} / ${circuit.laps}
                                </span>
                            </div>
                            ${totalLaps !== circuit.laps ? `
                                <p class="text-yellow-300 text-sm mt-2">
                                    ⚠️ Las vueltas no coinciden con la distancia de carrera
                                </p>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    renderStints() {
        return this.state.strategy.stints.map((stint, index) => {
            const tyreCalc = this.calculations.calculateTyreWear(
                this.state.strategy.circuit, 
                stint.compound, 
                stint.laps, 
                this.state.strategy.tyrePoints
            );
            
            const fuelCalc = this.calculations.calculateStintFuel(
                this.state.strategy.circuit, 
                this.state.strategy.fuelPoints, 
                stint.laps, 
                stint.boost
            );

            const compounds = [
                { code: 'SS', name: 'Superblando', class: 'compound-ss' },
                { code: 'S', name: 'Blando', class: 'compound-s' },
                { code: 'M', name: 'Medio', class: 'compound-m' },
                { code: 'H', name: 'Duro', class: 'compound-h' }
            ];

            return `
                <div class="card bg-zinc-800">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-2xl font-bold text-red-500">Stint ${index + 1}</h4>
                        ${this.state.strategy.stints.length > 1 ? `
                            <button class="removeStint btn btn-ghost btn-sm" data-index="${index}" 
                                    title="Eliminar stint">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                    
                    <!-- Compound Selection -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        ${compounds.map(comp => `
                            <button class="compoundBtn ${comp.class} px-4 py-3 rounded-lg font-bold transition-all
                                           ${stint.compound === comp.code ? 'ring-4 ring-white' : 'opacity-50 hover:opacity-75'}" 
                                    data-index="${index}" 
                                    data-compound="${comp.code}"
                                    title="${comp.name}">
                                ${comp.code}
                            </button>
                        `).join('')}
                    </div>
                    
                    <!-- Stint Configuration -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Vueltas</label>
                            <input class="lapsInput form-input" 
                                   type="number" 
                                   min="1" 
                                   value="${stint.laps}" 
                                   data-index="${index}" />
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Empuje</label>
                            <select class="boostSelect form-input" data-index="${index}">
                                ${Object.entries(this.config.appConfig.boostLevels).map(([key, boost]) => `
                                    <option value="${key}" ${stint.boost === key ? 'selected' : ''}>
                                        ${boost.label}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Stint Analysis -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Tyre Analysis -->
                        <div class="bg-zinc-900 p-3 rounded-lg">
                            <h5 class="font-bold mb-2 text-yellow-400">📊 Análisis de Neumáticos</h5>
                            <div class="space-y-1 text-sm">
                                <div class="flex justify-between">
                                    <span>Desgaste base (W):</span>
                                    <span class="text-yellow-400">${tyreCalc.success ? tyreCalc.baseWear : 'Error'}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>W con ${stint.compound}:</span>
                                    <span class="text-orange-400">${tyreCalc.success ? tyreCalc.baseWearWithCompound : 'Error'}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Neumático restante:</span>
                                    <span class="font-bold text-lg ${tyreCalc.success && parseFloat(tyreCalc.remaining) > 50 ? 'text-green-400' : 'text-red-400'}">
                                        ${tyreCalc.success ? tyreCalc.remaining : 'Error'}%
                                    </span>
                                </div>
                                ${tyreCalc.success && tyreCalc.performanceImpact ? `
                                    <div class="flex justify-between">
                                        <span>Estado:</span>
                                        <span class="font-bold" style="color: ${tyreCalc.performanceImpact.color}">
                                            ${tyreCalc.performanceImpact.status}
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Fuel Analysis -->
                        <div class="bg-zinc-900 p-3 rounded-lg">
                            <h5 class="font-bold mb-2 text-blue-400">⛽ Análisis de Combustible</h5>
                            <div class="space-y-1 text-sm">
                                <div class="flex justify-between">
                                    <span>Combustible stint:</span>
                                    <span class="font-bold text-lg text-blue-400">
                                        ${fuelCalc.success ? fuelCalc.data.stintFuel : 'Error'} L
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Por vuelta:</span>
                                    <span class="text-blue-300">
                                        ${fuelCalc.success ? fuelCalc.data.fuelPerLap : 'Error'} L
                                    </span>
                                </div>
                                ${fuelCalc.success && fuelCalc.data.timeImpact ? `
                                    <div class="flex justify-between">
                                        <span>Impacto tiempo:</span>
                                        <span class="${fuelCalc.data.timeImpact.direction === 'faster' ? 'text-green-400' : fuelCalc.data.timeImpact.direction === 'slower' ? 'text-red-400' : 'text-gray-400'}">
                                            ${fuelCalc.data.timeImpact.total}s
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDriversSection() {
        // Implementation for drivers section - simplified for brevity
        return `
            <section aria-labelledby="drivers-title">
                <div class="card">
                    <h2 id="drivers-title" class="card-title">👥 Gestión de Pilotos</h2>
                    <p class="text-zinc-400">Sección de pilotos - En desarrollo</p>
                </div>
            </section>
        `;
    }

    renderResultsSection() {
        // Implementation for results section - simplified for brevity
        return `
            <section aria-labelledby="results-title">
                <div class="card">
                    <h2 id="results-title" class="card-title">🏆 Resultados</h2>
                    <p class="text-zinc-400">Sección de resultados - En desarrollo</p>
                </div>
            </section>
        `;
    }

    renderCircuitsSection() {
        // Implementation for circuits section - simplified for brevity
        return `
            <section aria-labelledby="circuits-title">
                <div class="card">
                    <h2 id="circuits-title" class="card-title">🏛️ Circuitos</h2>
                    <p class="text-zinc-400">Sección de circuitos - En desarrollo</p>
                </div>
            </section>
        `;
    }

    renderFooter() {
        return `
            <footer class="text-center py-4 text-zinc-600 text-sm">
                <p>Hecho por Álvaro Molinelli | Ferrari Racing Game v${this.config.appConfig.version}</p>
            </footer>
        `;
    }

    attachEventListeners() {
        // Authentication event listeners
        this.attachAuthEventListeners();
        
        // Navigation event listeners
        this.attachNavigationEventListeners();
        
        // Section-specific event listeners
        this.attachSectionEventListeners();
        
        // Strategy event listeners
        this.attachStrategyEventListeners();
    }

    attachAuthEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e);
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e);
            });
        }

        // Show register button
        const showRegisterBtn = document.getElementById('showRegister');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => {
                this.state.showRegister = true;
                this.renderAuthScreen();
            });
        }

        // Back to login button
        const backToLoginBtn = document.getElementById('backToLogin');
        if (backToLoginBtn) {
            backToLoginBtn.addEventListener('click', () => {
                this.state.showRegister = false;
                this.renderAuthScreen();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.auth.logout();
                this.render();
                this.ui.showToast('Sesión cerrada', 'info');
            });
        }
    }

    attachNavigationEventListeners() {
        // Section navigation
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.currentSection = e.target.dataset.section;
                this.render();
            });
        });
    }

    attachSectionEventListeners() {
        // Chat form
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleChatMessage(e);
            });
        }
    }

    attachStrategyEventListeners() {
        // Circuit selection
        const circuitSelect = document.getElementById('circuitSelect');
        if (circuitSelect) {
            circuitSelect.addEventListener('change', (e) => {
                this.state.strategy.circuit = e.target.value;
                this.saveStrategy();
                this.render();
            });
        }

        // Tyre points
        const tyrePointsInput = document.getElementById('tyrePointsInput');
        if (tyrePointsInput) {
            tyrePointsInput.addEventListener('change', (e) => {
                this.state.strategy.tyrePoints = Math.max(1, parseInt(e.target.value) || 100);
                this.saveStrategy();
                this.render();
            });
        }

        // Fuel points
        const fuelPointsInput = document.getElementById('fuelPointsInput');
        if (fuelPointsInput) {
            fuelPointsInput.addEventListener('change', (e) => {
                this.state.strategy.fuelPoints = Math.max(1, parseInt(e.target.value) || 100);
                this.saveStrategy();
                this.render();
            });
        }

        // Number of stints
        const stintsInput = document.getElementById('stintsInput');
        if (stintsInput) {
            stintsInput.addEventListener('change', (e) => {
                const newLength = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                
                while (this.state.strategy.stints.length < newLength) {
                    this.state.strategy.stints.push({ compound: 'M', laps: 10, boost: 'neutral' });
                }
                while (this.state.strategy.stints.length > newLength) {
                    this.state.strategy.stints.pop();
                }
                
                this.saveStrategy();
                this.render();
            });
        }

        // Compound buttons
        document.querySelectorAll('.compoundBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const compound = e.target.dataset.compound;
                this.state.strategy.stints[index].compound = compound;
                this.saveStrategy();
                this.render();
            });
        });

        // Laps inputs
        document.querySelectorAll('.lapsInput').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.state.strategy.stints[index].laps = Math.max(1, parseInt(e.target.value) || 1);
                this.saveStrategy();
                this.render();
            });
        });

        // Boost selects
        document.querySelectorAll('.boostSelect').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.state.strategy.stints[index].boost = e.target.value;
                this.saveStrategy();
                this.render();
            });
        });

        // Add stint button
        const addStintBtn = document.getElementById('addStint');
        if (addStintBtn) {
            addStintBtn.addEventListener('click', () => {
                if (this.state.strategy.stints.length < 5) {
                    this.state.strategy.stints.push({ compound: 'M', laps: 10, boost: 'neutral' });
                    this.saveStrategy();
                    this.render();
                }
            });
        }

        // Remove stint buttons
        document.querySelectorAll('.removeStint').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.state.strategy.stints.splice(index, 1);
                this.saveStrategy();
                this.render();
            });
        });

        // Optimize strategy button
        const optimizeBtn = document.getElementById('optimizeStrategy');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', async () => {
                await this.optimizeStrategy();
            });
        }
    }

    // Event Handlers
    async handleLogin(event) {
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        this.ui.setLoadingState(submitBtn, true, 'Iniciando sesión...');

        try {
            const formData = new FormData(form);
            const username = formData.get('username');
            const password = formData.get('password');

            const validation = this.ui.validateForm(form);
            if (!validation.isValid) {
                this.ui.showToast('Por favor corrige los errores', 'error');
                return;
            }

            const result = await this.auth.loginWithRateLimit(username, password);
            
            if (result.success) {
                this.ui.showToast('Inicio de sesión exitoso', 'success');
                await this.loadUserStrategy();
                this.render();
            } else {
                this.ui.showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.ui.showToast('Error durante el inicio de sesión', 'error');
        } finally {
            this.ui.setLoadingState(submitBtn, false);
        }
    }

    async handleRegister(event) {
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        this.ui.setLoadingState(submitBtn, true, 'Creando cuenta...');

        try {
            const formData = new FormData(form);
            const username = formData.get('username');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirm');

            const validation = this.ui.validateForm(form);
            if (!validation.isValid) {
                this.ui.showToast('Por favor corrige los errores', 'error');
                return;
            }

            const result = await this.auth.register(username, password, confirmPassword);
            
            if (result.success) {
                this.ui.showToast('Cuenta creada exitosamente', 'success');
                this.state.showRegister = false;
                this.renderAuthScreen();
            } else {
                this.ui.showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.ui.showToast('Error durante el registro', 'error');
        } finally {
            this.ui.setLoadingState(submitBtn, false);
        }
    }

    async handleChatMessage(event) {
        const form = event.target;
        const input = form.querySelector('input[name="message"]');
        const message = input.value.trim();

        if (!message) return;

        try {
            const user = this.auth.getCurrentUser();
            const messageData = {
                id: Utils.generateId(),
                user: user.username,
                text: message,
                time: Utils.formatTime(),
                timestamp: Date.now()
            };

            const result = await this.database.createMessage(messageData);
            
            if (result.success) {
                input.value = '';
                input.focus();
            } else {
                this.ui.showToast('Error enviando mensaje', 'error');
            }
        } catch (error) {
            console.error('Chat message error:', error);
            this.ui.showToast('Error enviando mensaje', 'error');
        }
    }

    async optimizeStrategy() {
        try {
            this.ui.showToast('Optimizando estrategia...', 'info');
            
            const circuitsData = this.config.getCircuitsData();
            const circuit = circuitsData[this.state.strategy.circuit];
            
            const result = this.calculations.optimizeStrategy(
                this.state.strategy.circuit,
                circuit.laps,
                this.state.strategy.tyrePoints,
                this.state.strategy.fuelPoints,
                {
                    maxStints: 3,
                    preferredCompounds: ['M', 'S', 'H'],
                    minStintLength: 5,
                    maxStintLength: Math.floor(circuit.laps * 0.7)
                }
            );

            if (result.success && result.data.recommended) {
                this.state.strategy.stints = result.data.recommended.stints.map(stint => ({
                    compound: stint.compound,
                    laps: stint.laps,
                    boost: stint.boost || 'neutral'
                }));
                
                await this.saveStrategy();
                this.render();
                this.ui.showToast('Estrategia optimizada', 'success');
            } else {
                this.ui.showToast('No se pudo optimizar la estrategia', 'warning');
            }
        } catch (error) {
            console.error('Strategy optimization error:', error);
            this.ui.showToast('Error optimizando estrategia', 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add skip link for accessibility
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Saltar al contenido principal';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Initialize app
    window.ferrariApp = new FerrariApp();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.ferrariApp && window.ferrariApp.ui) {
        window.ferrariApp.ui.showToast('Ha ocurrido un error inesperado', 'error');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.ferrariApp && window.ferrariApp.ui) {
        window.ferrariApp.ui.showToast('Error de conexión', 'error');
    }
});

export { FerrariApp };