const express = require('express');
var proxy = require('express-http-proxy');
const app = express();
const port = 8080;

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.get('/test', (req, res) => {
  res.send('Test!');
})

app.use('/proxy', proxy('http://internal-tf-lb-20201005221956071000000001-1260404789.sa-east-1.elb.amazonaws.com'));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})