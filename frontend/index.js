import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";
import { Principal } from "@dfinity/principal";

let authClient;
let fileList = [];

async function init() {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        handleAuthenticated();
    }
}

async function login() {
    await authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: handleAuthenticated,
    });
}

async function handleAuthenticated() {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("file-section").style.display = "block";
    
    const isRegistered = await backend.isRegistered();
    if (!isRegistered) {
        await backend.registerUser();
    }
    
    await loadFiles();
}

async function loadFiles() {
    const fileListElement = document.getElementById("file-list");
    fileListElement.innerHTML = '<div class="loading">Loading your files...</div>';

    try {
        fileList = await backend.getFiles();
        displayFiles();
    } catch (error) {
        console.error("Failed to load files:", error);
        fileListElement.innerHTML = '<div class="error">Failed to load files. Please try again.</div>';
    }
}

function displayFiles() {
    const fileListElement = document.getElementById("file-list");
    fileListElement.innerHTML = "";
    
    if (fileList.length === 0) {
        fileListElement.innerHTML = '<div class="empty-state">You have no files. Upload some!</div>';
        return;
    }

    fileList.forEach((file) => {
        const fileElement = document.createElement("div");
        fileElement.className = "file-item";
        fileElement.innerHTML = `
            <span><i class="fas fa-file"></i> ${file.name}</span>
            <div class="file-actions">
                <button class="btn btn-small" onclick="downloadFile('${file.name}')"><i class="fas fa-download"></i></button>
                <button class="btn btn-small btn-danger" onclick="deleteFile('${file.name}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        fileListElement.appendChild(fileElement);
    });
}

async function uploadFile() {
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    const errorMessage = document.getElementById("error-message");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    errorMessage.textContent = "";

    if (!file) {
        errorMessage.textContent = "Please select a file to upload.";
        return;
    }

    progressContainer.style.display = "block";

    const fileExists = await backend.checkFileExists(file.name);
    if (fileExists) {
        errorMessage.textContent = `File "${file.name}" already exists. Please choose a different file name.`;
        progressContainer.style.display = "none";
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        const content = new Uint8Array(e.target.result);
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(content.length / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, content.length);
            const chunk = content.slice(start, end);

            await backend.uploadFileChunk(file.name, chunk, BigInt(i), BigInt(totalChunks), file.type);

            const progress = Math.round(((i + 1) / totalChunks) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Uploading ${file.name}: ${progress}%`;
        }

        await loadFiles();
        progressContainer.style.display = "none";
        fileInput.value = "";
    };

    reader.readAsArrayBuffer(file);
}

async function downloadFile(name) {
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressText.textContent = `Downloading ${name}: 0%`;

    try {
        const totalChunks = Number(await backend.getTotalChunks(name));
        const expectedFileSize = Number(await backend.getFileSize(name));
        const fileType = await backend.getFileType(name);
        let content = new Uint8Array(expectedFileSize);
        let offset = 0;

        for (let i = 0; i < totalChunks; i++) {
            const chunkBlob = await backend.getFileChunk(name, BigInt(i));
            if (chunkBlob) {
                const chunkArray = new Uint8Array(chunkBlob);
                content.set(chunkArray, offset);
                offset += chunkArray.length;
            } else {
                throw new Error(`Failed to retrieve chunk ${i} of file ${name}`);
            }

            const progress = Math.round(((i + 1) / totalChunks) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Downloading ${name}: ${progress}%`;
        }

        if (content.length !== expectedFileSize) {
            throw new Error(`File size mismatch. Expected: ${expectedFileSize}, Actual: ${content.length}`);
        }

        const blob = new Blob([content], { type: fileType || "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Download failed:", error);
        alert(`Failed to download ${name}: ${error.message}`);
    } finally {
        progressContainer.style.display = "none";
    }
}

async function deleteFile(name) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
        const success = await backend.deleteFile(name);
        if (success) {
            await loadFiles();
        } else {
            alert("Failed to delete file");
        }
    }
}

window.onload = () => {
    init();
    document.getElementById("login-button").onclick = login;
    document.getElementById("upload-button").onclick = uploadFile;
    window.downloadFile = downloadFile;
    window.deleteFile = deleteFile;
};
