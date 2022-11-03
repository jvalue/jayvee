import express from 'express';

const app = express();
const port = 3000;
app.use(express.static('./public'));
app.listen(port, () => {
  console.log(`Jayvee Web IDE is available on http://localhost:${port}`);
});
