// Configuration Module
export class Config {
    constructor() {
        this.firebaseConfig = this.loadFirebaseConfig();
        this.appConfig = this.loadAppConfig();
    }

    loadFirebaseConfig() {
        // In a real application, these would come from environment variables
        // For demo purposes, using fallback values
        return {
            apiKey: this.getEnvVar('FIREBASE_API_KEY', 'AIzaSyAe5Y-o2Or6R64j8enporHv-I2r9GfhZx4'),
            authDomain: this.getEnvVar('FIREBASE_AUTH_DOMAIN', 'ferrari-driver-academy.firebaseapp.com'),
            databaseURL: this.getEnvVar('FIREBASE_DATABASE_URL', 'https://ferrari-driver-academy-default-rtdb.europe-west1.firebasedatabase.app'),
            projectId: this.getEnvVar('FIREBASE_PROJECT_ID', 'ferrari-driver-academy'),
            storageBucket: this.getEnvVar('FIREBASE_STORAGE_BUCKET', 'ferrari-driver-academy.firebasestorage.app'),
            messagingSenderId: this.getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '203935747771'),
            appId: this.getEnvVar('FIREBASE_APP_ID', '1:203935747771:web:6e183fe4448152116e639e')
        };
    }

    loadAppConfig() {
        return {
            name: this.getEnvVar('APP_NAME', 'Ferrari Racing Game'),
            version: this.getEnvVar('APP_VERSION', '2.0.0'),
            maxChatMessages: 100,
            maxStints: 5,
            minPasswordLength: 6,
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
            categories: ['F1', 'F2', 'F3', 'F4', 'F5', 'K6'],
            boostLevels: {
                'muy-alto': { multiplier: 1.04, label: 'Muy Alto (+4%)' },
                'alto': { multiplier: 1.0161, label: 'Alto (+1.61%)' },
                'neutral': { multiplier: 1, label: 'Neutral' },
                'bajo': { multiplier: 0.988, label: 'Bajo (-1.2%)' },
                'muy-bajo': { multiplier: 0.9799, label: 'Muy Bajo (-2.01%)' }
            }
        };
    }

    getEnvVar(name, fallback = null) {
        // In a real environment, this would read from process.env or similar
        // For client-side, we'd need a build-time replacement
        return fallback;
    }

    // Circuit data with enhanced information
    getCircuitsData() {
        return {
            'ABU': { 
                name: 'Abu Dhabi', 
                length: 5.410, 
                laps: 25, 
                tyreWear: 50,
                country: 'AE',
                timezone: 'Asia/Dubai',
                difficulty: 'Medium'
            },
            'AUS': { 
                name: 'Australia', 
                length: 5.301, 
                laps: 28, 
                tyreWear: 40,
                country: 'AU',
                timezone: 'Australia/Melbourne',
                difficulty: 'Hard'
            },
            'AUT': { 
                name: 'Austria', 
                length: 4.044, 
                laps: 34, 
                tyreWear: 60,
                country: 'AT',
                timezone: 'Europe/Vienna',
                difficulty: 'Medium'
            },
            'AZE': { 
                name: 'Azerbaijan', 
                length: 6.049, 
                laps: 23, 
                tyreWear: 45,
                country: 'AZ',
                timezone: 'Asia/Baku',
                difficulty: 'Hard'
            },
            'BAH': { 
                name: 'Bahrain', 
                length: 4.726, 
                laps: 29, 
                tyreWear: 60,
                country: 'BH',
                timezone: 'Asia/Bahrain',
                difficulty: 'Medium'
            },
            'BEL': { 
                name: 'Belgium', 
                length: 7.041, 
                laps: 21, 
                tyreWear: 60,
                country: 'BE',
                timezone: 'Europe/Brussels',
                difficulty: 'Hard'
            },
            'BRA': { 
                name: 'Brazil', 
                length: 3.971, 
                laps: 34, 
                tyreWear: 60,
                country: 'BR',
                timezone: 'America/Sao_Paulo',
                difficulty: 'Medium'
            },
            'CAN': { 
                name: 'Canada', 
                length: 4.341, 
                laps: 31, 
                tyreWear: 45,
                country: 'CA',
                timezone: 'America/Montreal',
                difficulty: 'Medium'
            },
            'CHN': { 
                name: 'China', 
                length: 5.442, 
                laps: 27, 
                tyreWear: 80,
                country: 'CN',
                timezone: 'Asia/Shanghai',
                difficulty: 'Hard'
            },
            'EUR': { 
                name: 'Europe', 
                length: 5.590, 
                laps: 25, 
                tyreWear: 45,
                country: 'DE',
                timezone: 'Europe/Berlin',
                difficulty: 'Medium'
            },
            'FRA': { 
                name: 'France', 
                length: 5.881, 
                laps: 24, 
                tyreWear: 80,
                country: 'FR',
                timezone: 'Europe/Paris',
                difficulty: 'Hard'
            },
            'GBR': { 
                name: 'Great Britain', 
                length: 5.751, 
                laps: 24, 
                tyreWear: 65,
                country: 'GB',
                timezone: 'Europe/London',
                difficulty: 'Hard'
            },
            'GER': { 
                name: 'Germany', 
                length: 4.179, 
                laps: 33, 
                tyreWear: 50,
                country: 'DE',
                timezone: 'Europe/Berlin',
                difficulty: 'Medium'
            },
            'HUN': { 
                name: 'Hungary', 
                length: 3.498, 
                laps: 39, 
                tyreWear: 30,
                country: 'HU',
                timezone: 'Europe/Budapest',
                difficulty: 'Easy'
            },
            'ITA': { 
                name: 'Italy', 
                length: 5.401, 
                laps: 25, 
                tyreWear: 35,
                country: 'IT',
                timezone: 'Europe/Rome',
                difficulty: 'Medium'
            },
            'JAP': { 
                name: 'Japan', 
                length: 5.058, 
                laps: 27, 
                tyreWear: 70,
                country: 'JP',
                timezone: 'Asia/Tokyo',
                difficulty: 'Hard'
            },
            'MAL': { 
                name: 'Malaysia', 
                length: 5.536, 
                laps: 27, 
                tyreWear: 85,
                country: 'MY',
                timezone: 'Asia/Kuala_Lumpur',
                difficulty: 'Hard'
            },
            'MEX': { 
                name: 'Mexico', 
                length: 4.308, 
                laps: 35, 
                tyreWear: 60,
                country: 'MX',
                timezone: 'America/Mexico_City',
                difficulty: 'Medium'
            },
            'MON': { 
                name: 'Monaco', 
                length: 4.015, 
                laps: 29, 
                tyreWear: 20,
                country: 'MC',
                timezone: 'Europe/Monaco',
                difficulty: 'Very Hard'
            },
            'RUS': { 
                name: 'Russia', 
                length: 6.077, 
                laps: 23, 
                tyreWear: 50,
                country: 'RU',
                timezone: 'Europe/Moscow',
                difficulty: 'Medium'
            },
            'SIN': { 
                name: 'Singapore', 
                length: 5.049, 
                laps: 30, 
                tyreWear: 45,
                country: 'SG',
                timezone: 'Asia/Singapore',
                difficulty: 'Hard'
            },
            'SPA': { 
                name: 'Spain', 
                length: 4.457, 
                laps: 31, 
                tyreWear: 85,
                country: 'ES',
                timezone: 'Europe/Madrid',
                difficulty: 'Hard'
            },
            'TUR': { 
                name: 'Turkey', 
                length: 5.162, 
                laps: 27, 
                tyreWear: 90,
                country: 'TR',
                timezone: 'Europe/Istanbul',
                difficulty: 'Very Hard'
            },
            'USA': { 
                name: 'USA', 
                length: 4.602, 
                laps: 30, 
                tyreWear: 65,
                country: 'US',
                timezone: 'America/New_York',
                difficulty: 'Medium'
            }
        };
    }

    // Default custom stats
    getDefaultCustomStats() {
        return [
            { id: 1, name: 'Poles', icon: '⚡' },
            { id: 2, name: 'V. Rápidas', icon: '🏁' }
        ];
    }
}

// Export singleton instance
export const config = new Config();