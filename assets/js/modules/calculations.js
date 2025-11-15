// Calculations Module
import { Utils } from './utils.js';
import { config } from './config.js';

export class Calculations {
    constructor() {
        this.circuitsData = config.getCircuitsData();
        this.boostLevels = config.appConfig.boostLevels;
    }

    // Enhanced tyre wear calculation with detailed breakdown
    calculateTyreWear(circuit, compound, laps, tyrePoints) {
        try {
            const c = this.circuitsData[circuit];
            if (!c) {
                return {
                    error: 'Circuito no encontrado',
                    baseWear: 0,
                    remaining: 100
                };
            }

            // Validate inputs
            if (laps <= 0 || tyrePoints <= 0) {
                return {
                    error: 'Valores inválidos',
                    baseWear: 0,
                    remaining: 100
                };
            }

            const Te = Math.max(1, tyrePoints);  // Prevent division by zero
            const Tw = c.tyreWear;               // Circuit tyre wear (%)
            const D = c.length;                  // Circuit length (km)
            const D0 = 50;                       // Calibration constant
            const N = Math.max(1, laps);         // Number of laps

            // Base wear calculation (Medium compound)
            const step1 = Te / 1.5;
            const step2 = Math.pow(step1, -0.0778);
            const step3 = 1.43 * step2;
            const step4 = 0.00364 * Tw + 0.354;
            const step5 = step3 * step4;
            const step6 = D * 1.384612;
            const step7 = step5 * step6;
            const step8 = step7 * (200 - D0);
            const W_M = (step8 / 10000) * 100; // Base wear M

            // Compound multipliers (adjusted for better balance)
            const compoundMultipliers = {
                'SS': 2.06,    // Supersoft
                'S': 0.642,    // Soft
                'M': 1.00,     // Medium (base)
                'H': 0.375     // Hard
            };

            const multiplier = compoundMultipliers[compound.toUpperCase()] || 1.0;
            const Wc = W_M * multiplier;

            // Total wear calculation with exponential decay
            const remaining = 100 * Math.exp(-1.18 * (Wc / 100) * N);
            const totalWear = 100 - remaining;

            // Performance impact calculation
            const performanceImpact = this.calculatePerformanceImpact(remaining);

            // Recommended pit window
            const recommendedPitWindow = this.calculatePitWindow(remaining, totalWear);

            return {
                success: true,
                baseWear: Utils.formatNumber(W_M, 3),
                baseWearWithCompound: Utils.formatNumber(Wc, 3),
                remaining: Utils.formatNumber(remaining, 2),
                totalWear: Utils.formatNumber(totalWear, 2),
                compound: compound.toUpperCase(),
                compoundMultiplier: multiplier,
                performanceImpact,
                recommendedPitWindow,
                lapsCompleted: N,
                circuitInfo: {
                    name: c.name,
                    tyreWear: Tw,
                    length: D,
                    difficulty: c.difficulty
                }
            };
        } catch (error) {
            return Utils.handleError(error, 'Tyre wear calculation');
        }
    }

    // Calculate performance impact based on tyre condition
    calculatePerformanceImpact(remaining) {
        let status, color, impact;
        
        if (remaining >= 80) {
            status = 'Excelente';
            color = 'green';
            impact = '0%';
        } else if (remaining >= 60) {
            status = 'Buena';
            color = 'lime';
            impact = '-0.5%';
        } else if (remaining >= 40) {
            status = 'Aceptable';
            color = 'yellow';
            impact = '-1.2%';
        } else if (remaining >= 20) {
            status = 'Degradada';
            color = 'orange';
            impact = '-2.5%';
        } else {
            status = 'Crítica';
            color = 'red';
            impact = '-4.0%';
        }

        return { status, color, impact };
    }

    // Calculate recommended pit window
    calculatePitWindow(remaining, totalWear) {
        if (remaining > 70) {
            return { recommendation: 'Continúa', urgency: 'low' };
        } else if (remaining > 40) {
            return { recommendation: 'Considera parar pronto', urgency: 'medium' };
        } else if (remaining > 20) {
            return { recommendation: 'Para en las próximas vueltas', urgency: 'high' };
        } else {
            return { recommendation: '¡PARA INMEDIATAMENTE!', urgency: 'critical' };
        }
    }

    // Enhanced fuel calculation
    calculateFuel(circuit, fuelPoints) {
        try {
            const c = this.circuitsData[circuit];
            if (!c) {
                return Utils.handleError(new Error('Circuito no encontrado'), 'Fuel calculation');
            }

            if (fuelPoints <= 0) {
                return Utils.handleError(new Error('Puntos de combustible inválidos'), 'Fuel calculation');
            }

            const totalDistance = c.length * c.laps;
            const fuel = 98.45644 * Math.pow(Math.max(1, fuelPoints), -0.088463) * totalDistance / 139.771;
            
            // Calculate fuel per lap
            const fuelPerLap = fuel / c.laps;
            
            // Fuel efficiency rating
            const efficiency = this.calculateFuelEfficiency(fuelPerLap, c.length);

            return Utils.handleSuccess({
                totalFuel: Utils.formatNumber(fuel, 2),
                fuelPerLap: Utils.formatNumber(fuelPerLap, 3),
                totalDistance: Utils.formatNumber(totalDistance, 2),
                efficiency,
                circuitInfo: {
                    name: c.name,
                    laps: c.laps,
                    length: c.length
                }
            });
        } catch (error) {
            return Utils.handleError(error, 'Fuel calculation');
        }
    }

    // Calculate fuel efficiency rating
    calculateFuelEfficiency(fuelPerLap, circuitLength) {
        const fuelPerKm = fuelPerLap / circuitLength;
        
        let rating, color;
        if (fuelPerKm < 0.5) {
            rating = 'Excelente';
            color = 'green';
        } else if (fuelPerKm < 0.7) {
            rating = 'Buena';
            color = 'lime';
        } else if (fuelPerKm < 1.0) {
            rating = 'Media';
            color = 'yellow';
        } else if (fuelPerKm < 1.3) {
            rating = 'Pobre';
            color = 'orange';
        } else {
            rating = 'Muy Pobre';
            color = 'red';
        }

        return {
            rating,
            color,
            fuelPerKm: Utils.formatNumber(fuelPerKm, 3)
        };
    }

    // Enhanced stint fuel calculation
    calculateStintFuel(circuit, fuelPoints, laps, boost) {
        try {
            const c = this.circuitsData[circuit];
            if (!c) {
                return Utils.handleError(new Error('Circuito no encontrado'), 'Stint fuel calculation');
            }

            if (fuelPoints <= 0 || laps <= 0) {
                return Utils.handleError(new Error('Valores inválidos'), 'Stint fuel calculation');
            }

            const fuelPerLap = (98.45644 * Math.pow(Math.max(1, fuelPoints), -0.088463) * c.length) / 139.771;
            let stintFuel = fuelPerLap * laps;
            
            // Apply boost multiplier
            const boostInfo = this.boostLevels[boost] || this.boostLevels['neutral'];
            stintFuel *= boostInfo.multiplier;

            // Calculate additional info
            const fuelSaving = ((1 - boostInfo.multiplier) * fuelPerLap * laps);
            const timeImpact = this.calculateBoostTimeImpact(boost, laps);

            return Utils.handleSuccess({
                stintFuel: Utils.formatNumber(stintFuel, 2),
                fuelPerLap: Utils.formatNumber(fuelPerLap * boostInfo.multiplier, 3),
                baseFuelPerLap: Utils.formatNumber(fuelPerLap, 3),
                boostInfo: {
                    level: boost,
                    multiplier: boostInfo.multiplier,
                    label: boostInfo.label
                },
                fuelSaving: Utils.formatNumber(Math.abs(fuelSaving), 2),
                timeImpact,
                laps
            });
        } catch (error) {
            return Utils.handleError(error, 'Stint fuel calculation');
        }
    }

    // Calculate time impact of boost levels
    calculateBoostTimeImpact(boost, laps) {
        const timeImpacts = {
            'muy-alto': -0.8,   // Faster lap times
            'alto': -0.3,
            'neutral': 0,
            'bajo': 0.4,        // Slower lap times but fuel savings
            'muy-bajo': 0.9
        };

        const impactPerLap = timeImpacts[boost] || 0;
        const totalImpact = impactPerLap * laps;

        return {
            perLap: Utils.formatNumber(impactPerLap, 1),
            total: Utils.formatNumber(totalImpact, 1),
            direction: impactPerLap < 0 ? 'faster' : impactPerLap > 0 ? 'slower' : 'neutral'
        };
    }

    // Strategy optimization
    optimizeStrategy(circuit, totalLaps, tyrePoints, fuelPoints, constraints = {}) {
        try {
            const c = this.circuitsData[circuit];
            if (!c) {
                return Utils.handleError(new Error('Circuito no encontrado'), 'Strategy optimization');
            }

            const {
                maxStints = 3,
                preferredCompounds = ['M', 'S'],
                minStintLength = 5,
                maxStintLength = Math.floor(totalLaps * 0.7)
            } = constraints;

            // Generate possible strategies
            const strategies = this.generateStrategies(
                circuit, totalLaps, tyrePoints, fuelPoints,
                maxStints, preferredCompounds, minStintLength, maxStintLength
            );

            // Evaluate and rank strategies
            const evaluatedStrategies = strategies
                .map(strategy => ({
                    ...strategy,
                    score: this.evaluateStrategy(strategy, c)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5); // Top 5 strategies

            return Utils.handleSuccess({
                recommended: evaluatedStrategies[0],
                alternatives: evaluatedStrategies.slice(1),
                circuitInfo: {
                    name: c.name,
                    totalLaps,
                    difficulty: c.difficulty
                }
            });
        } catch (error) {
            return Utils.handleError(error, 'Strategy optimization');
        }
    }

    // Generate possible strategies
    generateStrategies(circuit, totalLaps, tyrePoints, fuelPoints, maxStints, compounds, minLength, maxLength) {
        const strategies = [];
        
        // Simple strategy generation (can be enhanced with more sophisticated algorithms)
        for (let numStints = 1; numStints <= maxStints; numStints++) {
            const avgStintLength = Math.floor(totalLaps / numStints);
            
            if (avgStintLength >= minLength && avgStintLength <= maxLength) {
                for (const compound of compounds) {
                    const strategy = this.createBalancedStrategy(
                        circuit, totalLaps, numStints, compound, tyrePoints, fuelPoints
                    );
                    
                    if (strategy && this.validateStrategy(strategy, totalLaps)) {
                        strategies.push(strategy);
                    }
                }
            }
        }

        return strategies;
    }

    // Create a balanced strategy
    createBalancedStrategy(circuit, totalLaps, numStints, primaryCompound, tyrePoints, fuelPoints) {
        const stints = [];
        let remainingLaps = totalLaps;
        
        for (let i = 0; i < numStints; i++) {
            const isLastStint = i === numStints - 1;
            const stintLaps = isLastStint ? remainingLaps : Math.floor(remainingLaps / (numStints - i));
            
            // Vary compounds for multi-stint strategies
            let compound = primaryCompound;
            if (numStints > 1) {
                if (i === 0) compound = 'S'; // Start with softer compound
                else if (i === numStints - 1) compound = 'H'; // End with harder compound
                else compound = primaryCompound;
            }

            stints.push({
                stint: i + 1,
                compound,
                laps: stintLaps,
                boost: 'neutral'
            });

            remainingLaps -= stintLaps;
        }

        return {
            stints,
            totalFuel: this.calculateTotalStrategyFuel(circuit, stints, fuelPoints),
            description: this.generateStrategyDescription(stints)
        };
    }

    // Validate strategy
    validateStrategy(strategy, totalLaps) {
        const totalStintLaps = strategy.stints.reduce((sum, stint) => sum + stint.laps, 0);
        return totalStintLaps === totalLaps && strategy.stints.every(stint => stint.laps > 0);
    }

    // Evaluate strategy score
    evaluateStrategy(strategy, circuitInfo) {
        let score = 100; // Base score

        // Penalize for too many stints (more pit stops)
        score -= (strategy.stints.length - 1) * 15;

        // Evaluate each stint
        strategy.stints.forEach(stint => {
            const tyreWear = this.calculateTyreWear(
                circuitInfo.name, stint.compound, stint.laps, 100
            );

            // Penalize if tyres are too degraded
            if (tyreWear.remaining < 20) score -= 30;
            else if (tyreWear.remaining < 40) score -= 15;
            else if (tyreWear.remaining > 80) score -= 5; // Slight penalty for not using tyres enough

            // Bonus for balanced stint lengths
            if (stint.laps >= 8 && stint.laps <= 25) score += 5;
        });

        return Math.max(0, score);
    }

    // Calculate total fuel for strategy
    calculateTotalStrategyFuel(circuit, stints, fuelPoints) {
        return stints.reduce((total, stint) => {
            const stintFuel = this.calculateStintFuel(circuit, fuelPoints, stint.laps, stint.boost);
            return total + (stintFuel.success ? parseFloat(stintFuel.data.stintFuel) : 0);
        }, 0);
    }

    // Generate strategy description
    generateStrategyDescription(stints) {
        if (stints.length === 1) {
            return 'Estrategia sin paradas';
        }
        
        const compounds = stints.map(s => s.compound).join(' → ');
        const laps = stints.map(s => `${s.laps}L`).join(' + ');
        
        return `${stints.length} paradas: ${compounds} (${laps})`;
    }

    // Weather impact calculations (future feature)
    calculateWeatherImpact(baseCalculation, weatherConditions) {
        // Placeholder for weather impact calculations
        const { temperature, humidity, rainfall } = weatherConditions;
        
        let tempMultiplier = 1;
        if (temperature > 35) tempMultiplier = 1.15; // Higher tyre wear in hot conditions
        else if (temperature < 15) tempMultiplier = 0.9; // Less tyre wear in cold
        
        let rainMultiplier = 1;
        if (rainfall > 0) rainMultiplier = 0.7; // Less tyre wear in wet conditions
        
        return {
            ...baseCalculation,
            weatherAdjusted: true,
            adjustedRemaining: baseCalculation.remaining * tempMultiplier * rainMultiplier,
            weatherFactors: {
                temperature: tempMultiplier,
                rain: rainMultiplier
            }
        };
    }

    // Comparative analysis
    compareStrategies(strategies, circuit) {
        return strategies.map(strategy => {
            const analysis = this.analyzeStrategy(strategy, circuit);
            return {
                ...strategy,
                analysis,
                pros: this.getStrategyPros(analysis),
                cons: this.getStrategyCons(analysis)
            };
        });
    }

    analyzeStrategy(strategy, circuit) {
        let totalTime = 0;
        let totalFuel = 0;
        let riskLevel = 0;

        strategy.stints.forEach((stint, index) => {
            const tyreCalc = this.calculateTyreWear(circuit, stint.compound, stint.laps, 100);
            const fuelCalc = this.calculateStintFuel(circuit, 100, stint.laps, stint.boost);

            totalTime += stint.laps * 90; // Assume 90s base lap time
            totalFuel += fuelCalc.success ? parseFloat(fuelCalc.data.stintFuel) : 0;

            // Add pit stop time (except for last stint)
            if (index < strategy.stints.length - 1) {
                totalTime += 25; // 25 seconds pit stop
            }

            // Risk assessment
            if (tyreCalc.remaining < 30) riskLevel += 2;
            else if (tyreCalc.remaining < 50) riskLevel += 1;
        });

        return {
            estimatedTime: totalTime,
            totalFuel: Utils.formatNumber(totalFuel, 2),
            riskLevel,
            pitStops: strategy.stints.length - 1
        };
    }

    getStrategyPros(analysis) {
        const pros = [];
        
        if (analysis.pitStops === 0) pros.push('Sin tiempo perdido en boxes');
        if (analysis.pitStops === 1) pros.push('Una sola parada - estrategia simple');
        if (analysis.riskLevel === 0) pros.push('Estrategia muy segura');
        if (analysis.riskLevel <= 1) pros.push('Riesgo bajo');
        
        return pros;
    }

    getStrategyCons(analysis) {
        const cons = [];
        
        if (analysis.pitStops >= 3) cons.push('Múltiples paradas - tiempo perdido');
        if (analysis.riskLevel >= 3) cons.push('Alto riesgo de degradación');
        if (analysis.riskLevel >= 5) cons.push('Estrategia muy arriesgada');
        
        return cons;
    }
}