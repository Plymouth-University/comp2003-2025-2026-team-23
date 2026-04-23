/**
 * Request Controller
 * Handles requests to the backend server
 */

import { settings } from "../settings.js";

export class RequestManager {
    constructor() {
        this.backendServerURL = settings.backendURL;
        this.fileReader = new FileReader();
    }

    // Function to ping and return whether or not the ping was successful
    // Returns true if successful, false if not
    async ping() {
        let response = null;
        try {
            response = await fetch(this.backendServerURL + "/ping");
            return response.ok;
        } catch {
            return false;
        }
    }

    // Sends the uploaded file to the backend server to request simplificaton
    async requestSimplification() {
        // Prevent empty files
        if (peelbackApp.getUploadedFile() == null) {
            return false;
        }

        // ADDED: prevent request if audience not selected
        if (!peelbackApp.getSelectedAudience()) {
            console.error("No audience selected");
            return false;
        }

        // Populate FormData
        const formData = new FormData();

        // REQUIRED by backend
        formData.append("task", "medical_summary");

        // CHANGED: use selected audience from ControlsManager
        formData.append("audience", peelbackApp.getSelectedAudience());

        // ADDED: send complexity (1–5 from slider)
        formData.append("complexity", peelbackApp.getComplexityLevel());

        formData.append("sentPDF", peelbackApp.getUploadedFile());

        let response = null;
        try {
            response = await fetch(this.backendServerURL + "/prompt",{
                method: "POST",
                body: formData
            });

            const text = await response.text();
            console.log("Raw response:", text);
            const parsed = JSON.parse(text);

            if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
                console.error("Unexpected response shape:", parsed);
                return false;
            }

            return parsed
        } catch {
            return false;
        }
    }
}