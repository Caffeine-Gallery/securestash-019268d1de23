import React from 'react';

function FileList({ files, onFileDelete }) {
  function downloadFile(file) {
    const link = document.createElement("a");
    link.href = file.content;
    link.download = file.name;
    link.click();
  }

  return (
    <div>
      <h2>Files</h2>
      {files.map((file, index) => (
        <div key={index}>
          {file.name}
          <button onClick={() => downloadFile(file)}>Download</button>
          <button onClick={() => onFileDelete(index)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default FileList;
