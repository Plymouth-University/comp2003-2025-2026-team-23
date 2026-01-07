/**
 * Controls Feature Module
 * Handles audience selection and complexity slider
 */

export class ControlsManager {
    constructor() {
        this.selectedAudience = null;
        this.complexityLevel = 3;
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.audienceSelect = document.getElementById('audienceSelect');
        this.checkboxIcon = document.getElementById('checkboxIcon');
        this.complexitySlider = document.getElementById('complexitySlider');
    }

    attachEventListeners() {
        // Audience selection
        this.audienceSelect?.addEventListener('change', (e) => {
            this.selectedAudience = e.target.value;
            
            if (this.selectedAudience) {
                this.checkboxIcon.classList.add('checked');
            } else {
                this.checkboxIcon.classList.remove('checked');
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('audienceChanged', {
                detail: { audience: this.selectedAudience }
            }));
        });

        // Complexity slider
        this.complexitySlider?.addEventListener('input', (e) => {
            this.complexityLevel = parseInt(e.target.value);
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('complexityChanged', {
                detail: { complexity: this.complexityLevel }
            }));
        });
    }

    getSelectedAudience() {
        return this.selectedAudience;
    }

    getComplexityLevel() {
        return this.complexityLevel;
    }

    getComplexityLabel() {
        const labels = ['Very Simple', 'Simple', 'Moderate', 'Detailed', 'Very Detailed'];
        return labels[this.complexityLevel - 1];
    }
}