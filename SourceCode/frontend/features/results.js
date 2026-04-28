/**
 * Results Feature Module
 * Handles display of simplified content with tabs
 */
export class ResultsManager {
    constructor() {
        this.currentTab = 'tab1';
        this.apiData = {};
        this.blocksHTML = null;
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.tabs = document.querySelectorAll('.tab');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.tabContent = document.querySelector('.tab-content');
        this.emptyState = document.getElementById('emptyState');
    }

    attachEventListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.addEventListener('processingComplete', (e) => {
            this.apiData = e.detail;
        });

        // Export bar buttons — delegated so they work after bar re-renders
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.id === 'downloadPdfBtn') this.downloadPDF();
            if (btn.id === 'copyTextBtn') this.handleCopyText(btn);
        });
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);

        this.tabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');

        this.currentTab = tabName;
        this.updateBottomBar(tabName);

        // Show editing toggle only on the Result tab
        const editingToggle = document.querySelector('.editing-toggle');
        if (editingToggle) editingToggle.classList.toggle('editing-toggle--hidden', tabName !== 'tab1');

        if (tabName === 'tab1') {
            this.showResultTab();
        } else if (tabName === 'tab2') {
            this.showContentBlockExport();
        } else {
            this.showPlainTextExport();
        }
    }

    // ─── Bottom bar ───────────────────────────────────────────────────────────

    updateBottomBar(tabName) {
        const bar = document.getElementById('blocksHistoryBar');
        if (!bar) return;

        if (tabName === 'tab1') {
            bar.innerHTML = `
                <button class="btn-history-pill" id="blockUndoBtn" disabled>
                    <span class="pill-icon">↶</span> Undo
                </button>
                <button class="btn-history-pill" id="blockRedoBtn" disabled>
                    <span class="pill-icon">↷</span> Redo
                </button>
                <button class="btn-history-pill btn-clear-changes" id="blockClearBtn" disabled>
                    Clear all changes
                </button>
            `;
            // Restore correct disabled states after re-render
            window.peelbackApp?.blocksManager?.updateHistoryButtons();

        } else if (tabName === 'tab2') {
            bar.innerHTML = `
                <span class="export-bar-label">PDF preview — colours and layout match your edited blocks</span>
                <button class="btn-history-pill btn-export-action" id="downloadPdfBtn">
                    <span class="pill-icon">⬇</span> Download PDF
                </button>
            `;

        } else {
            bar.innerHTML = `
                <span class="export-bar-label">Plain text version of your content</span>
                <button class="btn-history-pill btn-export-action" id="copyTextBtn">
                    <span class="pill-icon">📋</span> Copy to clipboard
                </button>
            `;
        }
    }

    // ─── Tab 1: Result (blocks editor) ───────────────────────────────────────

    showResultTab() {
        if (this.blocksHTML) {
            this.tabContent.innerHTML = this.blocksHTML;
            if (window.peelbackApp && window.peelbackApp.blocksManager) {
                window.peelbackApp.blocksManager.reinitialize();
            }
        } else {
            this.tabContent.innerHTML = `
                <p style="text-align: center; color: #6B7280; padding: 40px;">
                    Processing results will appear here...
                </p>
            `;
        }
    }

    cacheBlocksHTML() {
        // Only cache when the user is actually on the Result tab —
        // the export preview also injects a #blocksContainer clone into tabContent
        // which would otherwise overwrite the real blocks HTML.
        if (this.currentTab !== 'tab1') return;
        const blocksContainer = document.getElementById('blocksContainer');
        if (blocksContainer) {
            this.blocksHTML = this.tabContent.innerHTML;
            console.log('✓ Cached blocks HTML');
        }
    }

    // ─── Tab 2: Content Block Export ─────────────────────────────────────────

    showContentBlockExport() {
        const cleanHTML = this.buildCleanBlocksHTML();

        this.tabContent.innerHTML = `
            <div class="export-preview-scroll">
                <div class="export-preview-stage">
                    ${cleanHTML}
                </div>
            </div>
        `;
    }

    /**
     * Clones the blocks container, strips all editing UI (headers, buttons,
     * contenteditable), but keeps every block class, colour, data-span and
     * grid layout intact so the preview matches the Result tab exactly.
     */
    buildCleanBlocksHTML() {
        if (!this.blocksHTML) {
            return '<p style="color:#6B7280;text-align:center;padding:60px;">No content to export yet.</p>';
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(this.blocksHTML, 'text/html');
        const container = doc.getElementById('blocksContainer');
        if (!container) return '<p style="color:#6B7280;text-align:center;padding:60px;">No content found.</p>';

        // Clone the whole container — keeps grid, block classes, data-span etc.
        const clone = container.cloneNode(true);

        // Remove the id so the clone is never mistaken for the live blocksContainer
        clone.removeAttribute('id');

        // Strip every block-header (drag handles + buttons)
        clone.querySelectorAll('.block-header').forEach(el => el.remove());

        // Strip editing artefacts from block-content elements
        clone.querySelectorAll('.block-content').forEach(el => {
            el.removeAttribute('contenteditable');
            el.removeAttribute('data-editable-mode');
            el.classList.remove('block-editing', 'editing-mode-active');
        });

        return clone.outerHTML;
    }

    async downloadPDF() {
        let blocksCss = '';
        try {
            blocksCss = await fetch('./assets/styles/blocks.css').then(r => r.text());
        } catch (e) {
            console.warn('Could not load blocks.css for PDF export', e);
        }

        const contentHTML = this.buildCleanBlocksHTML();

        // Use a hidden iframe so no new tab is opened.
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Peelback Export</title>
    <style>
        /* ── Page setup ── */
        * { box-sizing: border-box; }
        body { margin: 0; padding: 16mm 12mm; font-family: system-ui, sans-serif; }
        @page { size: A4; }

        /* ── Hide any leftover UI chrome ── */
        .block-header, .drag-handle, .btn-save-block, .btn-remove-block,
        .drag-clone, .between-indicator, .side-indicator { display: none !important; }

        /* ── Injected blocks stylesheet ── */
        ${blocksCss}

        /* ── Print overrides: undo responsive breakpoint collapses ── */
        .blocks-container {
            padding: 0 !important;
            gap: 12px !important;
            grid-template-columns: repeat(2, 1fr) !important;
            max-width: 100% !important;
            margin: 0 !important;
        }
        .block { break-inside: avoid; page-break-inside: avoid; }
        .block:hover { box-shadow: none !important; border-color: inherit !important; }
        .block[data-span="1"] { grid-column: span 1 !important; }
        .block[data-span="2"] { grid-column: span 2 !important; }
        .sample-grid,
        .stats-grid,
        .sample-info-block[data-span="1"] .sample-grid,
        .stats-block[data-span="1"] .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    </style>
</head>
<body>${contentHTML}</body>
</html>`);
        doc.close();

        iframe.addEventListener('load', () => {
            // Small delay lets the browser finish layout before the print dialog opens
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                // Remove the iframe after the print dialog is dismissed
                iframe.contentWindow.addEventListener('afterprint', () => {
                    document.body.removeChild(iframe);
                });
            }, 300);
        });
    }

    // ─── Tab 3: Plain Text Export ─────────────────────────────────────────────

    showPlainTextExport() {
        const sections = this.buildPlainTextSections();

        const html = sections.map(({ heading, lines }) => {
            const headingHTML = heading
                ? `<h3 class="plain-text-heading">${this.escapeHTML(heading)}</h3>`
                : '';
            const bodyHTML = lines
                .map(l => `<p class="plain-text-line">${this.escapeHTML(l)}</p>`)
                .join('');
            return `<div class="plain-text-block">${headingHTML}${bodyHTML}</div>`;
        }).join('');

        this.tabContent.innerHTML = `
            <div class="export-preview-scroll">
                <div class="export-preview-stage plain-text-stage">
                    ${html || '<p style="color:#9CA3AF;">No content to export yet.</p>'}
                </div>
            </div>
        `;
    }

    handleCopyText(btn) {
        const sections = this.buildPlainTextSections();
        const text = sections.map(({ heading, lines }) =>
            [heading, ...lines].filter(Boolean).join('\n')
        ).join('\n\n');

        navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = '<span class="pill-icon">✓</span> Copied!';
            setTimeout(() => {
                btn.innerHTML = '<span class="pill-icon">📋</span> Copy to clipboard';
            }, 2000);
        });
    }

    buildPlainTextSections() {
        if (!this.blocksHTML) return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(this.blocksHTML, 'text/html');
        const blocks = doc.querySelectorAll('.block');
        const sections = [];

        blocks.forEach(block => {
            const content = block.querySelector('.block-content');
            if (!content) return;

            // Strip editing UI before reading text
            content.querySelectorAll('.block-header, .btn-save-block, .btn-remove-block')
                .forEach(el => el.remove());

            let heading = '';
            const lines = [];

            // Heading (h1–h3)
            const h = content.querySelector('h1, h2, h3, h4');
            if (h) heading = h.textContent.trim();

            // Paragraphs
            content.querySelectorAll('p').forEach(p => {
                const t = p.textContent.trim();
                if (t) lines.push(t);
            });

            // List items
            content.querySelectorAll('li').forEach(li => {
                const t = li.textContent.trim();
                if (t) lines.push('• ' + t);
            });

            // Key-value rows (pub-item, sample-item, stat-item)
            content.querySelectorAll('.pub-item, .sample-item, .stat-item').forEach(item => {
                const label = item.querySelector('.pub-label, .sample-label, .stat-label');
                const value = item.querySelector('.pub-value, .sample-value, .stat-value');
                if (label && value) {
                    lines.push(`${label.textContent.trim()}: ${value.textContent.trim()}`);
                } else {
                    const t = item.textContent.trim();
                    if (t) lines.push(t);
                }
            });

            // Author block fallback
            if (!heading && lines.length === 0) {
                const raw = content.textContent.replace(/\s+/g, ' ').trim();
                if (raw) lines.push(raw);
            }

            if (heading || lines.length > 0) sections.push({ heading, lines });
        });

        return sections;
    }

    escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
