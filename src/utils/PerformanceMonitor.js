/**
 * PerformanceMonitor - Advanced performance profiling for the game
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            physicsTime: 0,
            collisionTime: 0,
            particleCount: 0,
            entityCount: 0,
            projectileCount: 0,
            memoryUsage: 0
        };
        
        this.samples = {
            fps: [],
            frameTime: [],
            updateTime: [],
            renderTime: []
        };
        
        this.maxSamples = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.lastFrameTime = 0;
        
        this.timers = new Map();
        this.enabled = true;
    }

    startTimer(name) {
        if (!this.enabled) return;
        this.timers.set(name, performance.now());
    }

    endTimer(name) {
        if (!this.enabled) return;
        const startTime = this.timers.get(name);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.metrics[name + 'Time'] = duration;
            this.timers.delete(name);
            return duration;
        }
        return 0;
    }

    beginFrame() {
        if (!this.enabled) return;
        this.lastFrameTime = performance.now();
        this.startTimer('frame');
    }

    endFrame() {
        if (!this.enabled) return;
        const frameTime = this.endTimer('frame');
        
        // Update FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.metrics.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            // Update memory usage if available
            if (performance.memory) {
                this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
            }
        }
        
        // Store samples
        this.addSample('frameTime', frameTime);
        this.addSample('fps', this.metrics.fps);
    }

    addSample(metric, value) {
        if (!this.samples[metric]) {
            this.samples[metric] = [];
        }
        
        this.samples[metric].push(value);
        if (this.samples[metric].length > this.maxSamples) {
            this.samples[metric].shift();
        }
    }

    getAverage(metric) {
        const samples = this.samples[metric];
        if (!samples || samples.length === 0) return 0;
        
        const sum = samples.reduce((a, b) => a + b, 0);
        return sum / samples.length;
    }

    updateCounts(entities, particles, projectiles) {
        this.metrics.entityCount = entities;
        this.metrics.particleCount = particles;
        this.metrics.projectileCount = projectiles;
    }

    getMetrics() {
        return {
            ...this.metrics,
            avgFPS: this.getAverage('fps'),
            avgFrameTime: this.getAverage('frameTime'),
            avgUpdateTime: this.getAverage('updateTime'),
            avgRenderTime: this.getAverage('renderTime')
        };
    }

    render(ctx, x = 10, y = 20) {
        if (!this.enabled) return;
        
        const metrics = this.getMetrics();
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 5, y - 15, 250, 200);
        
        // Title
        ctx.fillStyle = '#56CCF2';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('Performance Monitor', x, y);
        
        // Metrics
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        let lineY = y + 20;
        const lineHeight = 15;
        
        // FPS with color coding
        ctx.fillStyle = metrics.fps >= 55 ? '#68d391' : 
                       metrics.fps >= 30 ? '#f6ad55' : '#fc8181';
        ctx.fillText(`FPS: ${metrics.fps} (avg: ${metrics.avgFPS.toFixed(1)})`, x, lineY);
        lineY += lineHeight;
        
        // Frame time
        ctx.fillStyle = 'white';
        ctx.fillText(`Frame: ${metrics.frameTime.toFixed(2)}ms`, x, lineY);
        lineY += lineHeight;
        
        // Component times
        ctx.fillText(`Update: ${metrics.updateTime.toFixed(2)}ms`, x, lineY);
        lineY += lineHeight;
        ctx.fillText(`Render: ${metrics.renderTime.toFixed(2)}ms`, x, lineY);
        lineY += lineHeight;
        ctx.fillText(`Physics: ${metrics.physicsTime.toFixed(2)}ms`, x, lineY);
        lineY += lineHeight;
        ctx.fillText(`Collision: ${metrics.collisionTime.toFixed(2)}ms`, x, lineY);
        lineY += lineHeight;
        
        // Entity counts
        ctx.fillStyle = '#9f7aea';
        lineY += 5;
        ctx.fillText(`Entities: ${metrics.entityCount}`, x, lineY);
        lineY += lineHeight;
        ctx.fillText(`Particles: ${metrics.particleCount}`, x, lineY);
        lineY += lineHeight;
        ctx.fillText(`Projectiles: ${metrics.projectileCount}`, x, lineY);
        lineY += lineHeight;
        
        // Memory
        if (metrics.memoryUsage > 0) {
            ctx.fillStyle = '#63b3ed';
            ctx.fillText(`Memory: ${metrics.memoryUsage}MB`, x, lineY);
        }
        
        // Draw FPS graph
        this.renderGraph(ctx, x + 260, y, 'fps', 60, 'FPS');
    }

    renderGraph(ctx, x, y, metric, maxValue, label) {
        const samples = this.samples[metric];
        if (!samples || samples.length < 2) return;
        
        const width = 150;
        const height = 60;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);
        
        // Label
        ctx.fillStyle = '#56CCF2';
        ctx.font = '10px monospace';
        ctx.fillText(label, x + 5, y + 10);
        
        // Draw graph
        ctx.strokeStyle = '#68d391';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const stepX = width / this.maxSamples;
        for (let i = 0; i < samples.length; i++) {
            const sampleX = x + i * stepX;
            const sampleY = y + height - (samples[i] / maxValue) * height;
            
            if (i === 0) {
                ctx.moveTo(sampleX, sampleY);
            } else {
                ctx.lineTo(sampleX, sampleY);
            }
        }
        
        ctx.stroke();
        
        // Target line (60 FPS)
        if (metric === 'fps') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            const targetY = y + height - (60 / maxValue) * height;
            ctx.moveTo(x, targetY);
            ctx.lineTo(x + width, targetY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    generateReport() {
        const metrics = this.getMetrics();
        const report = {
            timestamp: new Date().toISOString(),
            performance: {
                avgFPS: metrics.avgFPS,
                minFPS: Math.min(...this.samples.fps),
                maxFPS: Math.max(...this.samples.fps),
                avgFrameTime: metrics.avgFrameTime,
                maxFrameTime: Math.max(...this.samples.frameTime)
            },
            bottlenecks: []
        };
        
        // Identify bottlenecks
        if (metrics.avgFPS < 30) {
            report.bottlenecks.push('Critical: FPS below 30');
        } else if (metrics.avgFPS < 55) {
            report.bottlenecks.push('Warning: FPS below target 60');
        }
        
        if (metrics.updateTime > 8) {
            report.bottlenecks.push('Update loop taking too long');
        }
        
        if (metrics.renderTime > 8) {
            report.bottlenecks.push('Render loop taking too long');
        }
        
        if (metrics.particleCount > 1000) {
            report.bottlenecks.push('Too many particles');
        }
        
        if (metrics.memoryUsage > 100) {
            report.bottlenecks.push('High memory usage');
        }
        
        return report;
    }

    reset() {
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.samples = {
            fps: [],
            frameTime: [],
            updateTime: [],
            renderTime: []
        };
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Singleton instance
export default new PerformanceMonitor();