/**
 * History Feature Module
 * Persists processed results to localStorage and restores them on demand.
 */

const STORAGE_KEY = 'peelback_history';
const MAX_ITEMS = 20;

const AUDIENCE_LABELS = {
    patient: 'Patients',
    nhs_clinician: 'Clinicians & NHS',
    policy_maker: 'Policy & Industry',
};

export class HistoryManager {
    constructor() {
        this.isOpen = false;
        this.initElements();
        this.renderHistoryList();
        this.attachEventListeners();
    }

    initElements() {
        this.historyPanel = document.getElementById('historyPanel');
        this.historyBtn = document.getElementById('historyBtn');
        this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
        this.historyContent = document.querySelector('.history-content');
    }

    attachEventListeners() {
        this.historyBtn?.addEventListener('click', () => this.togglePanel());
        this.closeHistoryBtn?.addEventListener('click', () => this.closePanel());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.closePanel();
        });
    }

    togglePanel() {
        this.isOpen ? this.closePanel() : this.openPanel();
    }

    openPanel() {
        this.renderHistoryList();
        this.historyPanel?.classList.add('open');
        this.isOpen = true;
    }

    closePanel() {
        this.historyPanel?.classList.remove('open');
        this.isOpen = false;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    getHistoryItems() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    saveHistoryItems(items) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.warn('Could not save history to localStorage', e);
        }
    }

    addHistoryItem({ paperName, audience, complexity, blocksData }) {
        const items = this.getHistoryItems();
        items.unshift({
            id: Date.now().toString(),
            paperName,
            audience,
            audienceLabel: AUDIENCE_LABELS[audience] || audience,
            complexity,
            date: new Date().toISOString(),
            blocksData,
        });
        if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
        this.saveHistoryItems(items);
    }

    // ─── Rendering ────────────────────────────────────────────────────────────

    renderHistoryList() {
        if (!this.historyContent) return;
        const items = this.getHistoryItems();

        if (items.length === 0) {
            this.historyContent.innerHTML = `
                <div class="history-empty">
                    <div class="history-empty-icon">🕐</div>
                    <p>No history yet</p>
                    <small>Your processed documents will appear here</small>
                </div>`;
            return;
        }

        this.historyContent.innerHTML = items.map(item => `
            <div class="history-item" data-history-id="${item.id}">
                <div class="history-item-icon">📄</div>
                <div class="history-item-details">
                    <h4 class="history-item-title">${this.escapeHTML(item.paperName)}</h4>
                    <p class="history-item-meta">
                        <span class="history-date">${this.formatDate(item.date)}</span>
                        <span class="history-separator">•</span>
                        <span class="history-audience">${this.escapeHTML(item.audienceLabel)}</span>
                    </p>
                </div>
            </div>`).join('');

        this.historyContent.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => this.loadHistoryItem(el.dataset.historyId));
        });
    }

    // ─── Loading ──────────────────────────────────────────────────────────────

    loadHistoryItem(historyId) {
        const entry = this.getHistoryItems().find(i => i.id === historyId);
        if (!entry) return;

        const app = window.peelbackApp;

        // Clear the file upload panel
        app.uploadManager.resetUpload();

        // Restore audience and complexity
        app.controlsManager.setAudience(entry.audience);
        app.controlsManager.setComplexityLevel(entry.complexity);

        // Show the results area
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'flex';

        // Clear any stale cached blocks so switchTab doesn't flash old content
        app.resultsManager.blocksHTML = null;
        app.resultsManager.switchTab('tab1');

        // Render blocks — renderBlocks() calls updateCache() which calls cacheBlocksHTML()
        app.blocksManager.renderBlocks(entry.blocksData);

        this.closePanel();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    formatDate(isoString) {
        return new Date(isoString).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    }

    escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
