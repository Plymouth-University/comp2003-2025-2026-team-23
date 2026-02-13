/**
 * Results Feature Module
 * Handles display of simplified content with tabs
 */
export class ResultsManager {
    constructor() {
        this.currentTab = 'tab1';
        this.apiData = {}; // Initialize API data
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.tabs = document.querySelectorAll('.tab');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.tabContent = document.getElementById('tabContent');
        this.emptyState = document.getElementById('emptyState'); // initialize
    }

    attachEventListeners() {
        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Listen for processing completion
        document.addEventListener('processingComplete', (e) => {
            this.setApiData(e.detail);
            this.loadTabContent(this.currentTab);
        });
    }

    setApiData(data) {
        // Defensive: ensure data has the expected structure
        this.apiData = {
            summary: data.summary || "",
            key_points: Array.isArray(data.key_points) ? data.key_points : [],
            recommendations: Array.isArray(data.recommendations) ? data.recommendations : []
        };

        if (this.resultsContainer) this.resultsContainer.style.display = 'flex';
        if (this.emptyState) this.emptyState.style.display = 'none';
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
        console.log('Loading content for:', tabName);

        if (!this.apiData) {
            this.tabContent.innerHTML = `<p>No data available. Please upload a paper first.</p>`;
            return;
        }

        let content = "";

        switch (tabName) {
            case "tab1":
                content = `<h2>Summary</h2><p>${this.apiData.summary}</p>`;
                break;

            case "tab2":
                if (this.apiData.key_points.length) {
                    content = `<h2>Key Points</h2><ul>${this.apiData.key_points.map(p => `<li>${p}</li>`).join('')}</ul>`;
                } else {
                    content = "<p>No key points available.</p>";
                }
                break;

            case "tab3":
                if (this.apiData.recommendations.length) {
                    content = `<h2>Recommendations</h2><ul>${this.apiData.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`;
                } else {
                    content = "<p>No recommendations available.</p>";
                }
                break;

            default:
                content = `<p>Unknown tab: ${tabName}</p>`;
        }

        this.tabContent.innerHTML = content;
    }

    loadDefaultContent() {
        this.tabContent.innerHTML = `
            <h2>Results Section</h2>
            <p>Your simplified paper content will appear here.</p>
            <p>Each tab contains a different section of the analysis.</p>
        `;
    }
}
