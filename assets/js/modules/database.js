// Database Module
import { Utils } from './utils.js';

export class Database {
    constructor(firebaseConfig) {
        this.db = null;
        this.isInitialized = false;
        this.listeners = new Map();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.initPromise = this.initialize(firebaseConfig);
    }

    async initialize(config) {
        try {
            // Import Firebase modules
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js");
            const { getDatabase, ref, set, get, onValue, remove, off } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js");

            // Store Firebase functions for later use
            this.firebase = { ref, set, get, onValue, remove, off };
            
            const app = initializeApp(config);
            this.db = getDatabase(app);
            this.isInitialized = true;

            // Initialize default admin user if not exists
            await this.initializeDefaultData();

            return Utils.handleSuccess(null, 'Database initialized');
        } catch (error) {
            return Utils.handleError(error, 'Database initialization');
        }
    }

    async waitForInitialization() {
        if (!this.isInitialized) {
            await this.initPromise;
        }
    }

    async initializeDefaultData() {
        try {
            const users = await this.getUsers();
            if (!users || !users['admin_igp']) {
                await this.createUser('admin_igp', {
                    password: 'Kirito49', // This will be hashed by the auth module
                    isAdmin: true,
                    createdAt: Date.now()
                });
            }
        } catch (error) {
            console.warn('Could not initialize default data:', error);
        }
    }

    // Generic database operations with error handling
    async executeOperation(operation, path, data = null) {
        try {
            await this.waitForInitialization();
            
            const dbRef = this.firebase.ref(this.db, path);
            
            switch (operation) {
                case 'set':
                    await this.firebase.set(dbRef, data);
                    this.invalidateCache(path);
                    return Utils.handleSuccess(data, 'Data saved successfully');
                
                case 'get':
                    const cachedData = this.getFromCache(path);
                    if (cachedData) {
                        return Utils.handleSuccess(cachedData, 'Data retrieved from cache');
                    }
                    
                    const snapshot = await this.firebase.get(dbRef);
                    const result = snapshot.val();
                    this.setCache(path, result);
                    return Utils.handleSuccess(result, 'Data retrieved successfully');
                
                case 'remove':
                    await this.firebase.remove(dbRef);
                    this.invalidateCache(path);
                    return Utils.handleSuccess(null, 'Data removed successfully');
                
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        } catch (error) {
            return Utils.handleError(error, `Database ${operation}`);
        }
    }

    // Cache management
    getFromCache(path) {
        const cached = this.cache.get(path);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(path, data) {
        this.cache.set(path, {
            data,
            timestamp: Date.now()
        });
    }

    invalidateCache(path) {
        // Remove exact match and any nested paths
        const keysToRemove = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(path) || path.startsWith(key)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => this.cache.delete(key));
    }

    clearCache() {
        this.cache.clear();
    }

    // Real-time listeners with error handling
    async subscribe(path, callback) {
        try {
            await this.waitForInitialization();
            
            const dbRef = this.firebase.ref(this.db, path);
            const wrappedCallback = (snapshot) => {
                try {
                    const data = snapshot.val();
                    this.setCache(path, data);
                    callback(data);
                } catch (error) {
                    console.error('Error in subscription callback:', error);
                }
            };

            this.firebase.onValue(dbRef, wrappedCallback);
            
            // Store listener for cleanup
            this.listeners.set(path, { ref: dbRef, callback: wrappedCallback });
            
            return Utils.handleSuccess(null, 'Subscription created');
        } catch (error) {
            return Utils.handleError(error, 'Database subscription');
        }
    }

    unsubscribe(path) {
        try {
            const listener = this.listeners.get(path);
            if (listener) {
                this.firebase.off(listener.ref, listener.callback);
                this.listeners.delete(path);
                return Utils.handleSuccess(null, 'Subscription removed');
            }
            return Utils.handleError(new Error('Subscription not found'), 'Unsubscribe');
        } catch (error) {
            return Utils.handleError(error, 'Database unsubscribe');
        }
    }

    // User management
    async getUsers() {
        const result = await this.executeOperation('get', 'users');
        return result.success ? (result.data || {}) : {};
    }

    async createUser(username, userData) {
        const sanitizedUsername = Utils.sanitizeInput(username);
        return await this.executeOperation('set', `users/${sanitizedUsername}`, {
            ...userData,
            createdAt: userData.createdAt || Date.now(),
            lastLogin: null
        });
    }

    async updateUser(username, userData) {
        const sanitizedUsername = Utils.sanitizeInput(username);
        return await this.executeOperation('set', `users/${sanitizedUsername}`, {
            ...userData,
            updatedAt: Date.now()
        });
    }

    async deleteUser(username) {
        const sanitizedUsername = Utils.sanitizeInput(username);
        return await this.executeOperation('remove', `users/${sanitizedUsername}`);
    }

    // Messages
    async getMessages() {
        const result = await this.executeOperation('get', 'messages');
        const messages = result.success ? (result.data || {}) : {};
        return Object.values(messages).sort((a, b) => a.timestamp - b.timestamp);
    }

    async createMessage(messageData) {
        const sanitizedData = {
            id: messageData.id || Utils.generateId(),
            user: Utils.sanitizeInput(messageData.user),
            text: Utils.sanitizeInput(messageData.text),
            time: messageData.time || Utils.formatTime(),
            timestamp: messageData.timestamp || Date.now()
        };
        
        return await this.executeOperation('set', `messages/${sanitizedData.id}`, sanitizedData);
    }

    async deleteMessage(messageId) {
        return await this.executeOperation('remove', `messages/${messageId}`);
    }

    // Drivers
    async getDrivers() {
        const result = await this.executeOperation('get', 'drivers');
        const drivers = result.success ? (result.data || {}) : {};
        return Object.values(drivers);
    }

    async createDriver(driverData) {
        const sanitizedData = {
            id: driverData.id || Utils.generateId(),
            name: Utils.sanitizeInput(driverData.name),
            number: Utils.sanitizeInput(driverData.number),
            nationality: Utils.sanitizeInput(driverData.nationality),
            category: Utils.sanitizeInput(driverData.category),
            wins: parseInt(driverData.wins) || 0,
            podiums: parseInt(driverData.podiums) || 0,
            points: parseInt(driverData.points) || 0,
            customStats: driverData.customStats || {},
            createdAt: Date.now()
        };

        return await this.executeOperation('set', `drivers/${sanitizedData.id}`, sanitizedData);
    }

    async updateDriver(driverId, driverData) {
        return await this.executeOperation('set', `drivers/${driverId}`, {
            ...driverData,
            updatedAt: Date.now()
        });
    }

    async deleteDriver(driverId) {
        return await this.executeOperation('remove', `drivers/${driverId}`);
    }

    // Results
    async getResults() {
        const result = await this.executeOperation('get', 'results');
        const results = result.success ? (result.data || {}) : {};
        return Object.values(results);
    }

    async createResult(resultData) {
        const sanitizedData = {
            id: resultData.id || Utils.generateId(),
            race: Utils.sanitizeInput(resultData.race),
            date: Utils.sanitizeInput(resultData.date),
            category: Utils.sanitizeInput(resultData.category),
            positions: resultData.positions.map(pos => ({
                position: parseInt(pos.position),
                driver: Utils.sanitizeInput(pos.driver)
            })),
            createdAt: Date.now()
        };

        return await this.executeOperation('set', `results/${sanitizedData.id}`, sanitizedData);
    }

    async deleteResult(resultId) {
        return await this.executeOperation('remove', `results/${resultId}`);
    }

    // Circuits
    async getCircuits() {
        const result = await this.executeOperation('get', 'circuits');
        const circuits = result.success ? (result.data || {}) : {};
        return Object.values(circuits);
    }

    async createCircuit(circuitData) {
        const sanitizedData = {
            id: circuitData.id || Utils.generateId(),
            flag: Utils.sanitizeInput(circuitData.flag),
            name: Utils.sanitizeInput(circuitData.name),
            country: Utils.sanitizeInput(circuitData.country),
            length: Utils.sanitizeInput(circuitData.length),
            laps: parseInt(circuitData.laps) || 0,
            warmup: Utils.sanitizeInput(circuitData.warmup || ''),
            playstyle: Utils.sanitizeInput(circuitData.playstyle || ''),
            devPreferences: Utils.sanitizeInput(circuitData.devPreferences || ''),
            idealCorners: Utils.sanitizeInput(circuitData.idealCorners || ''),
            optimalStrategies: Utils.sanitizeInput(circuitData.optimalStrategies || ''),
            otherTips: Utils.sanitizeInput(circuitData.otherTips || ''),
            createdAt: Date.now()
        };

        return await this.executeOperation('set', `circuits/${sanitizedData.id}`, sanitizedData);
    }

    async deleteCircuit(circuitId) {
        return await this.executeOperation('remove', `circuits/${circuitId}`);
    }

    // Custom Stats
    async getCustomStats() {
        const result = await this.executeOperation('get', 'customStats');
        const stats = result.success ? (result.data || {}) : {};
        const statsArray = Object.values(stats);
        
        // Return default stats if none exist
        if (statsArray.length === 0) {
            return [
                { id: 1, name: 'Poles', icon: '⚡' },
                { id: 2, name: 'V. Rápidas', icon: '🏁' }
            ];
        }
        
        return statsArray;
    }

    async createCustomStat(statData) {
        const sanitizedData = {
            id: statData.id || Utils.generateId(),
            name: Utils.sanitizeInput(statData.name),
            icon: Utils.sanitizeInput(statData.icon || '📊'),
            createdAt: Date.now()
        };

        return await this.executeOperation('set', `customStats/${sanitizedData.id}`, sanitizedData);
    }

    async deleteCustomStat(statId) {
        return await this.executeOperation('remove', `customStats/${statId}`);
    }

    // Strategy management
    async getStrategy(username) {
        const sanitizedUsername = Utils.sanitizeInput(username);
        const result = await this.executeOperation('get', `strategies/${sanitizedUsername}`);
        return result.success ? result.data : null;
    }

    async saveStrategy(username, strategyData) {
        const sanitizedUsername = Utils.sanitizeInput(username);
        const sanitizedStrategy = {
            circuit: Utils.sanitizeInput(strategyData.circuit),
            tyrePoints: parseInt(strategyData.tyrePoints) || 100,
            fuelPoints: parseInt(strategyData.fuelPoints) || 100,
            stints: strategyData.stints.map(stint => ({
                compound: Utils.sanitizeInput(stint.compound),
                laps: parseInt(stint.laps) || 1,
                boost: Utils.sanitizeInput(stint.boost)
            })),
            updatedAt: Date.now()
        };

        return await this.executeOperation('set', `strategies/${sanitizedUsername}`, sanitizedStrategy);
    }

    // Batch operations
    async batchOperation(operations) {
        const results = [];
        
        for (const op of operations) {
            try {
                const result = await this.executeOperation(op.operation, op.path, op.data);
                results.push({ ...op, result });
            } catch (error) {
                results.push({ ...op, result: Utils.handleError(error, 'Batch operation') });
            }
        }
        
        return results;
    }

    // Data export
    async exportData(path = '') {
        try {
            const result = await this.executeOperation('get', path);
            if (result.success) {
                const exportData = {
                    data: result.data,
                    exportedAt: new Date().toISOString(),
                    version: '2.0.0'
                };
                return Utils.handleSuccess(exportData, 'Data exported successfully');
            }
            return result;
        } catch (error) {
            return Utils.handleError(error, 'Data export');
        }
    }

    // Cleanup
    cleanup() {
        // Remove all listeners
        for (const [path] of this.listeners) {
            this.unsubscribe(path);
        }
        
        // Clear cache
        this.clearCache();
        
        return Utils.handleSuccess(null, 'Database cleanup completed');
    }
}