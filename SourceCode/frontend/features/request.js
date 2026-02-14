/**
 * Request Controller
 * Handles requests to the backend server
 */

import { settings } from "../settings";

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

        // Populate FormData
        const formData = new FormData();
        formData.append("audience", "patient");
        formData.append("simplification", 5);
        formData.append("sentPDF", peelbackApp.getUploadedFile());

        let response = null;
        try {
            response = await fetch(this.backendServerURL + "/prompt",{
                method: "POST",
                //headers: {"Content-Type":"multipart/form-data"},
                //body: JSON.stringify({"audience":"", "simplification":-1 , "file":0})
                body: formData
            });
            console.log(response);
            return response.text();
        } catch {
            return false;
        }
    }
}
