/**
 * History Feature Module
 * Handles history panel toggle and mock data
 */

export class HistoryManager {
    constructor() {
        this.isOpen = false;
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.historyPanel = document.getElementById('historyPanel');
        this.historyBtn = document.getElementById('historyBtn');
        this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
        this.historyItems = document.querySelectorAll('.history-item');
    }

    attachEventListeners() {
        // Open history panel
        this.historyBtn?.addEventListener('click', () => {
            this.togglePanel();
        });

        // Close history panel
        this.closeHistoryBtn?.addEventListener('click', () => {
            this.closePanel();
        });

        // Click on history item (placeholder for future functionality)
        this.historyItems.forEach(item => {
            item.addEventListener('click', () => {
                const historyId = item.dataset.historyId;
                this.loadHistoryItem(historyId);
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closePanel();
            }
        });
    }

    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        this.historyPanel?.classList.add('open');
        this.isOpen = true;
    }

    closePanel() {
        this.historyPanel?.classList.remove('open');
        this.isOpen = false;
    }

    loadHistoryItem(historyId) {
        console.log('Loading history item:', historyId);
        // TODO: Implement actual loading from browser storage
        // For now, just show an alert
        alert(`Loading history item ${historyId} - This will load from browser storage once implemented!`);
        this.closePanel();
    }

    // Mock method - replace with real browser storage later
    addHistoryItem(paperName, audience, date) {
        console.log('Adding history item:', { paperName, audience, date });
        // TODO: Save to browser storage
        // TODO: Update UI with new item
    }

    // Mock method - replace with real browser storage later
    getHistoryItems() {
        console.log('Getting history items from storage');
        // TODO: Retrieve from browser storage
        return [];
    }
}