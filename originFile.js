const express = require('express');
const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5001;

const uploadDir = path.join(__dirname, 'uploads');

class RenameOnCompleteStore extends FileStore {
  async write(req, id, offset) {
    const newOffset = await super.write(req, id, offset);
    console.log(`RenameOnCompleteStore at ${uploadDir}`);

    const upload = await this.getUpload(id);
    console.log(`Upload ID: ${id}, Offset: ${upload.offset}, Length: ${JSON.stringify(upload)}`);
    if (upload.offset === upload.size) {
      // Upload is complete!
      const filename = upload.metadata.filename;
      
      console.log(`Upload complete for ID: ${id}`, filename);

      const oldPath = path.join(this.directory, id);
      const newPath = path.join(this.directory, filename);
      console.log(`Renaming from ${oldPath} to ${newPath}`);
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renamed ${id} -> ${filename}`);
      }
    }

    return newOffset;
  }
}

// Tạo thư mục uploads nếu chưa có
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Tạo TUS server với FileStore
const tus = new Server({
  path: '/files',
  datastore: new RenameOnCompleteStore({ directory: uploadDir }),
});

// Mount TUS server
app.use('/files', (req, res) => {
  tus.handle(req, res);
});

app.get("/", (req, res) => {
  res.send("Welcome to the TUS server! Upload files at /files");
}
);
app.listen(port, () => {
  console.log(`🚀 Tus server running at http://localhost:${port}/files`);
});
