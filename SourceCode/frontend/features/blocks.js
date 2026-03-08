/**
 * Blocks Feature Module
 * Handles content blocks with drag-drop, edit, and remove
 */

export class BlocksManager {
    constructor() {
        // State tracking
        this.state = {
            originalBlocks: [],
            removedBlocks: [],
            editedBlocks: {},
            blockOrder: []
        };
        
        this.sortable = null; // Track sortable instance
        this.listenersAttached = false; // Prevent duplicate listeners
        
        this.initElements();
        this.setupGlobalListeners(); // Attach once on construction
        console.log('✓ BlocksManager initialized');
    }

    initElements() {
        this.tabContent = document.getElementById('tabContent');
        this.blocksContainer = null; // Will be created when needed
    }

    // Attach listeners ONCE globally (not on every reinit)
    setupGlobalListeners() {
        if (this.listenersAttached) return;
        
        // Edit block buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-edit-block')) {
                const block = e.target.closest('.block');
                this.toggleEdit(block, e.target);
            }
            
            // Remove block buttons
            if (e.target.classList.contains('btn-remove-block')) {
                const block = e.target.closest('.block');
                this.removeBlock(block);
            }
        });
        
        this.listenersAttached = true;
        console.log('✓ Global event listeners attached');
    }

    // Load mock blocks when processing completes
    loadMockBlocks() {
        console.log('📦 Loading mock blocks...');
        
        // Create blocks HTML
        const blocksHTML = this.getMockBlocksHTML();
        
        // Insert into tab content
        if (this.tabContent) {
            this.tabContent.innerHTML = blocksHTML;
            this.blocksContainer = document.getElementById('blocksContainer');
            
            // Initialize drag-drop
            this.initDragDrop();
            
            // Cache the HTML in ResultsManager
            if (window.peelbackApp && window.peelbackApp.resultsManager) {
                window.peelbackApp.resultsManager.cacheBlocksHTML();
                console.log('✓ Blocks cached in ResultsManager');
            } else {
                console.warn('⚠ ResultsManager not found - blocks not cached');
            }
            
            console.log('✓ Mock blocks loaded');
        }
    }

    // Re-initialize blocks after tab switch
    reinitialize() {
        console.log('🔄 Reinitializing blocks...');
        
        this.blocksContainer = document.getElementById('blocksContainer');
        
        if (!this.blocksContainer) {
            console.warn('Blocks container not found during reinit');
            return;
        }
        
        // Re-initialize drag-drop (event listeners are global, don't re-attach)
        this.initDragDrop();
        
        console.log('✓ Blocks reinitialized');
    }

    initDragDrop() {
        if (!this.blocksContainer) {
            console.warn('Blocks container not found');
            return;
        }

        // Destroy existing sortable instance if it exists
        if (this.sortable) {
            this.sortable.destroy();
            console.log('🗑️ Destroyed previous Sortable instance');
        }

        // Initialize new SortableJS instance
        this.sortable = Sortable.create(this.blocksContainer, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'ghost',
            dragClass: 'dragging',
            filter: '.title-block',
            onEnd: (evt) => {
                console.log(`✓ Block moved from position ${evt.oldIndex} to ${evt.newIndex}`);
                // Update cache after reordering
                this.updateCache();
            }
        });

        console.log('✓ Drag-and-drop enabled');
    }

    // Update cached HTML after changes
    updateCache() {
        if (window.peelbackApp && window.peelbackApp.resultsManager) {
            window.peelbackApp.resultsManager.cacheBlocksHTML();
            console.log('✓ Cache updated after change');
        }
    }

    getMockBlocksHTML() {
        return `
            <div class="blocks-container" id="blocksContainer">
                
                <!-- 1. Title Block -->
                <div class="block title-block" data-block-id="1" data-block-type="title" data-editable="false" data-removable="false">
                    <div class="block-content">
                        <h1 class="block-title">Understanding patient views and acceptability of predictive software in osteoporosis identification</h1>
                    </div>
                </div>

                <!-- 2. Author Block -->
                <div class="block author-block" data-block-id="2" data-block-type="author" data-editable="false" data-removable="false">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                    </div>
                    <div class="block-content">
                        <img src="https://via.placeholder.com/80/6366F1/FFFFFF?text=FM" alt="F. Manning" class="author-photo">
                        <div class="author-info">
                            <h4>F. Manning</h4>
                            <p>Department of Health and Care Professions</p>
                            <p>University of Exeter Medical School, Exeter, UK</p>
                        </div>
                    </div>
                </div>

                <!-- 3. Publication Info Block -->
                <div class="block publication-block" data-block-id="3" data-block-type="publication_info" data-editable="false" data-removable="true">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                        <button class="btn-remove-block" title="Remove">✕</button>
                    </div>
                    <div class="block-content">
                        <div class="pub-item">
                            <span class="pub-label">Published:</span>
                            <span class="pub-value">2023 (Radiography, Vol. 29)</span>
                        </div>
                        <div class="pub-item">
                            <span class="pub-label">DOI:</span>
                            <span class="pub-value">10.1016/j.radi.2023.01.015</span>
                        </div>
                    </div>
                </div>

                <!-- 4. Sample Info Block -->
                <div class="block sample-info-block" data-block-id="4" data-block-type="sample_info" data-editable="false" data-removable="true">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                        <button class="btn-remove-block" title="Remove">✕</button>
                    </div>
                    <div class="block-content">
                        <div class="sample-grid">
                            <div class="sample-item">
                                <span class="sample-label">Sample Size</span>
                                <span class="sample-value">14 participants</span>
                            </div>
                            <div class="sample-item">
                                <span class="sample-label">Age Range</span>
                                <span class="sample-value">55-80 years</span>
                            </div>
                            <div class="sample-item">
                                <span class="sample-label">Gender Split</span>
                                <span class="sample-value">79% Female, 21% Male</span>
                            </div>
                            <div class="sample-item">
                                <span class="sample-label">Study Type</span>
                                <span class="sample-value">Qualitative (focus groups)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. Summary Block -->
                <div class="block summary-block" data-block-id="5" data-block-type="summary" data-editable="true" data-removable="true">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                        <button class="btn-edit-block" title="Edit">✏️</button>
                        <button class="btn-remove-block" title="Remove">✕</button>
                    </div>
                    <div class="block-content" contenteditable="false">
                        <h3>Summary</h3>
                        <p>This study explored how patients feel about using predictive software to identify osteoporosis risk from routine X-rays. Researchers spoke with 14 people aged 55-80 who were already attending screening appointments. While participants saw benefits in catching bone problems early, they were concerned about getting unexpected results without proper explanation from a healthcare professional.</p>
                    </div>
                </div>

                <!-- 6. Text Section - Concerns -->
                <div class="block text-block" data-block-id="6" data-block-type="text_section" data-editable="true" data-removable="true">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                        <button class="btn-edit-block" title="Edit">✏️</button>
                        <button class="btn-remove-block" title="Remove">✕</button>
                    </div>
                    <div class="block-content" contenteditable="false">
                        <h3>Concerns</h3>
                        <p>Some participants worried about receiving an unexpected diagnosis through a screening tool they did not fully understand. There was concern that results delivered without explanation could cause anxiety or confusion, especially if the finding was serious or unexpected.</p>
                    </div>
                </div>

                <!-- 7. Stats Block -->
                <div class="block stats-block" data-block-id="7" data-block-type="stats" data-editable="true" data-removable="true">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                        <button class="btn-edit-block" title="Edit">✏️</button>
                        <button class="btn-remove-block" title="Remove">✕</button>
                    </div>
                    <div class="block-content" contenteditable="false">
                        <h3>Key Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Response Rate</span>
                                <span class="stat-value">87%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Mean Age</span>
                                <span class="stat-value">67.5 years</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Follow-up Duration</span>
                                <span class="stat-value">18 months</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Primary Outcome</span>
                                <span class="stat-value">Fracture incidence</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 8. Key Findings Block -->
                <div class="block findings-block" data-block-id="8" data-block-type="key_findings" data-editable="true" data-removable="true">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                        <button class="btn-edit-block" title="Edit">✏️</button>
                        <button class="btn-remove-block" title="Remove">✕</button>
                    </div>
                    <div class="block-content" contenteditable="false">
                        <h3>Key Findings</h3>
                        <ul>
                            <li>Participants expressed concerns about receiving unexpected diagnoses without clinical context</li>
                            <li>Strong preference for healthcare professional to deliver and explain results</li>
                            <li>Benefits seen in early identification of osteoporosis risk through routine imaging</li>
                        </ul>
                    </div>
                </div>

                <!-- 9. Implications Block -->
                <div class="block implications-block" data-block-id="9" data-block-type="implications" data-editable="true" data-removable="true">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                        <button class="btn-edit-block" title="Edit">✏️</button>
                        <button class="btn-remove-block" title="Remove">✕</button>
                    </div>
                    <div class="block-content" contenteditable="false">
                        <h3>What This Means for You</h3>
                        <p>If you're having routine X-rays, this technology could help spot bone weakness early, giving you time to make changes or start treatment before a fracture happens. However, it's important that results are explained clearly by a healthcare professional who can answer your questions and discuss next steps with you.</p>
                    </div>
                </div>

                <!-- 10. Recommendations Block -->
                <div class="block recommendations-block" data-block-id="10" data-block-type="recommendations" data-editable="true" data-removable="true">
                    <div class="block-header">
                        <span class="drag-handle">⋮⋮</span>
                        <button class="btn-edit-block" title="Edit">✏️</button>
                        <button class="btn-remove-block" title="Remove">✕</button>
                    </div>
                    <div class="block-content" contenteditable="false">
                        <h3>Recommendations</h3>
                        <ul>
                            <li>Discuss predictive screening options with your healthcare provider during your next appointment</li>
                            <li>Ask questions about how results would be delivered and explained</li>
                            <li>Consider lifestyle changes (calcium, vitamin D, exercise) if you're at risk for osteoporosis</li>
                        </ul>
                    </div>
                </div>

            </div>
        `;
    }

    toggleEdit(blockElement, editBtn) {
        const content = blockElement.querySelector('.block-content');
        const blockId = blockElement.dataset.blockId;
        const isEditable = blockElement.dataset.editable === 'true';
        
        if (!isEditable) {
            console.warn(`Block ${blockId} is not editable`);
            return;
        }
        
        const isEditing = content.contentEditable === 'true';
        
        if (isEditing) {
            content.contentEditable = 'false';
            editBtn.textContent = '✏️';
            editBtn.title = 'Edit';
            console.log(`✓ Saved edits for block ${blockId}`);
            // Update cache after edit
            this.updateCache();
        } else {
            content.contentEditable = 'true';
            editBtn.textContent = '💾';
            editBtn.title = 'Save';
            content.focus();
            console.log(`✏️ Editing block ${blockId}`);
        }
    }

    removeBlock(blockElement) {
        const blockId = blockElement.dataset.blockId;
        const blockType = blockElement.dataset.blockType;
        const isRemovable = blockElement.dataset.removable === 'true';
        
        if (!isRemovable) {
            console.warn(`Block ${blockId} cannot be removed`);
            return;
        }
        
        console.log(`🗑️ Removing block ${blockId} (${blockType})`);
        
        blockElement.style.opacity = '0';
        blockElement.style.transform = 'translateX(100px)';
        
        setTimeout(() => {
            blockElement.remove();
            console.log(`✓ Block ${blockId} removed`);
            // Update cache after removal
            this.updateCache();
        }, 300);
    }
}