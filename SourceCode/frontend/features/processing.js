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

        // Lock the button for the duration of the run — updateButtonState
        // can't re-enable it because we set our own disabled flag here, and
        // the input panel doesn't change until processing completes.
        this.processBtn.disabled = true;
        this.processBtn.style.backgroundColor = '#999';
        this.processBtn.style.cursor = 'not-allowed';

        // Clear the output area for the new run. Must detach from the active
        // history entry FIRST so any DOM mutations during teardown can't
        // write an empty blocks array back over the previous entry.
        this.clearOutput();

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

        // Reset the left input panel to its natural empty state. The events
        // dispatched by these resets will fire updateButtonState, which keeps
        // the process button disabled until the user uploads + selects again.
        this.processBtn.style.cursor = '';
        this.resetInputPanel();
    }

    /**
     * Returns the left-side input panel to its natural state: clears the
     * uploaded file, deselects the audience card, and resets the complexity
     * slider to its default. The user must re-supply all inputs before the
     * process button re-enables.
     */
    resetInputPanel() {
        const app = window.peelbackApp;
        if (!app) return;
        app.uploadManager?.resetUpload?.();
        app.controlsManager?.clearSelections?.();
    }

    updateProgress(percent, text) {
        return new Promise((resolve) => {
            this.progressFill.style.width = percent + '%';
            this.progressText.textContent = text;
            resolve();
        });
    }

    /**
     * Wipes the output area at the start of a new processing run without
     * touching any persisted history entries.
     *
     * Order is important:
     *  1. Detach from the active history entry so subsequent snapshotFromDOM
     *     calls are no-ops and cannot mutate the previous entry's blocks.
     *  2. Clear the cached blocksHTML and the live tabContent DOM.
     *  3. Reset BlocksManager's in-memory state (initialHTML, undo/redo).
     */
    clearOutput() {
        const app = window.peelbackApp;
        if (!app) return;

        // 1. Detach from history BEFORE touching the DOM
        if (app.historyManager) {
            app.historyManager.currentEntryId = null;
        }

        // 2. Clear cached HTML and the visible output
        if (app.resultsManager) {
            app.resultsManager.blocksHTML = null;
        }
        const tabContent = document.getElementById('tabContent');
        if (tabContent) {
            tabContent.innerHTML = '';
        }

        // 3. Reset the blocks editor's in-memory state
        if (app.blocksManager) {
            app.blocksManager.blocksContainer = null;
            app.blocksManager.initialHTML = null;
            app.blocksManager.undoStack = [];
            app.blocksManager.redoStack = [];
            app.blocksManager.updateHistoryButtons?.();
        }
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

            // Persist to history — addHistoryItem reads blocks from the DOM
            // via snapshotBlocksFromDOM, so renderBlocks must run first.
            const audience = app.controlsManager.getSelectedAudience() || 'patient';
            const paperName = this.extractPaperName(reqResponse.blocks)
                || app.uploadManager.uploadedFile?.name?.replace(/\.[^.]+$/, '')
                || 'Unknown Paper';
            app.historyManager.addHistoryItem({
                paperName,
                audience,
                complexity: app.controlsManager.getComplexityLevel(),
            });
        } else {
            console.warn('API response invalid or empty, falling back to mock');
            app.blocksManager.loadMockBlocks();

            const audience = app.controlsManager.getSelectedAudience() || 'patient';
            const fileName = app.uploadManager.uploadedFile?.name?.replace(/\.[^.]+$/, '');
            app.historyManager.addHistoryItem({
                paperName: fileName || 'Sample Document',
                audience,
                complexity: app.controlsManager.getComplexityLevel(),
            });
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
