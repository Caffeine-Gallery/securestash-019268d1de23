import React from 'react';

function FileUpload({ onFileUpload }) {
  function handleFileChange(event) {
    const files = event.target.files;
    const newFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        newFiles.push({
          name: file.name,
          type: file.type,
          content: e.target.result
        });
        if (newFiles.length === files.length) {
          onFileUpload(newFiles);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} multiple />
    </div>
  );
}

export default FileUpload;
