/**
 * Loading Screen with Logo Integration
 */
export class LoadingScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Loading state
        this.progress = 0;
        this.message = 'Initializing...';
        this.isComplete = false;
        
        // Logo images
        this.logo = null;
        this.carnage = null;
        this.imagesLoaded = false;
        
        // Animation
        this.animationTime = 0;
        this.particles = [];
        
        // Initialize
        this.loadImages();
        this.createParticles();
    }
    
    loadImages() {
        // Load main logo
        this.logo = new Image();
        this.logo.onload = () => {
            console.log('✅ Battle Bot logo loaded');
            this.checkImagesLoaded();
        };
        this.logo.onerror = () => {
            console.warn('⚠️ Failed to load battle bot logo');
            this.checkImagesLoaded();
        };
        this.logo.src = 'battle bot logo.png';
        
        // Load carnage image
        this.carnage = new Image();
        this.carnage.onload = () => {
            console.log('✅ Carnage image loaded');
            this.checkImagesLoaded();
        };
        this.carnage.onerror = () => {
            console.warn('⚠️ Failed to load carnage image');
            this.checkImagesLoaded();
        };
        this.carnage.src = 'Carnage.png';
    }
    
    checkImagesLoaded() {
        this.imagesLoaded = true;
    }
    
    createParticles() {
        // Create background particles for visual effect
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    setProgress(progress, message) {
        this.progress = Math.min(100, Math.max(0, progress));
        if (message) this.message = message;
        
        if (this.progress >= 100) {
            this.isComplete = true;
        }
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.width;
            if (particle.x > this.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.height;
            if (particle.y > this.height) particle.y = 0;
        });
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear screen with dark background
        ctx.fillStyle = '#0f1419';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw particles
        ctx.save();
        this.particles.forEach(particle => {
            ctx.fillStyle = `rgba(86, 204, 242, ${particle.opacity})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        // Draw logo if loaded
        if (this.imagesLoaded && this.logo.complete && this.logo.naturalWidth > 0) {
            const logoScale = 0.5;
            const logoWidth = this.logo.naturalWidth * logoScale;
            const logoHeight = this.logo.naturalHeight * logoScale;
            const logoX = (this.width - logoWidth) / 2;
            const logoY = 100;
            
            // Add glow effect
            ctx.save();
            ctx.shadowColor = '#56CCF2';
            ctx.shadowBlur = 20 + Math.sin(this.animationTime * 0.003) * 10;
            ctx.globalAlpha = 0.9 + Math.sin(this.animationTime * 0.003) * 0.1;
            ctx.drawImage(this.logo, logoX, logoY, logoWidth, logoHeight);
            ctx.restore();
        } else {
            // Fallback text logo
            ctx.save();
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = '#56CCF2';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#56CCF2';
            ctx.shadowBlur = 20;
            ctx.fillText('BATTLE BOTS', this.width / 2, 200);
            ctx.font = 'bold 24px Arial';
            ctx.fillText('ARENA EVOLUTION', this.width / 2, 240);
            ctx.restore();
        }
        
        // Draw loading bar
        const barWidth = 400;
        const barHeight = 30;
        const barX = (this.width - barWidth) / 2;
        const barY = this.height / 2 + 50;
        
        // Bar background
        ctx.fillStyle = '#1a2332';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Bar border
        ctx.strokeStyle = '#56CCF2';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Progress fill
        const fillWidth = (barWidth - 4) * (this.progress / 100);
        if (fillWidth > 0) {
            const gradient = ctx.createLinearGradient(barX + 2, barY, barX + fillWidth, barY);
            gradient.addColorStop(0, '#2F80ED');
            gradient.addColorStop(1, '#56CCF2');
            ctx.fillStyle = gradient;
            ctx.fillRect(barX + 2, barY + 2, fillWidth, barHeight - 4);
        }
        
        // Loading text
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.message, this.width / 2, barY + barHeight + 30);
        
        // Progress percentage
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`${Math.floor(this.progress)}%`, this.width / 2, barY + barHeight / 2 + 7);
        
        // Tips or flavor text
        if (!this.isComplete) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#888888';
            ctx.textAlign = 'center';
            const tips = [
                'Tip: Use special abilities strategically!',
                'Tip: Upgrade your bot between matches',
                'Tip: Each bot class has unique strengths',
                'Tip: Avoid environmental hazards',
                'Tip: Collect power-ups for advantages'
            ];
            const tipIndex = Math.floor(this.animationTime / 3000) % tips.length;
            ctx.fillText(tips[tipIndex], this.width / 2, this.height - 50);
        }
        
        // Draw carnage image in corner if loaded (watermark style)
        if (this.imagesLoaded && this.carnage.complete && this.carnage.naturalWidth > 0) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            const carnageScale = 0.15;
            const carnageWidth = this.carnage.naturalWidth * carnageScale;
            const carnageHeight = this.carnage.naturalHeight * carnageScale;
            ctx.drawImage(this.carnage, this.width - carnageWidth - 20, this.height - carnageHeight - 20, carnageWidth, carnageHeight);
            ctx.restore();
        }
    }
}