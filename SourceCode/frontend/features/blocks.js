/**
 * Blocks Feature Module - Custom Drag & Drop
 */

export class BlocksManager {

    BLOCK_SCHEMA = {
        title:            { cssClass: 'title-block',            editable: false, removable: false },
        author:           { cssClass: 'author-block',           editable: false, removable: false },
        publication_info: { cssClass: 'publication-block',      editable: false, removable: true  },
        sample_info:      { cssClass: 'sample-info-block',      editable: false, removable: true  },
        summary:          { cssClass: 'summary-block',          editable: true,  removable: true  },
        text_section:     { cssClass: 'text-block',             editable: true,  removable: true  },
        stats:            { cssClass: 'stats-block',            editable: true,  removable: true  },
        key_findings:     { cssClass: 'findings-block',         editable: true,  removable: true  },
        implications:     { cssClass: 'implications-block',     editable: true,  removable: true  },
        recommendations:  { cssClass: 'recommendations-block',  editable: true,  removable: true  },
    };

    RENDERERS = {
        title: ({ title }) =>
            `<h1 class="block-title">${title}</h1>`,

        author: ({ authors }) => authors.map(({ initials, name, department, institution }) => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <div style="width:60px;height:60px;border-radius:50%;background:#E5E7EB;display:flex;align-items:center;justify-content:center;font-weight:600;color:#6366F1;font-size:18px;flex-shrink:0;">
                    ${initials}
                </div>
                <div class="author-info">
                    <h4>${name}</h4>
                    <p>${department}</p>
                    <p>${institution}</p>
                </div>
            </div>`).join(''),

        publication_info: ({ published, doi }) => `
            <div class="pub-item"><span class="pub-label">Published:</span><span class="pub-value">${published}</span></div>
            <div class="pub-item"><span class="pub-label">DOI:</span><span class="pub-value">${doi ?? 'N/A'}</span></div>`,

        sample_info: ({ items }) => `
            <div class="sample-grid">
                ${items.map(({ label, value }) => `
                    <div class="sample-item">
                        <span class="sample-label">${label}</span>
                        <span class="sample-value">${value}</span>
                    </div>`).join('')}
            </div>`,

        summary: ({ heading, body }) =>
            `<h3>${heading}</h3><p>${body}</p>`,

        text_section: ({ heading, body }) =>
            `<h3>${heading}</h3><p>${body}</p>`,

        stats: ({ items }) => `
            <h3>Key Statistics</h3>
            <div class="stats-grid">
                ${items.map(({ label, value }) => `
                    <div class="stat-item">
                        <span class="stat-label">${label}</span>
                        <span class="stat-value">${value}</span>
                    </div>`).join('')}
            </div>`,

        key_findings: ({ heading, items }) => `
            <h3>${heading ?? 'Key Findings'}</h3>
            <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`,

        implications: ({ heading, body }) =>
            `<h3>${heading ?? 'What This Means for You'}</h3><p>${body}</p>`,

        recommendations: ({ heading, items }) => `
            <h3>${heading ?? 'Recommendations'}</h3>
            <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`,
    };

    constructor() {
        this.state = {
            originalBlocks: [],
            removedBlocks: [],
            editedBlocks: {},
            blockOrder: []
        };

        this.listenersAttached = false;
        this.fullWidthOnly = new Set(['title']);

        // Drag state
        this.isDragging = false;
        this.draggedEl = null;
        this.dragClone = null;
        this.activeZone = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.betweenIndicator = null;
        this.sideIndicator = null;

        this.initElements();
        this.setupGlobalListeners();
        console.log('✓ BlocksManager initialized');
    }

    initElements() {
        this.tabContent = document.getElementById('tabContent');
        this.blocksContainer = null;
    }

    // ═══════════════════════════════════════════
    //  GLOBAL LISTENERS 
    // ═══════════════════════════════════════════
    setupGlobalListeners() {
        if (this.listenersAttached) return;

        document.addEventListener('click', (e) => {
            if (this.isDragging) return;
            if (e.target.classList.contains('btn-edit-block')) {
                this.toggleEdit(e.target.closest('.block'), e.target);
            }
            if (e.target.classList.contains('btn-remove-block')) {
                this.removeBlock(e.target.closest('.block'));
            }
        });

        document.addEventListener('pointerdown', (e) => {
            const handle = e.target.closest('.drag-handle');
            if (!handle) return;
            const block = handle.closest('.block');
            if (!block || this.fullWidthOnly.has(block.dataset.blockType)) return;
            e.preventDefault();
            this.startDrag(block, e.clientX, e.clientY);
        });

        document.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            this.onDragMove(e.clientX, e.clientY);
        });

        document.addEventListener('pointerup', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            this.endDrag();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDragging) this.cancelDrag();
        });

        this.listenersAttached = true;
        console.log('✓ Global listeners attached');
    }

    // ═══════════════════════════════════════════
    //  LOAD / REINIT
    // ═══════════════════════════════════════════
    loadMockBlocks() {
        if (this.tabContent) {
            this.renderBlocks(this.getMockData());
            console.log('✓ Mock blocks loaded');
        }
    }

    reinitialize() {
        this.blocksContainer = document.getElementById('blocksContainer');
        if (!this.blocksContainer) return;
        this.reflowLayout();
        console.log('✓ Blocks reinitialized');
    }

    // ═══════════════════════════════════════════
    //  REFLOW 
    // ═══════════════════════════════════════════
    reflowLayout() {
        if (!this.blocksContainer) return;
        const blocks = this.getBlocks();
        let i = 0;
        while (i < blocks.length) {
            const block = blocks[i];
            if (this.fullWidthOnly.has(block.dataset.blockType)) {
                block.dataset.span = '2';
                i++;
                continue;
            }
            if (i + 1 < blocks.length && !this.fullWidthOnly.has(blocks[i + 1].dataset.blockType)) {
                block.dataset.span = '1';
                blocks[i + 1].dataset.span = '1';
                i += 2;
                continue;
            }
            block.dataset.span = '2';
            i++;
        }
    }

    // ═══════════════════════════════════════════
    //  DRAG START
    // ═══════════════════════════════════════════
    startDrag(block, clientX, clientY) {
        this.isDragging = true;
        this.draggedEl = block;

        const rect = block.getBoundingClientRect();
        this.offsetX = clientX - rect.left;
        this.offsetY = clientY - rect.top;

        // Floating clone
        this.dragClone = block.cloneNode(true);
        this.dragClone.classList.add('drag-clone');
        this.dragClone.style.width = rect.width + 'px';
        this.dragClone.style.left = rect.left + 'px';
        this.dragClone.style.top = rect.top + 'px';
        document.body.appendChild(this.dragClone);

        // Between-row indicator 
        this.betweenIndicator = document.createElement('div');
        this.betweenIndicator.className = 'between-indicator';
        document.body.appendChild(this.betweenIndicator);

        // Side indicator 
        this.sideIndicator = document.createElement('div');
        this.sideIndicator.className = 'side-indicator';
        document.body.appendChild(this.sideIndicator);

        // Fade original
        block.classList.add('block-dragging');
        document.body.style.userSelect = 'none';

        console.log(`🖐️ Dragging block ${block.dataset.blockId}`);
    }

    // ═══════════════════════════════════════════
    //  DRAG MOVE 
    // ═══════════════════════════════════════════
    onDragMove(clientX, clientY) {
        // Move clone
        if (this.dragClone) {
            this.dragClone.style.left = (clientX - this.offsetX) + 'px';
            this.dragClone.style.top = (clientY - this.offsetY) + 'px';
        }

        // Hide both indicators 
        this.betweenIndicator.style.display = 'none';
        this.sideIndicator.style.display = 'none';
        this.activeZone = null;

        const blocks = this.getBlocks();
        const containerRect = this.blocksContainer.getBoundingClientRect();

        // Check each block 
        for (const target of blocks) {
            if (target === this.draggedEl) continue;
            if (this.fullWidthOnly.has(target.dataset.blockType)) continue;

            const rect = target.getBoundingClientRect();

            if (clientX < rect.left || clientX > rect.right ||
                clientY < rect.top || clientY > rect.bottom) {
                continue; // Cursor not over this block
            }

            // 3-ZONE SPLIT 
            const edgeSize = Math.max(rect.height * 0.25, 24);

            if (clientY < rect.top + edgeSize) {
                // TOP EDGE -> insert above as full-width
                const refBlock = this.getRowStart(target, blocks);
                const lineY = rect.top;

                this.showBetweenIndicator(lineY, containerRect);
                this.activeZone = { type: 'between', refBlock: refBlock };

            } else if (clientY > rect.bottom - edgeSize) {
                // BOTTOM EDGE -> insert below as full-width
                const refBlock = this.getNextRowStart(target, blocks);
                const lineY = rect.bottom;

                this.showBetweenIndicator(lineY, containerRect);
                this.activeZone = { type: 'between', refBlock: refBlock };

            } else {
                // MIDDLE -> pair beside this block
                const midX = rect.left + rect.width / 2;
                const side = clientX < midX ? 'left' : 'right';

                this.showSideIndicator(rect, side);
                this.activeZone = { type: 'side', side: side, targetBlock: target };
            }
            return; 
        }

        // Below all blocks - > append at end 
        if (blocks.length > 0) {
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock !== this.draggedEl) {
                const lastRect = lastBlock.getBoundingClientRect();
                if (clientY > lastRect.bottom &&
                    clientX >= containerRect.left && clientX <= containerRect.right) {
                    this.showBetweenIndicator(lastRect.bottom + 4, containerRect);
                    this.activeZone = { type: 'between', refBlock: null };
                }
            }
        }
    }

    // ═══════════════════════════════════════════
    //  INDICATOR HELPERS
    // ═══════════════════════════════════════════
    showBetweenIndicator(y, containerRect) {
        this.betweenIndicator.style.display = 'block';
        this.betweenIndicator.style.top = (y - 2) + 'px';
        this.betweenIndicator.style.left = containerRect.left + 'px';
        this.betweenIndicator.style.width = containerRect.width + 'px';
    }

    showSideIndicator(blockRect, side) {
        const midX = blockRect.left + blockRect.width / 2;
        this.sideIndicator.style.display = 'block';
        this.sideIndicator.style.top = (blockRect.top + blockRect.height * 0.15) + 'px';
        this.sideIndicator.style.height = (blockRect.height * 0.7) + 'px';
        this.sideIndicator.style.left = (side === 'left' ? midX - 2 : midX) + 'px';
    }

    // ═══════════════════════════════════════════
    //  DRAG END
    // ═══════════════════════════════════════════
    endDrag() {
        if (this.activeZone) {
            this.executeDrop(this.activeZone);
        }
        this.cleanupDrag();
    }

    cancelDrag() {
        this.cleanupDrag();
    }

    cleanupDrag() {
        if (this.dragClone) { this.dragClone.remove(); this.dragClone = null; }
        if (this.betweenIndicator) { this.betweenIndicator.remove(); this.betweenIndicator = null; }
        if (this.sideIndicator) { this.sideIndicator.remove(); this.sideIndicator = null; }
        if (this.draggedEl) this.draggedEl.classList.remove('block-dragging');
        this.isDragging = false;
        this.draggedEl = null;
        this.activeZone = null;
        document.body.style.userSelect = '';
    }

    // ═══════════════════════════════════════════
    //  EXECUTE DROP
    // ═══════════════════════════════════════════
    executeDrop(zone) {
        const block = this.draggedEl;
        if (!block || !this.blocksContainer) return;

        if (zone.type === 'between') {
            block.remove();
            block.dataset.span = '2';

            if (zone.refBlock && zone.refBlock.parentNode === this.blocksContainer) {
                this.blocksContainer.insertBefore(block, zone.refBlock);
            } else {
                this.blocksContainer.appendChild(block);
            }
            this.fixOrphans();

        } else if (zone.type === 'side') {
            const target = zone.targetBlock;
            block.remove();

            block.dataset.span = '1';
            target.dataset.span = '1';

            if (zone.side === 'left') {
                this.blocksContainer.insertBefore(block, target);
            } else {
                const next = target.nextElementSibling;
                if (next) {
                    this.blocksContainer.insertBefore(block, next);
                } else {
                    this.blocksContainer.appendChild(block);
                }
            }
            this.fixOrphans();
        }

        this.updateCache();
        console.log(`✓ Dropped → ${zone.type}${zone.side ? '-' + zone.side : ''}`);
    }

    // ═══════════════════════════════════════════
    //  FIX ORPHANS
    // ═══════════════════════════════════════════
    fixOrphans() {
        const blocks = this.getBlocks();
        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].dataset.span !== '1') continue;
            const next = blocks[i + 1];
            if (next && next.dataset.span === '1') { i++; continue; }
            blocks[i].dataset.span = '2';
        }
    }

    // ═══════════════════════════════════════════
    //  ROW HELPERS
    // ═══════════════════════════════════════════
    parseRows(blocks) {
        const rows = [];
        let i = 0;
        while (i < blocks.length) {
            const span = parseInt(blocks[i].dataset.span) || 2;
            if (span === 1 && blocks[i + 1] && parseInt(blocks[i + 1].dataset.span) === 1) {
                rows.push({ blocks: [blocks[i], blocks[i + 1]] });
                i += 2;
            } else {
                rows.push({ blocks: [blocks[i]] });
                i++;
            }
        }
        return rows;
    }

    getRowStart(target, blocks) {
        const rows = this.parseRows(blocks);
        for (const row of rows) {
            if (row.blocks.includes(target)) return row.blocks[0];
        }
        return target;
    }

    getNextRowStart(target, blocks) {
        const rows = this.parseRows(blocks);
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].blocks.includes(target)) {
                return i + 1 < rows.length ? rows[i + 1].blocks[0] : null;
            }
        }
        return null;
    }

    // ═══════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════
    getBlocks() {
        if (!this.blocksContainer) return [];
        return Array.from(this.blocksContainer.querySelectorAll(':scope > .block'));
    }

    updateCache() {
        if (window.peelbackApp && window.peelbackApp.resultsManager) {
            window.peelbackApp.resultsManager.cacheBlocksHTML();
        }
    }

    // ═══════════════════════════════════════════
    //  MOCK BLOCKS HTML
    // ═══════════════════════════════════════════
    getMockData() {
        return [
            {
                type: 'title',
                data: { title: 'Understanding patient views and acceptability of predictive software in osteoporosis identification' }
            },
            {
                type: 'author',
                data: {
                    authors: [
                        { initials: 'FM', name: 'F. Manning', department: 'Department of Health and Care Professions', institution: 'University of Exeter Medical School, Exeter, UK' }
                    ]
                }
            },
            {
                type: 'publication_info',
                data: { published: '2023 (Radiography, Vol. 29)', doi: '10.1016/j.radi.2023.01.015' }
            },
            {
                type: 'sample_info',
                data: {
                    items: [
                        { label: 'Sample Size',   value: '14 participants' },
                        { label: 'Age Range',     value: '55-80 years'     },
                        { label: 'Gender Split',  value: '79% Female, 21% Male' },
                        { label: 'Study Type',    value: 'Qualitative (focus groups)' }
                    ]
                }
            },
            {
                type: 'summary',
                data: { heading: 'Summary', body: 'This study explored how patients feel about using predictive software to identify osteoporosis risk from routine X-rays. Researchers spoke with 14 people aged 55-80 who were already attending screening appointments.' }
            },
            {
                type: 'text_section',
                data: { heading: 'Concerns', body: 'Some participants worried about receiving an unexpected diagnosis through a screening tool they did not fully understand.' }
            },
            {
                type: 'stats',
                data: {
                    items: [
                        { label: 'Mean Age',           value: '69.5 years'        },
                        { label: 'Follow-up Duration', value: '18 months'         },
                        { label: 'Primary Outcome',    value: 'Fracture incidence' }
                    ]
                }
            },
            {
                type: 'key_findings',
                data: {
                    heading: 'Key Findings',
                    items: [
                        'Participants expressed concerns about receiving unexpected diagnoses without clinical context',
                        'Strong preference for healthcare professional to deliver and explain results',
                        'Benefits seen in early identification of osteoporosis risk through routine imaging'
                    ]
                }
            },
            {
                type: 'implications',
                data: { heading: 'What This Means for You', body: 'If you\'re having routine X-rays, this technology could help spot bone weakness early, giving you time to make changes or start treatment before a fracture happens.' }
            },
            {
                type: 'recommendations',
                data: {
                    heading: 'Recommendations',
                    items: [
                        'Discuss predictive screening options with your healthcare provider during your next appointment',
                        'Ask questions about how results would be delivered and explained',
                        'Consider lifestyle changes (calcium, vitamin D, exercise) if you\'re at risk for osteoporosis'
                    ]
                }
            }
        ];
    }

    // ═══════════════════════════════════════════
    //  EDIT / REMOVE
    // ═══════════════════════════════════════════
    toggleEdit(blockElement, editBtn) {
        if (!blockElement || blockElement.dataset.editable !== 'true') return;
        const content = blockElement.querySelector('.block-content');
        if (content.contentEditable === 'true') {
            content.contentEditable = 'false';
            editBtn.textContent = '✏️';
            this.updateCache();
        } else {
            content.contentEditable = 'true';
            editBtn.textContent = '💾';
            content.focus();
        }
    }

    removeBlock(blockElement) {
        if (!blockElement || blockElement.dataset.removable !== 'true') return;
        blockElement.style.opacity = '0';
        blockElement.style.transform = 'scale(0.95)';
        blockElement.style.transition = 'opacity 0.25s, transform 0.25s';
        setTimeout(() => {
            blockElement.remove();
            this.fixOrphans();
            this.updateCache();
        }, 250);
    }


    // ═══════════════════════════════════════════
    //  New Rendering System
    // ═══════════════════════════════════════════

    renderBlocks(blocksData) {
    if (!this.tabContent) return;

    const blocksHTML = blocksData
        .filter(({ type, data }) => this.BLOCK_SCHEMA[type] && data && typeof data === 'object')
        .map(({ type, data }, index) => this.buildBlockHTML(type, data, index + 1))
        .join('');

    this.tabContent.innerHTML = `
        <div class="blocks-container" id="blocksContainer">
            ${blocksHTML}
        </div>`;

    this.blocksContainer = document.getElementById('blocksContainer');
    this.reflowLayout();
    this.updateCache();
    console.log(`✓ Rendered ${blocksData.length} blocks`);
    }

    buildBlockHTML(type, data, id) {
    const schema = this.BLOCK_SCHEMA[type];
    const renderer = this.RENDERERS[type];

    let content = '';
    try {
        content = renderer ? renderer(data) : `<p>${JSON.stringify(data)}</p>`;
    } catch (err) {
        console.warn(`Renderer failed for block type "${type}":`, err);
        content = '<p>Content unavailable</p>';
    }

    const { editable, removable, cssClass } = schema;

    return `
        <div class="block ${cssClass}"data-block-id="${id}" data-block-type="${type}" data-editable="${editable}" data-removable="${removable}">
            <div class="block-header">
                ${type !== 'title' ? '<span class="drag-handle">⋮⋮</span>' : ''}
                ${editable  ? '<button class="btn-edit-block"  title="Edit">✏️</button>'   : ''}
                ${removable ? '<button class="btn-remove-block" title="Remove">✕</button>' : ''}
            </div>
            <div class="block-content" contenteditable="false">
                ${content}
            </div>
        </div>`;
    }
}