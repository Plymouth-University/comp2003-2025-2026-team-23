/**
 * Processing Feature Module
 * Handles document processing and progress tracking
 */

export class ProcessingManager {
    constructor() {
        this.isProcessing = false;
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.processBtn = document.getElementById('processBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
    }

    attachEventListeners() {
        this.processBtn?.addEventListener('click', () => {
            this.startProcessing();
        });

        // Listen for state changes
        document.addEventListener('fileUploaded', () => this.updateButtonState());
        document.addEventListener('fileUploadReset', () => this.updateButtonState());
        document.addEventListener('audienceChanged', () => this.updateButtonState());
    }

    updateButtonState() {
        // Check if we have both file and audience
        const hasFile = document.querySelector('.upload-box.has-file') !== null;
        const hasAudience = document.getElementById('audienceSelect')?.value !== '';
        
        if (hasFile && hasAudience) {
            this.processBtn.disabled = false;
            this.processBtn.style.backgroundColor = '#4CAF50';
        } else {
            this.processBtn.disabled = true;
            this.processBtn.style.backgroundColor = '#999';
        }
    }

    async startProcessing() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.progressSection.classList.add('active');
        
        const stages = [
            { percent: 20, text: 'Extracting text...' },
            { percent: 50, text: 'Analyzing content...' },
            { percent: 80, text: 'Generating summary...' },
            { percent: 100, text: 'Complete!' }
        ];

        // Attempt to get a request
        await this.updateProgress(0, "Sending request...");

        let reqResponse = await peelbackApp.requestManager.requestSimplification();
        console.log("Raw response:", reqResponse);

        for (const stage of stages) {
            await this.updateProgress(stage.percent, stage.text);
            await this.delay(1500);
        }

        // Show results
        await this.delay(500);
        this.showResults(reqResponse);
        this.resetProgress();
        this.isProcessing = false;
    }

    updateProgress(percent, text) {
        return new Promise((resolve) => {
            this.progressFill.style.width = percent + '%';
            this.progressText.textContent = text;
            resolve();
        });
    }

    showResults(reqResponse) {
        const emptyState = document.getElementById('emptyState');
        const resultsContainer = document.getElementById('resultsContainer');

        if (emptyState) emptyState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'flex';

        const app = window.peelbackApp;

        if (reqResponse && Array.isArray(reqResponse.blocks) && reqResponse.blocks.length > 0) {
            app.blocksManager.renderBlocks(reqResponse.blocks);
            console.log('✓ Results displayed from API response');

            // Persist to history
            const audience = app.controlsManager.getSelectedAudience() || 'patient';
            const paperName = this.extractPaperName(reqResponse.blocks)
                || app.uploadManager.uploadedFile?.name?.replace(/\.[^.]+$/, '')
                || 'Unknown Paper';
            app.historyManager.addHistoryItem({
                paperName,
                audience,
                complexity: app.controlsManager.getComplexityLevel(),
                blocksData: reqResponse.blocks,
            });
        } else {
            console.warn('API response invalid or empty, falling back to mock');
            app.blocksManager.loadMockBlocks();
        }
    }

    extractPaperName(blocksData) {
        const titleBlock = blocksData.find(b => b.type === 'title');
        if (titleBlock?.data?.title) return titleBlock.data.title;
        return null;
    }

    resetProgress() {
        this.progressSection.classList.remove('active');
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
