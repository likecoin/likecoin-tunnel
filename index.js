const express = require('express');
const EventMap = require('./util/EventMap');
const { startEthLoop } = require('./util/eth');

const BUFFER_SIZE = 200;

const ethData = new EventMap(BUFFER_SIZE);

/* likechain */
async function getLikeInfo() {
  return [6140198]; // restful call placeholder
}

async function init() {
  const lastBlocksProcessed = await getLikeInfo();
  const startBlock = Math.min(...lastBlocksProcessed) - BUFFER_SIZE;
  startEthLoop(ethData, startBlock);
}

/* web server */
const app = express();

app.get('/:id', (req, res) => {
  const payload = ethData.getEventData(req.params.id);
  if (!payload) res.sendStatus(404);
  res.json(payload);
});

app.get('/', (req, res) => {
  res.sendStatus(200);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

init();
