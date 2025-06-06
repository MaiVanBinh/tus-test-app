const express = require('express');
const tus = require('./tusServer');

const app = express();
const port = 5000;

// Mount TUS server
app.use('/files', async (req, res) => {
 try {
    const a = await tus.handle(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).send('Internal Server Error');
  }
 
});

app.listen(port, () => {
  console.log(`🚀 Tus server running at http://localhost:${port}/files`);
});
