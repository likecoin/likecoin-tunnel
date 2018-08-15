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
    try {
      const blockNumbers = await updateLikeInfo();
      if (blockNumbers && blockNumbers.length) {
        const DROP_BLOCK_LIMIT = 1000;
        const dropThersold = Math.min(...lastBlocksProcessed) + DROP_BLOCK_LIMIT;
        pendingDatas = pendingDatas.filter((e) => {
          /* remove completed blockIds from pending */
          const stay = (!blockNumbers.includes(e.blockNumber)
          /* remove not cached from pending */
          && !!ethData.getEventData(e.blockNumber)
          /* remove outsync data from pending */
          && e.blockNumber > dropThersold);
          return stay;
        });
      }
      const POST_LIMIT = 2;
      const postEvents = pendingDatas.slice(0, POST_LIMIT);
      for (let i = 0; i < postEvents.length; i += 1) {
        const payload = postEvents[i];
        /* eslint-disable-next-line no-await-in-loop */
        await postLikeInfo(payload.blockNumber, payload.events);
      }
    } catch (err) {
      console.error(err);
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
