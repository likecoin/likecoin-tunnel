const express = require('express');
const EventMap = require('./util/EventMap');
const { startEthLoop } = require('./util/eth');
const {
  getLikeInfo,
  updateLikeInfo,
  postLikeInfo,
} = require('./util/like');

const BUFFER_SIZE = 200;

const ethData = new EventMap(BUFFER_SIZE);
let pendingDatas = [];

/* logic */
async function init() {
  const lastBlocksProcessed = await getLikeInfo();
  const startBlock = Math.min(...lastBlocksProcessed) - BUFFER_SIZE;
  const endBlock = Math.max(...lastBlocksProcessed);

  startEthLoop(ethData, startBlock, endBlock, (events) => {
    /* on new event handle, events is list of blockId + event obj */
    pendingDatas = pendingDatas.concat(events);
  });

  /* likechain update loop */
  setInterval(async () => {
    const blockNumbers = await updateLikeInfo();
    /* remove completed blockIds from pending */
    pendingDatas = pendingDatas.filter(e => !blockNumbers.includes(e.blockNumber));
    const POST_LIMIT = 2;
    const postEvents = pendingDatas.slice(0, POST_LIMIT);
    for (let i = 0; i < postEvents.length; i +=1 ) {
      const payload = pendingDatas[i];
      await postLikeInfo(payload.blockNumber, payload.events);
    }
  }, 5000);
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
