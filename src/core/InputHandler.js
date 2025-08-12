export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            buttons: new Set()
        };
        this.touch = {
            active: false,
            x: 0,
            y: 0
        };
        this.listeners = new Map();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        
        // Prevent right-click context menu
        this.canvas.oncontextmenu = () => false;
    }

    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        this.keys.set(key, true);
        
        // Emit events for specific keys
        switch(key) {
            case ' ':
                event.preventDefault();
                this.emit('ability');
                break;
            case 'escape':
                this.emit('pause');
                break;
            case 'r':
                this.emit('restart');
                break;
            case 'w':
            case 'arrowup':
                this.emit('moveUp');
                break;
            case 's':
            case 'arrowdown':
                this.emit('moveDown');
                break;
            case 'a':
            case 'arrowleft':
                this.emit('moveLeft');
                break;
            case 'd':
            case 'arrowright':
                this.emit('moveRight');
                break;
        }
    }

    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        this.keys.set(key, false);
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
        this.mouse.buttons.add(event.button);
        
        if (event.button === 0) { // Left click
            this.emit('primaryAttack');
        } else if (event.button === 2) { // Right click
            this.emit('secondaryAttack');
        }
        
        // Also emit move event for click-to-move
        this.emit('move', this.mouse.x, this.mouse.y);
    }

    handleMouseUp(event) {
        this.mouse.buttons.delete(event.button);
        
        if (event.button === 0) {
            this.emit('primaryRelease');
        } else if (event.button === 2) {
            this.emit('secondaryRelease');
        }
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
        
        // If left button is held, update movement target
        if (this.mouse.buttons.has(0)) {
            this.emit('move', this.mouse.x, this.mouse.y);
        }
    }

    handleTouchStart(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0];
        
        this.touch.active = true;
        this.touch.x = touch.clientX - rect.left;
        this.touch.y = touch.clientY - rect.top;
        
        // Treat touch as movement and primary attack
        this.emit('move', this.touch.x, this.touch.y);
        this.emit('primaryAttack');
    }

    handleTouchEnd(event) {
        event.preventDefault();
        this.touch.active = false;
        this.emit('primaryRelease');
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (!this.touch.active) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0];
        
        this.touch.x = touch.clientX - rect.left;
        this.touch.y = touch.clientY - rect.top;
        
        this.emit('move', this.touch.x, this.touch.y);
    }

    isKeyPressed(key) {
        return this.keys.get(key.toLowerCase()) || false;
    }

    isMouseButtonPressed(button) {
        return this.mouse.buttons.has(button);
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    getTouchPosition() {
        return { x: this.touch.x, y: this.touch.y };
    }

    getInputPosition() {
        // Returns either mouse or touch position
        if (this.touch.active) {
            return this.getTouchPosition();
        }
        return this.getMousePosition();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                callback(...args);
            });
        }
    }

    clear() {
        this.keys.clear();
        this.mouse.buttons.clear();
        this.touch.active = false;
    }

    destroy() {
        // Clean up event listeners if needed
        this.listeners.clear();
        this.clear();
    }
}