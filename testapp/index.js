const express = require('express');
const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 5000;
const uploadDir = path.join(__dirname, 'uploads');

const corsOption = {
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
	allowedHeaders: ['Authorization', 'X-Requested-With', 'X-Request-ID', 'X-HTTP-Method-Override', 'Upload-Length', 'Upload-Offset', 'Tus-Resumable', 'Upload-Metadata', 'Upload-Defer-Length', 'Upload-Concat', 'User-Agent', 'Referrer', 'Origin', 'Content-Type', 'Content-Length'],
	exposeHeaders: ['Upload-Offset', 'Location', 'Upload-Length', 'Tus-Version', 'Tus-Resumable', 'Tus-Max-Size', 'Tus-Extension', 'Upload-Metadata', 'Upload-Defer-Length', 'Upload-Concat'],
	preflightContinue: false,
	optionsSuccessStatus: 200,
	maxAge: 86400, // 1 day
};

app.use(cors(corsOption));


// Custom store that renames the file on upload completion
class RenameOnCompleteStore extends FileStore {
  async write(req, id, offset) {
    const newOffset = await super.write(req, id, offset);

    const upload = await this.getUpload(id);
    if (upload.offset === upload.size) {
      const filename = upload.metadata.filename;
      const oldPath = path.join(this.directory, id);
      const newPath = path.join(this.directory, filename);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renamed ${id} -> ${filename}`);
      }
    }

    return newOffset;
  }
}

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Setup TUS server
const tus = new Server({
  path: '/files',
  datastore: new RenameOnCompleteStore({ directory: uploadDir }),
});

// Handle TUS requests at /files
app.options('/files', (req, res) => {
   // ✅ CORS HEADERS must be set manually BEFORE tus.handle()
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Tus-Resumable, Upload-Length, Upload-Metadata, Upload-Offset, Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Location, Upload-Offset, Upload-Length, Tus-Version, Tus-Extension, Tus-Max-Size');

  // ✅ Respond to preflight (OPTIONS) directly
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  tus.handle(req, res);
});

// ✅ Router under /ai-engines base path
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello from /ai-engines/ route!');
});

router.get('/upload', (req, res) => {
  res.send('This could be an upload UI under /ai-engines/upload');
});

// Mount router at /ai-engines
app.use('/ai-engines', router);

// Optional root route
app.get('/', (req, res) => {
  res.send('Welcome to the TUS server! Upload files at /files');
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${port}/`);
});
