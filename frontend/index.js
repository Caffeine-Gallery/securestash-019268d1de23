import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";

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

function loadFiles() {
  fileList = JSON.parse(localStorage.getItem("files") || "[]");
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
        <button class="btn btn-small" onclick="downloadFile(${index})">Download</button>
        <button class="btn btn-small btn-danger" onclick="deleteFile(${index})">Delete</button>
      </div>
    `;
    fileListElement.appendChild(fileElement);
  });
}

function uploadFiles() {
  const fileInput = document.getElementById("file-input");
  const files = fileInput.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (e) => {
      fileList.push({
        name: file.name,
        type: file.type,
        content: e.target.result
      });
      localStorage.setItem("files", JSON.stringify(fileList));
      displayFiles();
    };
    reader.readAsDataURL(file);
  }
  fileInput.value = "";
}

function downloadFile(index) {
  const file = fileList[index];
  const link = document.createElement("a");
  link.href = file.content;
  link.download = file.name;
  link.click();
}

function deleteFile(index) {
  fileList.splice(index, 1);
  localStorage.setItem("files", JSON.stringify(fileList));
  displayFiles();
}

window.onload = () => {
  init();
  document.getElementById("login-button").onclick = login;
  document.getElementById("upload-button").onclick = uploadFiles;
  window.downloadFile = downloadFile;
  window.deleteFile = deleteFile;
};
