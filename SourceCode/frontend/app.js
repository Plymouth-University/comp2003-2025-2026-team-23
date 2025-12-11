/**
 * Main Application Controller
 * Initializes Upload Manager
 */

// Import upload module
import { UploadManager } from './features/upload.js';

class PeelbackApp {
    constructor() {
        console.log('🚀 Initializing Peelback...');
        this.init();
    }

    init() {
        // Initialize upload module
        this.uploadManager = new UploadManager();

        console.log('✅ Upload module initialized successfully');
    }

    // Public API method for accessing upload manager
    getUploadedFile() {
        return this.uploadManager?.getUploadedFile();
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.peelbackApp = new PeelbackApp();
    });
} else {
    // DOM already loaded
    window.peelbackApp = new PeelbackApp();
}

// Export for testing
export default PeelbackApp;