import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";

let authClient;
let fileList = [];

const elements = {
    authSection: document.getElementById("auth-section"),
    fileSection: document.getElementById("file-section"),
    loginButton: document.getElementById("login-button"),
    uploadButton: document.getElementById("upload-button"),
    fileInput: document.getElementById("file-input"),
    fileList: document.getElementById("file-list"),
    errorMessage: document.getElementById("error-message"),
    progressContainer: document.getElementById("progress-container"),
    progressBar: document.getElementById("progress-bar"),
    progressText: document.getElementById("progress-text"),
};

async function init() {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        handleAuthenticated();
    }
}

async function login() {
    try {
        await authClient.login({
            identityProvider: "https://identity.ic0.app/#authorize",
            onSuccess: handleAuthenticated,
            onError: (error) => {
                console.error("Login error:", error);
                alert("Login failed. Please try again.");
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Please try again.");
    }
}

async function handleAuthenticated() {
    elements.authSection.style.display = "none";
    elements.fileSection.style.display = "block";

    if (!(await backend.isRegistered())) {
        await backend.registerUser();
    }

    await loadFiles();
}

// ... (rest of the code remains the same)

window.onload = () => {
    init();
    elements.loginButton.addEventListener("click", login); // Use addEventListener
    elements.uploadButton.onclick = uploadFile;
    window.downloadFile = downloadFile;
    window.deleteFile = deleteFile;
};

