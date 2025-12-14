/**
 * Main Application Controller
 * Initializes and coordinates all feature modules
 */

import { UploadManager } from './features/upload.js';
import { ControlsManager } from './features/controls.js';
import { ProcessingManager } from './features/processing.js';
import { ResultsManager } from './features/results.js';

class PeelbackApp {
    constructor() {
        this.init();
    }

    init() {
        // Initialize all modules
        this.uploadManager = new UploadManager();
        this.controlsManager = new ControlsManager();
        this.processingManager = new ProcessingManager();
        this.resultsManager = new ResultsManager();

        console.log('✓ Peelback app initialized');
        
        // Setup global error handling
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Application error:', event.error);
            // TODO: Add user-friendly error display
        });
    }

    // Public API for accessing managers
    getUploadedFile() {
        return this.uploadManager.getUploadedFile();
    }

    getSelectedAudience() {
        return this.controlsManager.getSelectedAudience();
    }

    getComplexityLevel() {
        return this.controlsManager.getComplexityLevel();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.peelbackApp = new PeelbackApp();
});