/**
 * Results Feature Module
 * Handles display of simplified content with tabs
 */
export class ResultsManager {
    constructor() {
        this.currentTab = 'tab1';
        this.apiData = {}; // Initialize API data
        this.blocksHTML = null; // Cache the blocks HTML
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.tabs = document.querySelectorAll('.tab');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.tabContent = document.querySelector('.tab-content');  
        this.emptyState = document.getElementById('emptyState'); // initialize
    }

    attachEventListeners() {
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Listen for processing completion
        document.addEventListener('processingComplete', (e) => {
            this.apiData = e.detail;
        });
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update active state
        this.tabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');

        this.currentTab = tabName;
        
        // Load appropriate content
        if (tabName === 'tab1') {
            this.showSummaryTab();
        } else {
            this.loadTabContent(tabName);
        }
    }

    showSummaryTab() {
        console.log('📋 Showing Summary tab (tab1)...');
        console.log('Cached blocks HTML exists?', !!this.blocksHTML);
        
        // Restore cached blocks if they exist
        if (this.blocksHTML) {
            console.log('✓ Restoring cached blocks');
            this.tabContent.innerHTML = this.blocksHTML;
            
            // Re-initialize blocks functionality
            if (window.peelbackApp && window.peelbackApp.blocksManager) {
                window.peelbackApp.blocksManager.reinitialize();
            }
        } else {
            console.warn('⚠ No cached blocks found');
            // No blocks yet, show placeholder
            this.tabContent.innerHTML = `
                <p style="text-align: center; color: #6B7280; padding: 40px;">
                    Processing results will appear here...
                </p>
            `;
        }
    }

    // Cache the blocks HTML so we can restore it later
    cacheBlocksHTML() {
        const blocksContainer = document.getElementById('blocksContainer');
        if (blocksContainer) {
            this.blocksHTML = this.tabContent.innerHTML;
            console.log('✓ Cached blocks HTML');
        }
    }

    loadTabContent(tabName) {
        console.log('Loading content for:', tabName);

        let content = "";

        switch (tabName) {
            case "tab2":
                content = `
                    <div style="padding: 40px; text-align: center; color: #6B7280;">
                        <h2 style="margin-bottom: 16px;">Key Points</h2>
                        <p>Content for Key Points tab coming soon...</p>
                    </div>
                `;
                break;

            case "tab3":
                content = `
                    <div style="padding: 40px; text-align: center; color: #6B7280;">
                        <h2 style="margin-bottom: 16px;">Recommendations</h2>
                        <p>Content for Recommendations tab coming soon...</p>
                    </div>
                `;
                break;

            default:
                content = `<p style="padding: 40px;">Unknown tab: ${tabName}</p>`;
        }

        this.tabContent.innerHTML = content;
    }
}