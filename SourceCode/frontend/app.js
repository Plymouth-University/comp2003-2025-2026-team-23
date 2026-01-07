/**
 * Main Application Controller
 * Initializes and coordinates all feature modules
 */

import { UploadManager } from './features/upload.js';
import { ControlsManager } from './features/controls.js';
import { ProcessingManager } from './features/processing.js';
import { ResultsManager } from './features/results.js';
import { RequestManager } from './features/request.js';

class PeelbackApp {
    constructor() {
        this.init();
    }

    async init() {
        // Initialize all modules
        this.uploadManager = new UploadManager();
        this.controlsManager = new ControlsManager();
        this.processingManager = new ProcessingManager();
        this.resultsManager = new ResultsManager();
        this.requestManager = new RequestManager();

        console.log('✓ Peelback app initialized');

        // Establish contact with the server
        console.log('Contacting server...');
        let ping = await this.requestManager.ping();
        if (ping) {
            console.log('✓ Successfully connected to server');
        } else {
            console.log('✗ Error: server connection failed');
            // TODO: Error handling for if the app fails to connect
        }
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
