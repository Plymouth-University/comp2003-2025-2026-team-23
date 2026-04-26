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
        this.currentEntryId = null;
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

    addHistoryItem({ paperName, audience, complexity, blocksHTML }) {
        const items = this.getHistoryItems();
        const entry = {
            id: Date.now().toString(),
            paperName,
            audience,
            audienceLabel: AUDIENCE_LABELS[audience] || audience,
            complexity,
            date: new Date().toISOString(),
            blocksHTML,
            edits: {},
        };
        items.unshift(entry);
        if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
        this.saveHistoryItems(items);
        this.currentEntryId = entry.id;
    }

    updateCurrentEntry(blocksHTML) {
        if (!this.currentEntryId || !blocksHTML) return;
        const items = this.getHistoryItems();
        const entry = items.find(i => i.id === this.currentEntryId);
        if (entry) {
            entry.blocksHTML = blocksHTML;
            this.saveHistoryItems(items);
        }
    }

    /**
     * Records a single block's edited content. Called on every keystroke
     * (debounced) and on endBlockEdit, so even a mid-edit reload preserves
     * the latest typed content.
     */
    recordEdit(blockId, contentHTML) {
        if (!this.currentEntryId || !blockId) return;
        const items = this.getHistoryItems();
        const entry = items.find(i => i.id === this.currentEntryId);
        if (!entry) return;
        if (!entry.edits) entry.edits = {};
        entry.edits[blockId] = contentHTML;
        this.saveHistoryItems(items);
    }

    applyEdits(edits) {
        if (!edits) return;
        Object.entries(edits).forEach(([blockId, html]) => {
            const block = document.querySelector(`.block[data-block-id="${blockId}"]`);
            const content = block?.querySelector('.block-content');
            if (content) content.innerHTML = html;
        });
    }

    clearEdits() {
        if (!this.currentEntryId) return;
        const items = this.getHistoryItems();
        const entry = items.find(i => i.id === this.currentEntryId);
        if (!entry) return;
        entry.edits = {};
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

        this.currentEntryId = entry.id;

        // Force-switch to the Result tab BEFORE writing blocks, so the export
        // preview wrapper (tab2/tab3) can't interfere with the load.
        this.forceResultTab(app);

        if (entry.blocksHTML) {
            app.resultsManager.blocksHTML = entry.blocksHTML;
            app.blocksManager.tabContent.innerHTML = entry.blocksHTML;
            app.blocksManager.reinitialize?.();
            app.blocksManager.resetHistoryState?.();
        } else if (entry.blocksData) {
            app.resultsManager.blocksHTML = null;
            app.blocksManager.renderBlocks(entry.blocksData);
            app.blocksManager.resetHistoryState?.();
        }

        // Apply per-block edits over the restored HTML — this is the
        // authoritative source for text changes, captured on every keystroke
        this.applyEdits(entry.edits);
        // Re-cache so the result tab matches what the user sees
        app.resultsManager.cacheBlocksHTML();

        this.closePanel();
    }

    /**
     * Hard-reset the results UI to the Result tab state, regardless of which
     * tab was active. Avoids the stale-tab-content bugs when loading from
     * history while on the PDF or Plain Text export tabs.
     */
    forceResultTab(app) {
        const rm = app.resultsManager;
        rm.currentTab = 'tab1';
        rm.tabs.forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="tab1"]')?.classList.add('active');
        document.querySelector('.editing-toggle')?.classList.remove('editing-toggle--hidden');
        rm.updateBottomBar('tab1');
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
