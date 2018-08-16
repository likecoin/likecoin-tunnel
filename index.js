const express = require('express');
const EventMap = require('./util/EventMap');
const { startEthLoop } = require('./util/eth');
const {
  getLikeInfo,
  updateLikeInfo,
  postLikeInfo,
} = require('./util/like');

const ETH_MAP_SIZE = process.env.ETH_MAP_SIZE || 200;
const LIKE_DROP_BLOCK_LIMIT = process.env.LIKE_DROP_BLOCK_LIMIT || 1000;
const LIKE_POST_LIMIT = process.env.LIKE_POST_LIMIT || 2;
const LIKE_LOOP_INTERVAL = process.env.LIKE_LOOP_INTERVAL || 5000;

const ethData = new EventMap(ETH_MAP_SIZE);
let pendingDatas = [];

/* logic */
async function init() {
  const lastBlocksProcessed = await getLikeInfo();
  const startBlock = Math.min(...lastBlocksProcessed) - ETH_MAP_SIZE;
  const endBlock = Math.max(...lastBlocksProcessed);

  startEthLoop(ethData, startBlock, endBlock, (events) => {
    /* on new event handle, events is list of blockId + event obj */
    pendingDatas = pendingDatas.concat(events);
  });

  /* likechain update loop */
  setInterval(async () => {
    try {
      const blockNumbers = await updateLikeInfo();
      if (blockNumbers && blockNumbers.length) {
        const dropThersold = Math.min(...lastBlocksProcessed) + LIKE_DROP_BLOCK_LIMIT;
        pendingDatas = pendingDatas.filter(e => (
          /* remove completed blockIds from pending */
          !blockNumbers.includes(e.blockNumber)
          /* remove not cached from pending */
          && !!ethData.getEventData(e.blockNumber)
          /* remove outsync data from pending */
          && e.blockNumber > dropThersold
        ));
      }
      const postEvents = pendingDatas.slice(0, LIKE_POST_LIMIT);
      for (let i = 0; i < postEvents.length; i += 1) {
        const payload = postEvents[i];
        /* eslint-disable-next-line no-await-in-loop */
        await postLikeInfo(payload.blockNumber, payload.events);
      }
    } catch (err) {
      console.error(err);
    }
  }, LIKE_LOOP_INTERVAL);
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
