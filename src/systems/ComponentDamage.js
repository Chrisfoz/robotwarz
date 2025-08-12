/**
 * ComponentDamageSystem - Handles destructible bot parts and component-based damage
 */
export class ComponentDamageSystem {
    constructor() {
        this.components = new Map(); // Bot ID -> Components
        this.debrisParticles = [];
        this.damageEffects = [];
    }

    /**
     * Initialize components for a bot
     */
    initializeBotComponents(botId, botClass) {
        const components = {
            // Core components (critical)
            core: {
                name: 'Power Core',
                health: 100,
                maxHealth: 100,
                critical: true,
                position: { x: 0, y: 0 }, // Relative to bot center
                size: 15,
                armor: 0.5,
                effects: {
                    onDamage: ['sparks', 'smoke'],
                    onDestroy: ['explosion', 'emp']
                }
            },
            
            // Weapon components
            leftWeapon: {
                name: 'Left Weapon',
                health: 50,
                maxHealth: 50,
                critical: false,
                position: { x: -20, y: -10 },
                size: 10,
                armor: 0.2,
                functionality: 'melee',
                damageReduction: 0.5, // Damage reduced when destroyed
                effects: {
                    onDamage: ['sparks'],
                    onDestroy: ['debris', 'smoke']
                }
            },
            rightWeapon: {
                name: 'Right Weapon',
                health: 50,
                maxHealth: 50,
                critical: false,
                position: { x: 20, y: -10 },
                size: 10,
                armor: 0.2,
                functionality: 'ranged',
                damageReduction: 0.5,
                effects: {
                    onDamage: ['sparks'],
                    onDestroy: ['debris', 'smoke']
                }
            },
            
            // Movement components
            leftTread: {
                name: 'Left Tread',
                health: 40,
                maxHealth: 40,
                critical: false,
                position: { x: -15, y: 15 },
                size: 12,
                armor: 0.3,
                functionality: 'movement',
                speedReduction: 0.3, // Speed reduced when destroyed
                effects: {
                    onDamage: ['sparks'],
                    onDestroy: ['debris', 'oil']
                }
            },
            rightTread: {
                name: 'Right Tread',
                health: 40,
                maxHealth: 40,
                critical: false,
                position: { x: 15, y: 15 },
                size: 12,
                armor: 0.3,
                functionality: 'movement',
                speedReduction: 0.3,
                effects: {
                    onDamage: ['sparks'],
                    onDestroy: ['debris', 'oil']
                }
            },
            
            // Armor components
            frontArmor: {
                name: 'Front Armor',
                health: 60,
                maxHealth: 60,
                critical: false,
                position: { x: 0, y: -20 },
                size: 25,
                armor: 0.6,
                functionality: 'defense',
                protects: ['core', 'leftWeapon', 'rightWeapon'],
                effects: {
                    onDamage: ['sparks', 'metalChips'],
                    onDestroy: ['debris', 'largeDebris']
                }
            },
            
            // Sensor component
            sensor: {
                name: 'Sensor Array',
                health: 30,
                maxHealth: 30,
                critical: false,
                position: { x: 0, y: -15 },
                size: 8,
                armor: 0.1,
                functionality: 'targeting',
                accuracyReduction: 0.4, // Accuracy reduced when destroyed
                effects: {
                    onDamage: ['sparks', 'electricArc'],
                    onDestroy: ['explosion', 'glass']
                }
            }
        };

        // Adjust component health based on bot class
        if (botClass === 'TITAN') {
            Object.values(components).forEach(comp => {
                comp.maxHealth *= 1.5;
                comp.health = comp.maxHealth;
                comp.armor += 0.1;
            });
        } else if (botClass === 'VIPER') {
            Object.values(components).forEach(comp => {
                comp.maxHealth *= 0.8;
                comp.health = comp.maxHealth;
            });
        }

        this.components.set(botId, components);
        return components;
    }

    /**
     * Apply damage to a specific component or distribute it
     */
    applyDamage(botId, damage, hitPosition = null, damageType = 'normal') {
        const components = this.components.get(botId);
        if (!components) return { totalDamage: 0, destroyedComponents: [] };

        let targetComponent = null;
        let destroyedComponents = [];

        // Determine which component was hit
        if (hitPosition) {
            targetComponent = this.getComponentAtPosition(components, hitPosition);
        } else {
            // Random component if no specific hit position
            const activeComponents = Object.entries(components)
                .filter(([_, comp]) => comp.health > 0);
            if (activeComponents.length > 0) {
                const [compName, comp] = activeComponents[Math.floor(Math.random() * activeComponents.length)];
                targetComponent = { name: compName, ...comp };
            }
        }

        if (!targetComponent) {
            // Hit the core if no other component
            targetComponent = { name: 'core', ...components.core };
        }

        // Check if protected by armor
        const protector = this.getProtectingComponent(components, targetComponent.name);
        if (protector && protector.health > 0) {
            targetComponent = protector;
        }

        // Apply damage with armor reduction
        const actualDamage = damage * (1 - targetComponent.armor);
        const componentKey = Object.keys(components).find(key => 
            components[key] === targetComponent || components[key].name === targetComponent.name
        );

        if (componentKey && components[componentKey]) {
            const previousHealth = components[componentKey].health;
            components[componentKey].health = Math.max(0, components[componentKey].health - actualDamage);

            // Trigger damage effects
            if (components[componentKey].health < previousHealth) {
                this.triggerDamageEffects(botId, componentKey, components[componentKey]);
            }

            // Check if component was destroyed
            if (previousHealth > 0 && components[componentKey].health <= 0) {
                destroyedComponents.push({
                    name: componentKey,
                    component: components[componentKey]
                });
                this.onComponentDestroyed(botId, componentKey, components[componentKey]);
            }
        }

        // Calculate total damage to bot
        const totalDamage = this.calculateTotalDamage(components, actualDamage, targetComponent.critical);

        return {
            totalDamage,
            destroyedComponents,
            hitComponent: targetComponent.name,
            remainingComponents: this.getActiveComponentCount(components)
        };
    }

    /**
     * Get component at specific position relative to bot
     */
    getComponentAtPosition(components, relativePosition) {
        let closestComponent = null;
        let closestDistance = Infinity;

        for (const [name, comp] of Object.entries(components)) {
            if (comp.health <= 0) continue;

            const distance = Math.sqrt(
                Math.pow(relativePosition.x - comp.position.x, 2) +
                Math.pow(relativePosition.y - comp.position.y, 2)
            );

            if (distance < comp.size && distance < closestDistance) {
                closestDistance = distance;
                closestComponent = { name, ...comp };
            }
        }

        return closestComponent;
    }

    /**
     * Get component protecting another
     */
    getProtectingComponent(components, targetName) {
        for (const [name, comp] of Object.entries(components)) {
            if (comp.protects && comp.protects.includes(targetName) && comp.health > 0) {
                return { name, ...comp };
            }
        }
        return null;
    }

    /**
     * Calculate total damage including critical hits
     */
    calculateTotalDamage(components, baseDamage, isCriticalComponent) {
        let totalDamage = baseDamage;

        // Critical component hit deals extra damage
        if (isCriticalComponent) {
            totalDamage *= 1.5;
        }

        // Bonus damage if multiple components destroyed
        const destroyedCount = Object.values(components)
            .filter(comp => comp.health <= 0).length;
        totalDamage *= (1 + destroyedCount * 0.1);

        return totalDamage;
    }

    /**
     * Handle component destruction
     */
    onComponentDestroyed(botId, componentName, component) {
        // Create debris particles
        this.createDebris(component.position, component.size);

        // Apply functionality loss
        this.applyFunctionalityLoss(botId, component);

        // Trigger destruction effects
        if (component.effects && component.effects.onDestroy) {
            component.effects.onDestroy.forEach(effect => {
                this.createEffect(effect, component.position);
            });
        }
    }

    /**
     * Apply functionality loss when component is destroyed
     */
    applyFunctionalityLoss(botId, component) {
        const losses = {
            movement: { speed: component.speedReduction || 0 },
            melee: { meleeDamage: component.damageReduction || 0 },
            ranged: { rangedDamage: component.damageReduction || 0 },
            targeting: { accuracy: component.accuracyReduction || 0 },
            defense: { armor: 0.2 }
        };

        return losses[component.functionality] || {};
    }

    /**
     * Trigger damage visual effects
     */
    triggerDamageEffects(botId, componentName, component) {
        if (component.effects && component.effects.onDamage) {
            component.effects.onDamage.forEach(effect => {
                this.createEffect(effect, component.position);
            });
        }
    }

    /**
     * Create visual effect
     */
    createEffect(effectType, position) {
        const effect = {
            type: effectType,
            position: { ...position },
            lifetime: 1000,
            created: Date.now()
        };

        this.damageEffects.push(effect);
        return effect;
    }

    /**
     * Create debris particles
     */
    createDebris(position, size) {
        const debrisCount = Math.floor(size / 5);
        
        for (let i = 0; i < debrisCount; i++) {
            this.debrisParticles.push({
                x: position.x + (Math.random() - 0.5) * size,
                y: position.y + (Math.random() - 0.5) * size,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 4 + 2,
                lifetime: 2000,
                created: Date.now(),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    /**
     * Get active component count
     */
    getActiveComponentCount(components) {
        return Object.values(components).filter(comp => comp.health > 0).length;
    }

    /**
     * Get component health percentages for UI
     */
    getComponentHealth(botId) {
        const components = this.components.get(botId);
        if (!components) return null;

        const health = {};
        for (const [name, comp] of Object.entries(components)) {
            health[name] = {
                current: comp.health,
                max: comp.maxHealth,
                percentage: comp.health / comp.maxHealth,
                functional: comp.health > 0
            };
        }

        return health;
    }

    /**
     * Render component damage indicators
     */
    renderComponentDamage(ctx, bot) {
        const components = this.components.get(bot.id);
        if (!components) return;

        ctx.save();
        ctx.translate(bot.x, bot.y);

        for (const [name, comp] of Object.entries(components)) {
            const healthPercent = comp.health / comp.maxHealth;
            
            // Skip fully healthy components
            if (healthPercent >= 1) continue;

            // Draw damage indicator
            ctx.save();
            ctx.translate(comp.position.x, comp.position.y);

            // Damage overlay
            if (healthPercent <= 0) {
                // Destroyed component
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(-comp.size/2, -comp.size/2, comp.size, comp.size);
                
                // X mark
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-comp.size/3, -comp.size/3);
                ctx.lineTo(comp.size/3, comp.size/3);
                ctx.moveTo(comp.size/3, -comp.size/3);
                ctx.lineTo(-comp.size/3, comp.size/3);
                ctx.stroke();
            } else if (healthPercent < 0.5) {
                // Heavily damaged
                ctx.fillStyle = `rgba(255, ${Math.floor(healthPercent * 255)}, 0, 0.3)`;
                ctx.fillRect(-comp.size/2, -comp.size/2, comp.size, comp.size);
                
                // Damage cracks
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(
                        Math.cos(angle) * comp.size/2,
                        Math.sin(angle) * comp.size/2
                    );
                }
                ctx.stroke();
            } else {
                // Lightly damaged
                ctx.fillStyle = `rgba(255, 255, 0, ${0.2 * (1 - healthPercent)})`;
                ctx.fillRect(-comp.size/2, -comp.size/2, comp.size, comp.size);
            }

            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Update debris and effects
     */
    update(deltaTime) {
        const now = Date.now();

        // Update debris particles
        for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
            const debris = this.debrisParticles[i];
            
            // Physics
            debris.x += debris.vx;
            debris.y += debris.vy;
            debris.vy += 0.3; // Gravity
            debris.vx *= 0.98; // Friction
            debris.rotation += debris.rotationSpeed;

            // Remove old debris
            if (now - debris.created > debris.lifetime) {
                this.debrisParticles.splice(i, 1);
            }
        }

        // Update damage effects
        for (let i = this.damageEffects.length - 1; i >= 0; i--) {
            if (now - this.damageEffects[i].created > this.damageEffects[i].lifetime) {
                this.damageEffects.splice(i, 1);
            }
        }
    }

    /**
     * Render debris particles
     */
    renderDebris(ctx) {
        ctx.save();

        for (const debris of this.debrisParticles) {
            ctx.save();
            ctx.translate(debris.x, debris.y);
            ctx.rotate(debris.rotation);

            const alpha = 1 - (Date.now() - debris.created) / debris.lifetime;
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            ctx.fillRect(-debris.size/2, -debris.size/2, debris.size, debris.size);

            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Reset system
     */
    reset() {
        this.components.clear();
        this.debrisParticles = [];
        this.damageEffects = [];
    }

    /**
     * Get system statistics
     */
    getStats() {
        return {
            totalBots: this.components.size,
            totalComponents: Array.from(this.components.values())
                .reduce((sum, comps) => sum + Object.keys(comps).length, 0),
            destroyedComponents: Array.from(this.components.values())
                .reduce((sum, comps) => 
                    sum + Object.values(comps).filter(c => c.health <= 0).length, 0),
            debrisCount: this.debrisParticles.length,
            effectCount: this.damageEffects.length
        };
    }
}

// Export singleton instance
export default new ComponentDamageSystem();