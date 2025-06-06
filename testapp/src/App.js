import React, { useState } from 'react';
import { Upload } from 'tus-js-client';

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setProgress(0);
  };

  const handleUpload = () => {
    if (!file) return;
    // access token 

    setUploading(true);
    console.log('Starting upload for:', file.name, file.size);
    const upload = new Upload(file, {
    endpoint: 'https://dev-api-ee.mymy.io/upload_v2/v1/auth/v2', // 👈 Địa chỉ endpoint của TUS server
    retryDelays: [0, 1000, 3000, 5000],
    uploadSize: file.size,
    chunkSize: 5 * 1024 * 1024, // 👈 Bắt buộc để dùng Upload-Length
    headers: {
      'access_token': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibG9naW5OYW1lIjoic2FkbWluIiwiZGlzcGxheU5hbWUiOiJTdXBlciBBZG1pbmlzdHJhdG9yIiwiZW1haWwiOiJzYWRtaW5AZ21haWwuY29tIiwidHlwZSI6NSwicGVybWlzc2lvbiI6MTMxMDcxLCJpYXQiOjE3NDA0Nzk3NDUsImV4cCI6MzMyNzY0Nzk3NDV9.aQYZCjeSthhzG1hUtbhmwe83-3ugyCNM0plrCmusJ9o"
    },
  
    metadata: {
      filename: file.name,
      filetype: file.type,
      fileLastModifiedDate: file.lastModified.toString(), // send as string
    categoryId: '12345' // your custom value
    },
    onError(error) {
      console.error('Upload failed:', error);
      setUploading(false);
    },
    onProgress(bytesUploaded, bytesTotal) {
      const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
      setProgress(percentage);
    },
    onSuccess() {
      console.log('Upload finished:', upload.url);
      setUploading(false);
      alert('Upload complete!');
    },
  });

    upload.start();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🚀 Upload file with tus-js-client</h1>
      <input type="file" onChange={handleFileChange} />
      <br /><br />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      <br /><br />
      {uploading && <p>Progress: {progress}%</p>}
    </div>
  );
}

export default App;
