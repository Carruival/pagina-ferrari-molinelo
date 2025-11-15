// Authentication Module
import { Utils } from './utils.js';

export class Auth {
    constructor(database) {
        this.db = database;
        this.currentUser = null;
        this.sessionKey = 'ferrari_session';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        
        this.loadSession();
    }

    // Simple password hashing (not cryptographically secure)
    hashPassword(password) {
        // In a real application, use bcrypt or similar
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        // Add salt-like behavior
        const salt = 'ferrari_salt_' + password.length;
        return Utils.simpleHash(Math.abs(hash).toString() + salt);
    }

    // Validate login credentials
    async validateLogin(username, password) {
        try {
            if (!username || !password) {
                return Utils.handleError(new Error('Usuario y contraseña son requeridos'), 'Login validation');
            }

            const sanitizedUsername = Utils.sanitizeInput(username.trim());
            const userValidation = Utils.validateUsername(sanitizedUsername);
            
            if (!userValidation.isValid) {
                return Utils.handleError(new Error(userValidation.errors[0]), 'Username validation');
            }

            const passwordValidation = Utils.validatePassword(password);
            if (!passwordValidation.isValid) {
                return Utils.handleError(new Error(passwordValidation.errors[0]), 'Password validation');
            }

            return Utils.handleSuccess({ username: sanitizedUsername, password });
        } catch (error) {
            return Utils.handleError(error, 'Login validation');
        }
    }

    // Login user
    async login(username, password) {
        try {
            const validation = await this.validateLogin(username, password);
            if (!validation.success) {
                return validation;
            }

            const users = await this.db.getUsers();
            const user = users[validation.data.username];

            if (!user) {
                return Utils.handleError(new Error('Usuario no encontrado'), 'Login');
            }

            const hashedPassword = this.hashPassword(password);
            const storedPassword = user.password;

            // Check if password is already hashed or plain text (for backward compatibility)
            const isValidPassword = storedPassword === hashedPassword || storedPassword === password;

            if (!isValidPassword) {
                return Utils.handleError(new Error('Contraseña incorrecta'), 'Login');
            }

            // Update password to hashed version if it was stored as plain text
            if (storedPassword === password) {
                await this.db.updateUser(validation.data.username, { 
                    ...user, 
                    password: hashedPassword 
                });
            }

            const userData = {
                username: validation.data.username,
                isAdmin: user.isAdmin === true,
                loginTime: Date.now()
            };

            this.currentUser = userData;
            this.saveSession(userData);

            return Utils.handleSuccess(userData, 'Login exitoso');
        } catch (error) {
            return Utils.handleError(error, 'Login');
        }
    }

    // Register new user
    async register(username, password, confirmPassword) {
        try {
            if (!username || !password || !confirmPassword) {
                return Utils.handleError(new Error('Todos los campos son requeridos'), 'Registration');
            }

            if (password !== confirmPassword) {
                return Utils.handleError(new Error('Las contraseñas no coinciden'), 'Registration');
            }

            const sanitizedUsername = Utils.sanitizeInput(username.trim());
            const userValidation = Utils.validateUsername(sanitizedUsername);
            
            if (!userValidation.isValid) {
                return Utils.handleError(new Error(userValidation.errors[0]), 'Registration');
            }

            const passwordValidation = Utils.validatePassword(password);
            if (!passwordValidation.isValid) {
                return Utils.handleError(new Error(passwordValidation.errors[0]), 'Registration');
            }

            const users = await this.db.getUsers();
            if (users[sanitizedUsername]) {
                return Utils.handleError(new Error('El usuario ya existe'), 'Registration');
            }

            const hashedPassword = this.hashPassword(password);
            const newUser = {
                password: hashedPassword,
                isAdmin: false,
                createdAt: Date.now(),
                lastLogin: null
            };

            await this.db.createUser(sanitizedUsername, newUser);

            return Utils.handleSuccess(null, 'Usuario creado exitosamente');
        } catch (error) {
            return Utils.handleError(error, 'Registration');
        }
    }

    // Logout
    logout() {
        this.currentUser = null;
        this.clearSession();
        return Utils.handleSuccess(null, 'Sesión cerrada');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null && this.isSessionValid();
    }

    // Check if user is admin
    isAdmin() {
        return this.isAuthenticated() && this.currentUser.isAdmin === true;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Session management
    saveSession(userData) {
        const sessionData = {
            ...userData,
            expiresAt: Date.now() + this.sessionTimeout
        };
        
        Utils.setLocalStorage(this.sessionKey, sessionData);
    }

    loadSession() {
        const sessionData = Utils.getLocalStorage(this.sessionKey);
        
        if (sessionData && this.isSessionDataValid(sessionData)) {
            this.currentUser = sessionData;
            return true;
        }
        
        this.clearSession();
        return false;
    }

    isSessionValid() {
        if (!this.currentUser) return false;
        return Date.now() < this.currentUser.expiresAt;
    }

    isSessionDataValid(sessionData) {
        return sessionData && 
               sessionData.username && 
               sessionData.expiresAt && 
               Date.now() < sessionData.expiresAt;
    }

    clearSession() {
        Utils.removeLocalStorage(this.sessionKey);
    }

    // Refresh session
    refreshSession() {
        if (this.currentUser) {
            this.currentUser.expiresAt = Date.now() + this.sessionTimeout;
            this.saveSession(this.currentUser);
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword, confirmNewPassword) {
        try {
            if (!this.isAuthenticated()) {
                return Utils.handleError(new Error('No autenticado'), 'Change password');
            }

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                return Utils.handleError(new Error('Todos los campos son requeridos'), 'Change password');
            }

            if (newPassword !== confirmNewPassword) {
                return Utils.handleError(new Error('Las nuevas contraseñas no coinciden'), 'Change password');
            }

            const passwordValidation = Utils.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return Utils.handleError(new Error(passwordValidation.errors[0]), 'Change password');
            }

            // Verify current password
            const users = await this.db.getUsers();
            const user = users[this.currentUser.username];
            
            if (!user) {
                return Utils.handleError(new Error('Usuario no encontrado'), 'Change password');
            }

            const currentHashedPassword = this.hashPassword(currentPassword);
            if (user.password !== currentHashedPassword && user.password !== currentPassword) {
                return Utils.handleError(new Error('Contraseña actual incorrecta'), 'Change password');
            }

            // Update password
            const newHashedPassword = this.hashPassword(newPassword);
            await this.db.updateUser(this.currentUser.username, { 
                ...user, 
                password: newHashedPassword,
                passwordChangedAt: Date.now()
            });

            return Utils.handleSuccess(null, 'Contraseña cambiada exitosamente');
        } catch (error) {
            return Utils.handleError(error, 'Change password');
        }
    }

    // Security helpers
    rateLimit = (() => {
        const attempts = new Map();
        const maxAttempts = 5;
        const lockoutTime = 15 * 60 * 1000; // 15 minutes

        return {
            check: (identifier) => {
                const now = Date.now();
                const record = attempts.get(identifier) || { count: 0, firstAttempt: now, lockedUntil: 0 };

                // Check if still locked
                if (record.lockedUntil > now) {
                    const remainingTime = Math.ceil((record.lockedUntil - now) / 1000 / 60);
                    return { allowed: false, remainingTime };
                }

                // Reset if enough time has passed
                if (now - record.firstAttempt > lockoutTime) {
                    record.count = 0;
                    record.firstAttempt = now;
                }

                return { allowed: record.count < maxAttempts };
            },

            record: (identifier) => {
                const now = Date.now();
                const record = attempts.get(identifier) || { count: 0, firstAttempt: now, lockedUntil: 0 };
                
                record.count++;
                
                if (record.count >= maxAttempts) {
                    record.lockedUntil = now + lockoutTime;
                }

                attempts.set(identifier, record);
            },

            reset: (identifier) => {
                attempts.delete(identifier);
            }
        };
    })();

    // Check rate limiting before login attempt
    async loginWithRateLimit(username, password) {
        const identifier = Utils.sanitizeInput(username) || 'unknown';
        const rateLimitCheck = this.rateLimit.check(identifier);

        if (!rateLimitCheck.allowed) {
            const message = rateLimitCheck.remainingTime 
                ? `Demasiados intentos. Inténtalo de nuevo en ${rateLimitCheck.remainingTime} minutos.`
                : 'Demasiados intentos de inicio de sesión.';
            return Utils.handleError(new Error(message), 'Rate limit');
        }

        const loginResult = await this.login(username, password);

        if (!loginResult.success) {
            this.rateLimit.record(identifier);
        } else {
            this.rateLimit.reset(identifier);
        }

        return loginResult;
    }
}