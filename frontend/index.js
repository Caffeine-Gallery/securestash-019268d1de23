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
  
  loadFiles();
}

async function loadFiles() {
  fileList = await backend.getFiles();
  displayFiles();
}

function displayFiles() {
  const fileListElement = document.getElementById("file-list");
  fileListElement.innerHTML = "";
  fileList.forEach((file, index) => {
    const fileElement = document.createElement("div");
    fileElement.className = "file-item";
    fileElement.innerHTML = `
      <span>${file.name}</span>
      <div class="file-actions">
        <button class="btn btn-small" onclick="downloadFile('${file.name}')">Download</button>
        <button class="btn btn-small btn-danger" onclick="deleteFile('${file.name}')">Delete</button>
      </div>
    `;
    fileListElement.appendChild(fileElement);
  });
}

async function uploadFiles() {
  const fileInput = document.getElementById("file-input");
  const files = fileInput.files;
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  progressContainer.style.display = "block";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = new Uint8Array(e.target.result);
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(content.length / chunkSize);

      for (let j = 0; j < totalChunks; j++) {
        const start = j * chunkSize;
        const end = Math.min(start + chunkSize, content.length);
        const chunk = content.slice(start, end);

        await backend.uploadFileChunk(file.name, chunk, j, totalChunks);

        const progress = Math.round(((j + 1) / totalChunks) * 100);
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Uploading ${file.name}: ${progress}%`;
      }
    };

    reader.readAsArrayBuffer(file);
  }

  await loadFiles();
  progressContainer.style.display = "none";
  fileInput.value = "";
  updateFileLabel();
}

async function downloadFile(name) {
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = `Downloading ${name}: 0%`;

  const totalChunks = await backend.getTotalChunks(name);
  let content = new Uint8Array(0);

  for (let i = 0; i < totalChunks; i++) {
    const chunk = await backend.getFileChunk(name, i);
    content = new Uint8Array([...content, ...chunk]);

    const progress = Math.round(((i + 1) / totalChunks) * 100);
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Downloading ${name}: ${progress}%`;
  }

  const blob = new Blob([content], { type: "application/octet-stream" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();

  progressContainer.style.display = "none";
}

async function deleteFile(name) {
  const success = await backend.deleteFile(name);
  if (success) {
    await loadFiles();
  } else {
    alert("Failed to delete file");
  }
}

function updateFileLabel() {
  const fileInput = document.getElementById("file-input");
  const fileLabel = document.getElementById("file-label");
  if (fileInput.files.length > 0) {
    if (fileInput.files.length === 1) {
      fileLabel.textContent = fileInput.files[0].name;
    } else {
      fileLabel.textContent = `${fileInput.files.length} files selected`;
    }
  } else {
    fileLabel.textContent = "Choose Files";
  }
}

window.onload = () => {
  init();
  document.getElementById("login-button").onclick = login;
  document.getElementById("upload-button").onclick = uploadFiles;
  document.getElementById("file-input").onchange = updateFileLabel;
  window.downloadFile = downloadFile;
  window.deleteFile = deleteFile;
};
