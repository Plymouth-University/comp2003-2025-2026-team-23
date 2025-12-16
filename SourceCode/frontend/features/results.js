/**
 * Results Feature Module
 * Handles display of simplified content with tabs
 */

export class ResultsManager {
    constructor() {
        this.currentTab = 'tab1';
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.tabs = document.querySelectorAll('.tab');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.tabContent = document.querySelector('.tab-content');
    }

    attachEventListeners() {
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Listen for processing completion
        document.addEventListener('processingComplete', () => {
            this.loadDefaultContent();
        });
    }

    switchTab(tabName) {
        // Update active state
        this.tabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        this.currentTab = tabName;
        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        // TODO: Load actual content from backend
        console.log('Loading content for:', tabName);
        
        // Placeholder - will be replaced with real data
        this.tabContent.innerHTML = `
            <h2>Results for ${tabName}</h2>
            <p>Content will be loaded from the backend API.</p>
        `;
    }

    loadDefaultContent() {
        // Load initial results
        this.tabContent.innerHTML = `
            <h2>Results Section</h2>
            <p>Your simplified paper content will appear here.</p>
            <p>Each tab contains a different section of the analysis.</p>
        `;
    }
}