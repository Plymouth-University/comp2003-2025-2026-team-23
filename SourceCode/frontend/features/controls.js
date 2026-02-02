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
        this.updateSliderDisplay();

        // Initialize the track gradient
        if (this.complexitySlider) {
        this.complexitySlider.style.setProperty('--value', '50%');
        }
    }

    initElements() {
        this.audienceSelect = document.getElementById('audienceSelect');
        this.checkboxIcon = document.getElementById('checkboxIcon');
        this.complexitySlider = document.getElementById('complexitySlider');
        this.sliderValue = document.getElementById('sliderValue');
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
            this.updateSliderDisplay();

            // Update the track gradient to follow thumb
            const percentage = ((this.complexityLevel - 1) / 4) * 100;
            this.complexitySlider.style.setProperty('--value', `${percentage}%`);
            
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

    updateSliderDisplay() {
    if (this.sliderValue && this.complexitySlider) {
        const percentage = ((this.complexityLevel - 1) / 4) * 100;
        this.sliderValue.textContent = Math.round(percentage) + '%';
        
        const sliderRect = this.complexitySlider.getBoundingClientRect();
        const containerRect = this.complexitySlider.parentElement.getBoundingClientRect();
        
        if (sliderRect.width > 0 && containerRect.width > 0) {
            const relativeLeft = sliderRect.left - containerRect.left;
            const sliderWidth = sliderRect.width;
            const thumbPosition = relativeLeft + (sliderWidth * (percentage / 100));
            this.sliderValue.style.left = `${thumbPosition}px`;
            this.sliderValue.style.transform = 'translateX(-50%)';
        } else {
            // Initial load - center it
            this.sliderValue.style.left = '50%';
            this.sliderValue.style.transform = 'translateX(-50%)';
        }
        }
    }
}