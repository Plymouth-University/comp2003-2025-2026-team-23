/**
 * Request Controller
 * Handles requests to the backend server
 */

export class RequestManager {
    constructor() {
        this.isRequesting = false;
        this.backendServerURL = "http://127.0.0.1:3000/api"; // Currently hardcoded
    }

    // Function to ping and return whether or not the ping was successful
    async ping() {
        let response = null;
        try {
            response = await fetch(this.backendServerURL + "/ping");
            return response.ok;
        } catch {
            return false;
        }
    }

    requestSimplification() {

    }
}
