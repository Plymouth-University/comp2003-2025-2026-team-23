/**
 * Upload Feature Module
 * Handles file upload via drag-and-drop and manual selection
 */

export class UploadManager {
    constructor() {
        this.uploadedFile = null;
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        this.uploadBox = document.getElementById('uploadBox');
        this.fileInput = document.getElementById('fileInput');
        this.manualUploadBtn = document.getElementById('manualUploadBtn');
        this.uploadStatus = document.getElementById('uploadStatus');
    }

    attachEventListeners() {
        // Manual upload button
        this.manualUploadBtn?.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFile(file);
        });

        // Drag and drop
        this.uploadBox?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadBox.classList.add('dragover');
        });

        this.uploadBox?.addEventListener('dragleave', () => {
            this.uploadBox.classList.remove('dragover');
        });

        this.uploadBox?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadBox.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) this.handleFile(file);
        });
    }

    handleFile(file) {
        // Validate file type
        const allowedTypes = [
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            this.showStatus('error', '❌ Invalid file type. PDF or DOCX only.');
            return;
        }

        // Validate size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showStatus('error', '❌ File too large. Max 10MB.');
            return;
        }

        this.uploadedFile = file;
        this.updateUIWithFile(file);
        this.showStatus('success', `✓ ${file.name} uploaded`);
        
        // Dispatch custom event for other modules
        document.dispatchEvent(new CustomEvent('fileUploaded', { 
            detail: { file } 
        }));
    }

    updateUIWithFile(file) {
        this.uploadBox.classList.add('has-file');
        this.uploadBox.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 10px;">✓</div>
            <p style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${file.name}</p>
            <p style="color: #666; font-size: 13px; margin-bottom: 15px;">${this.formatFileSize(file.size)}</p>
            <button class="btn-upload" id="resetUploadBtn">Upload Different File</button>
        `;

        // Re-attach reset listener
        document.getElementById('resetUploadBtn')?.addEventListener('click', () => {
            this.resetUpload();
        });
    }

    resetUpload() {
        this.uploadedFile = null;
        this.fileInput.value = '';
        this.uploadBox.classList.remove('has-file');
        this.uploadBox.innerHTML = `
            <p class="upload-text">Drag and drop to upload document</p>
            <p class="file-types">PDF or DOCX (max 10MB)</p>
            <p class="or-text">Or</p>
            <button class="btn-upload" id="manualUploadBtn">Upload file manually</button>
        `;
        this.uploadStatus.style.display = 'none';
        
        // Re-init after reset
        this.initElements();
        this.attachEventListeners();

        // Dispatch reset event
        document.dispatchEvent(new CustomEvent('fileUploadReset'));
    }

    showStatus(type, message) {
        this.uploadStatus.className = `upload-status ${type}`;
        this.uploadStatus.textContent = message;
        this.uploadStatus.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    getUploadedFile() {
        return this.uploadedFile;
    }
}