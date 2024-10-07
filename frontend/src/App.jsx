import React, { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { backend } from "../declarations/backend";
import FileList from './components/FileList';
import FileUpload from './components/FileUpload';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    const client = await AuthClient.create();
    setAuthClient(client);
    if (await client.isAuthenticated()) {
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
    setIsAuthenticated(true);
    const isRegistered = await backend.isRegistered();
    if (!isRegistered) {
      await backend.registerUser();
    }
    loadFiles();
  }

  function loadFiles() {
    const storedFiles = JSON.parse(localStorage.getItem("files") || "[]");
    setFiles(storedFiles);
  }

  function handleFileUpload(newFiles) {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    localStorage.setItem("files", JSON.stringify([...files, ...newFiles]));
  }

  function handleFileDelete(index) {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    localStorage.setItem("files", JSON.stringify(updatedFiles));
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h1>File Storage App</h1>
        <button onClick={login}>Login with Internet Identity</button>
      </div>
    );
  }

  return (
    <div>
      <h1>File Storage App</h1>
      <FileUpload onFileUpload={handleFileUpload} />
      <FileList files={files} onFileDelete={handleFileDelete} />
    </div>
  );
}

export default App;
