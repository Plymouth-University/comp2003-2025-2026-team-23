/**
 * History Feature Module
 *
 * Single source of truth: each entry stores a `blocks` array of
 *   { id, type, span, contentHTML }
 * which fully describes the user's current layout. Every mutation in the
 * blocks editor takes a snapshot of the DOM and writes it to the active
 * entry; loading just renders the saved array directly.
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

    togglePanel() { this.isOpen ? this.closePanel() : this.openPanel(); }

    openPanel() {
        this.renderHistoryList();
        this.historyPanel?.classList.add('open');
        this.isOpen = true;
    }

    closePanel() {
        this.historyPanel?.classList.remove('open');
        this.isOpen = false;
    }

    // ─── Storage primitives ───────────────────────────────────────────────────

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

    // ─── DOM ↔ state ──────────────────────────────────────────────────────────

    /**
     * Reads the current DOM and returns a structured snapshot of blocks.
     * Filters out drag artifacts so a mid-drag DOM never produces duplicates.
     * Returns null if no blocks container is present.
     */
    snapshotBlocksFromDOM() {
        const container = document.getElementById('blocksContainer');
        if (!container) return null;
        const blocks = Array.from(container.querySelectorAll(':scope > .block'))
            .filter(el =>
                !el.classList.contains('block-dragging') &&
                !el.classList.contains('drag-clone')
            );
        if (blocks.length === 0) return null;
        return blocks.map(el => ({
            id: String(el.dataset.blockId || ''),
            type: el.dataset.blockType || '',
            span: parseInt(el.dataset.span, 10) === 2 ? 2 : 1,
            contentHTML: el.querySelector('.block-content')?.innerHTML || '',
        }));
    }

    /**
     * Captures the current DOM state into the active history entry.
     * Called from every block mutation (drag, edit, remove, undo/redo, clear).
     */
    snapshotFromDOM() {
        if (!this.currentEntryId) return;
        const blocks = this.snapshotBlocksFromDOM();
        if (!blocks) return;
        const items = this.getHistoryItems();
        const entry = items.find(i => i.id === this.currentEntryId);
        if (!entry) return;
        entry.blocks = blocks;
        this.saveHistoryItems(items);
    }

    /**
     * Cheap per-block content update — used by the debounced input listener
     * during typing so a mid-edit reload still preserves the latest keystrokes.
     */
    recordEdit(blockId, contentHTML) {
        if (!this.currentEntryId || !blockId) return;
        const items = this.getHistoryItems();
        const entry = items.find(i => i.id === this.currentEntryId);
        if (!entry || !Array.isArray(entry.blocks)) return;
        const block = entry.blocks.find(b => String(b.id) === String(blockId));
        if (!block) return;
        block.contentHTML = contentHTML;
        this.saveHistoryItems(items);
    }

    // ─── Entry creation ───────────────────────────────────────────────────────

    /**
     * Creates a new history entry. The blocks must already be rendered to the
     * DOM — addHistoryItem reads them via snapshotBlocksFromDOM. Returns the
     * created entry id, or null if no blocks were available to capture.
     */
    addHistoryItem({ paperName, audience, complexity }) {
        const blocks = this.snapshotBlocksFromDOM();
        if (!blocks) {
            console.warn('addHistoryItem: no blocks rendered, skipping');
            return null;
        }
        const items = this.getHistoryItems();
        const entry = {
            id: Date.now().toString(),
            paperName,
            audience,
            audienceLabel: AUDIENCE_LABELS[audience] || audience,
            complexity,
            date: new Date().toISOString(),
            blocks,
        };
        items.unshift(entry);
        if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
        this.saveHistoryItems(items);
        this.currentEntryId = entry.id;
        return entry.id;
    }

    // ─── List rendering ───────────────────────────────────────────────────────

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

        app.uploadManager.resetUpload();
        app.controlsManager.setAudience(entry.audience);
        app.controlsManager.setComplexityLevel(entry.complexity);

        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'flex';

        this.currentEntryId = entry.id;
        this.forceResultTab(app);

        if (Array.isArray(entry.blocks) && entry.blocks.length > 0) {
            // Current format — deterministic render from structured array
            app.blocksManager.renderFromBlocks(entry.blocks);
        } else if (entry.blocksHTML) {
            // Legacy: full HTML snapshot
            app.blocksManager.tabContent.innerHTML = entry.blocksHTML;
            app.blocksManager.reinitialize?.();
            this.applyLegacyEdits(entry.edits);
        } else if (entry.blocksData) {
            // Legacy: raw API data
            app.blocksManager.renderBlocks(entry.blocksData);
            this.applyLegacyEdits(entry.edits);
        }

        app.blocksManager.resetHistoryState?.();
        // Migrate legacy entries to the new structured format on first load
        if (!Array.isArray(entry.blocks) || entry.blocks.length === 0) {
            this.snapshotFromDOM();
        }
        app.resultsManager.cacheBlocksHTML();

        this.closePanel();
    }

    /**
     * Applies a legacy `edits` map ({blockId: contentHTML}) over the rendered
     * DOM. Only used during one-time migration of old entries.
     */
    applyLegacyEdits(edits) {
        if (!edits) return;
        Object.entries(edits).forEach(([blockId, html]) => {
            const block = document.querySelector(`.block[data-block-id="${blockId}"]`);
            const content = block?.querySelector('.block-content');
            if (content) content.innerHTML = html;
        });
    }

    /**
     * Hard-resets the results UI to the Result tab, regardless of which tab
     * was active. Avoids stale-tab-content bugs when loading from history
     * while on the PDF or Plain Text export tabs.
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
