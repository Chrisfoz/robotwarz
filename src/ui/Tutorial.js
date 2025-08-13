/**
 * Tutorial System - First-time player onboarding
 */

export class TutorialSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Tutorial state
        this.active = false;
        this.currentStep = 0;
        this.completed = false;
        this.skipRequested = false;
        
        // Check if player has seen tutorial
        this.hasSeenTutorial = localStorage.getItem('battlebots_tutorial_completed') === 'true';
        
        // Tutorial steps
        this.steps = [
            {
                title: 'Welcome to Battle Bots!',
                content: [
                    'Pilot your battle bot to victory!',
                    '',
                    'Objective: Defeat enemies to reach 8 kills',
                    'Your bot will respawn if destroyed',
                    '',
                    'Press SPACE to continue...'
                ],
                highlight: null,
                action: 'space'
            },
            {
                title: 'Movement',
                content: [
                    'Move your bot with:',
                    '• WASD keys for direct control',
                    '• Click anywhere to move there',
                    '',
                    'Try moving around now!',
                    '',
                    'Press SPACE when ready...'
                ],
                highlight: 'movement',
                action: 'move'
            },
            {
                title: 'Combat',
                content: [
                    'Attack enemies with:',
                    '• Q - Melee attack (close range, high damage)',
                    '• E - Ranged attack (projectiles)',
                    '',
                    'Aim with your mouse cursor',
                    '',
                    'Try attacking! Press SPACE to continue...'
                ],
                highlight: 'combat',
                action: 'attack'
            },
            {
                title: 'Special Ability',
                content: [
                    'Each bot has a unique ability:',
                    '• Press SPACE to activate',
                    '• Watch the cooldown timer',
                    '',
                    'Your Titan has Damage Reduction',
                    'Use it when under heavy fire!',
                    '',
                    'Press SPACE to start playing...'
                ],
                highlight: 'ability',
                action: 'complete'
            }
        ];
        
        // Visual settings
        this.overlay = {
            alpha: 0,
            targetAlpha: 0.8
        };
        
        this.box = {
            width: 400,
            height: 250,
            alpha: 0,
            targetAlpha: 1
        };
        
        // Input tracking
        this.playerMoved = false;
        this.playerAttacked = false;
        
        // Animation
        this.pulseAnimation = 0;
    }
    
    shouldShowTutorial() {
        return !this.hasSeenTutorial && !this.completed;
    }
    
    start() {
        if (this.hasSeenTutorial) {
            return false;
        }
        
        this.active = true;
        this.currentStep = 0;
        this.overlay.targetAlpha = 0.8;
        this.box.targetAlpha = 1;
        
        // Add event listeners
        this.setupEventListeners();
        
        return true;
    }
    
    setupEventListeners() {
        this.keyHandler = (e) => this.handleKeyPress(e);
        this.clickHandler = (e) => this.handleClick(e);
        
        window.addEventListener('keydown', this.keyHandler);
        this.canvas.addEventListener('click', this.clickHandler);
    }
    
    removeEventListeners() {
        window.removeEventListener('keydown', this.keyHandler);
        this.canvas.removeEventListener('click', this.clickHandler);
    }
    
    handleKeyPress(event) {
        if (!this.active) return;
        
        const key = event.key.toLowerCase();
        
        // Skip tutorial
        if (key === 'escape') {
            this.skip();
            return;
        }
        
        // Progress tutorial
        if (key === ' ') {
            event.preventDefault();
            this.nextStep();
        }
        
        // Track actions
        if (['w', 'a', 's', 'd'].includes(key)) {
            this.playerMoved = true;
        }
        
        if (key === 'q' || key === 'e') {
            this.playerAttacked = true;
        }
    }
    
    handleClick(event) {
        if (!this.active) return;
        
        // Check if clicked on skip button
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const skipX = this.canvas.width - 100;
        const skipY = 20;
        
        if (x >= skipX && x <= skipX + 80 && y >= skipY && y <= skipY + 30) {
            this.skip();
        }
        
        // Track movement
        this.playerMoved = true;
    }
    
    nextStep() {
        const step = this.steps[this.currentStep];
        
        // Check if action requirement met
        if (step.action === 'move' && !this.playerMoved) {
            return; // Must move first
        }
        
        if (step.action === 'attack' && !this.playerAttacked) {
            return; // Must attack first
        }
        
        this.currentStep++;
        
        if (this.currentStep >= this.steps.length) {
            this.complete();
        }
    }
    
    skip() {
        this.skipRequested = true;
        this.complete();
    }
    
    complete() {
        this.active = false;
        this.completed = true;
        this.overlay.targetAlpha = 0;
        this.box.targetAlpha = 0;
        
        // Save completion
        localStorage.setItem('battlebots_tutorial_completed', 'true');
        this.hasSeenTutorial = true;
        
        // Clean up
        this.removeEventListeners();
        
        // Notify game to start
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    update(deltaTime) {
        if (!this.active && this.overlay.alpha === 0) return;
        
        // Animate overlay
        this.overlay.alpha += (this.overlay.targetAlpha - this.overlay.alpha) * 0.1;
        this.box.alpha += (this.box.targetAlpha - this.box.alpha) * 0.1;
        
        // Pulse animation
        this.pulseAnimation += deltaTime * 0.003;
    }
    
    render() {
        if (!this.active && this.overlay.alpha < 0.01) return;
        
        const ctx = this.ctx;
        
        // Dark overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${this.overlay.alpha})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.box.alpha < 0.01) return;
        
        // Tutorial box
        const boxX = (this.canvas.width - this.box.width) / 2;
        const boxY = (this.canvas.height - this.box.height) / 2;
        
        // Box background
        ctx.fillStyle = `rgba(15, 23, 42, ${this.box.alpha * 0.95})`;
        ctx.fillRect(boxX, boxY, this.box.width, this.box.height);
        
        // Box border (pulsing)
        const pulse = Math.sin(this.pulseAnimation) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(86, 204, 242, ${this.box.alpha * pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, this.box.width, this.box.height);
        
        // Step indicator
        ctx.fillStyle = `rgba(86, 204, 242, ${this.box.alpha})`;
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(
            `Step ${this.currentStep + 1} / ${this.steps.length}`,
            boxX + this.box.width - 20,
            boxY + 25
        );
        
        // Title
        const step = this.steps[this.currentStep];
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = `rgba(255, 255, 255, ${this.box.alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText(step.title, this.canvas.width / 2, boxY + 50);
        
        // Content
        ctx.font = '16px Arial';
        ctx.fillStyle = `rgba(255, 255, 255, ${this.box.alpha * 0.9})`;
        ctx.textAlign = 'left';
        
        let lineY = boxY + 90;
        step.content.forEach(line => {
            if (line.startsWith('•')) {
                ctx.fillStyle = `rgba(86, 204, 242, ${this.box.alpha})`;
                ctx.fillText('•', boxX + 30, lineY);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.box.alpha * 0.9})`;
                ctx.fillText(line.substring(1), boxX + 45, lineY);
            } else {
                ctx.fillText(line, boxX + 30, lineY);
            }
            lineY += 22;
        });
        
        // Skip button
        ctx.fillStyle = `rgba(239, 68, 68, ${this.box.alpha * 0.8})`;
        ctx.fillRect(this.canvas.width - 100, 20, 80, 30);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = `rgba(255, 255, 255, ${this.box.alpha})`;
        ctx.textAlign = 'center';
        ctx.fillText('Skip (ESC)', this.canvas.width - 60, 40);
        
        // Highlight areas based on step
        if (step.highlight && this.box.alpha > 0.5) {
            this.renderHighlight(step.highlight);
        }
    }
    
    renderHighlight(type) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulseAnimation * 2) * 0.2 + 0.3;
        
        switch (type) {
            case 'movement':
                // Highlight WASD area
                ctx.strokeStyle = `rgba(86, 204, 242, ${pulse})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 5]);
                ctx.strokeRect(20, this.canvas.height - 120, 100, 100);
                ctx.setLineDash([]);
                break;
                
            case 'combat':
                // Highlight attack buttons
                ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.5})`;
                ctx.beginPath();
                ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 100, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'ability':
                // Highlight ability area
                const abilityX = (this.canvas.width - 200) / 2;
                const abilityY = this.canvas.height - 100;
                ctx.strokeStyle = `rgba(168, 85, 247, ${pulse})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(abilityX, abilityY, 200, 60);
                break;
        }
    }
    
    reset() {
        this.currentStep = 0;
        this.playerMoved = false;
        this.playerAttacked = false;
        this.completed = false;
        this.skipRequested = false;
        this.overlay.alpha = 0;
        this.box.alpha = 0;
    }
}