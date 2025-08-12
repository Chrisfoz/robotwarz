/**
 * ScreenShake - Adds dynamic camera shake effects for impacts and explosions
 */
export class ScreenShake {
    constructor() {
        this.shakeIntensity = 0;
        this.shakeDecay = 0.95;
        this.shakeOffset = { x: 0, y: 0 };
        this.trauma = 0;
        this.traumaDecay = 0.95;
        this.maxOffset = 30;
        this.enabled = true;
        
        // Different shake presets
        this.presets = {
            light: { intensity: 5, duration: 200 },
            medium: { intensity: 10, duration: 300 },
            heavy: { intensity: 20, duration: 500 },
            explosion: { intensity: 30, duration: 700 },
            critical: { intensity: 40, duration: 1000 }
        };
    }

    /**
     * Add trauma (0-1) which creates shake
     */
    addTrauma(amount) {
        if (!this.enabled) return;
        this.trauma = Math.min(1, this.trauma + amount);
    }

    /**
     * Trigger shake with preset
     */
    shake(preset = 'medium') {
        if (!this.enabled) return;
        
        const config = this.presets[preset] || this.presets.medium;
        this.shakeIntensity = config.intensity;
        
        // Add trauma based on intensity
        this.addTrauma(config.intensity / 40);
    }

    /**
     * Trigger shake based on damage amount
     */
    shakeFromDamage(damage) {
        if (!this.enabled) return;
        
        if (damage < 10) {
            this.shake('light');
        } else if (damage < 25) {
            this.shake('medium');
        } else if (damage < 50) {
            this.shake('heavy');
        } else {
            this.shake('explosion');
        }
    }

    /**
     * Trigger shake from explosion
     */
    shakeFromExplosion(distance, maxDistance) {
        if (!this.enabled) return;
        
        const intensity = 1 - (distance / maxDistance);
        this.addTrauma(intensity * 0.8);
    }

    /**
     * Update shake effect
     */
    update(deltaTime) {
        if (!this.enabled) return;
        
        // Decay trauma over time
        this.trauma = Math.max(0, this.trauma - 0.01);
        
        // Calculate shake based on trauma
        if (this.trauma > 0) {
            const shake = this.trauma * this.trauma;
            
            // Generate random offset
            this.shakeOffset.x = (Math.random() * 2 - 1) * this.maxOffset * shake;
            this.shakeOffset.y = (Math.random() * 2 - 1) * this.maxOffset * shake;
            
            // Add rotation for more impact
            this.rotation = (Math.random() * 2 - 1) * 0.05 * shake;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
            this.rotation = 0;
        }
        
        // Legacy intensity-based shake (for backward compatibility)
        if (this.shakeIntensity > 0.1) {
            this.shakeIntensity *= this.shakeDecay;
            
            this.shakeOffset.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeOffset.y += (Math.random() - 0.5) * this.shakeIntensity;
        }
    }

    /**
     * Apply shake to canvas context
     */
    apply(ctx) {
        if (!this.enabled || (this.trauma <= 0 && this.shakeIntensity <= 0.1)) {
            return;
        }
        
        ctx.save();
        ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
        
        if (this.rotation) {
            ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
            ctx.rotate(this.rotation);
            ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
        }
    }

    /**
     * Restore canvas context after shake
     */
    restore(ctx) {
        if (!this.enabled || (this.trauma <= 0 && this.shakeIntensity <= 0.1)) {
            return;
        }
        
        ctx.restore();
    }

    /**
     * Get current shake offset
     */
    getOffset() {
        return { ...this.shakeOffset };
    }

    /**
     * Reset shake
     */
    reset() {
        this.shakeIntensity = 0;
        this.trauma = 0;
        this.shakeOffset = { x: 0, y: 0 };
        this.rotation = 0;
    }

    /**
     * Toggle shake on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.reset();
        }
        return this.enabled;
    }

    /**
     * Check if currently shaking
     */
    isShaking() {
        return this.trauma > 0 || this.shakeIntensity > 0.1;
    }
}

// Export singleton
export default new ScreenShake();