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
  await authClient.login({
    identityProvider: "https://identity.ic0.app/#authorize",
    onSuccess: handleAuthenticated,
  });
}

async function handleAuthenticated() {
  elements.authSection.style.display = "none";
  elements.fileSection.style.display = "block";
  
  if (!(await backend.isRegistered())) {
    await backend.registerUser();
  }
  
  await loadFiles();
}

async function loadFiles() {
  elements.fileList.innerHTML = '<div class="loading">Loading your files...</div>';

  try {
    fileList = await backend.getFiles();
    displayFiles();
  } catch (error) {
    console.error("Failed to load files:", error);
    elements.fileList.innerHTML = '<div class="error">Failed to load files. Please try again.</div>';
  }
}

function displayFiles() {
  elements.fileList.innerHTML = fileList.length === 0
    ? '<div class="empty-state">You have no files. Upload some!</div>'
    : fileList.map(createFileElement).join('');
}

function createFileElement(file) {
  return `
    <div class="file-item">
      <span><i class="fas fa-file"></i> ${file.name}</span>
      <div class="file-actions">
        <button class="btn btn-small" onclick="downloadFile('${file.name}')"><i class="fas fa-download"></i></button>
        <button class="btn btn-small btn-danger" onclick="deleteFile('${file.name}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;
}

async function uploadFile() {
  const file = elements.fileInput.files[0];
  elements.errorMessage.textContent = "";

  if (!file) {
    elements.errorMessage.textContent = "Please select a file to upload.";
    return;
  }

  elements.progressContainer.style.display = "block";

  if (await backend.checkFileExists(file.name)) {
    elements.errorMessage.textContent = `File "${file.name}" already exists. Please choose a different file name.`;
    elements.progressContainer.style.display = "none";
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

      updateProgress(file.name, (i + 1) / totalChunks);
    }

    await loadFiles();
    elements.progressContainer.style.display = "none";
    elements.fileInput.value = "";
  };

  reader.readAsArrayBuffer(file);
}

async function downloadFile(name) {
  elements.progressContainer.style.display = "block";
  updateProgress(name, 0);

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

      updateProgress(name, (i + 1) / totalChunks);
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
    elements.progressContainer.style.display = "none";
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

function updateProgress(fileName, progress) {
  const percentage = Math.round(progress * 100);
  elements.progressBar.style.width = `${percentage}%`;
  elements.progressText.textContent = `${fileName}: ${percentage}%`;
}

window.onload = () => {
  init();
  elements.loginButton.onclick = login;
  elements.uploadButton.onclick = uploadFile;
  window.downloadFile = downloadFile;
  window.deleteFile = deleteFile;
};
