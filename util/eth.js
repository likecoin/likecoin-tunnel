const Web3 = require('web3');
const LIKECOIN = require('../constant/contract/likecoin');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
// const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
const LikeCoin = new web3.eth.Contract(LIKECOIN.LIKE_COIN_ABI, LIKECOIN.LIKE_COIN_ADDRESS);

const CONFIRM_BLOCKS = 24;
const ETH_LOOP_INTERVAL = 5000;

let lastBlock = 0;
let isLooping = true;

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getBlockEvents(fromBlock = 0, toBlock = 'latest') {
  console.log(`ETH: Checking ${fromBlock} to ${toBlock}`);
  return LikeCoin.getPastEvents('Transfer', {
    filter: {
      // to: '0x6A9e2dE467097B4D14F44944aC2a49A750Fc93b8',
      from: '0x65b8E5D9d95e707349789E42fa2f88EE5B20B072',
    },
    fromBlock,
    toBlock,
  });
}

function handleEventsIntoMap(ethDataMap, events) {
  const map = events.reduce((acc, e) => {
    const { blockNumber, returnValues } = e;
    const { from, to, value } = returnValues;
    if (!acc[blockNumber]) acc[blockNumber] = [];
    acc[blockNumber].push({ from, to, value });
    return acc;
  }, {});
  const output = [];
  Object.keys(map).forEach((key) => {
    const blockNumber = Number(key); // want number for blockNumber
    map[blockNumber].sort((a, b) => {
      if (a.from !== b.from) return a.from > b.from ? 1 : -1;
      // only sort by string
      if (a.value !== b.value) return a.value > b.value ? 1 : -1;
      return 0;
    });
    ethDataMap.setEventData(blockNumber, map[blockNumber]);
    output.push({ blockNumber, events: map[blockNumber] });
  });
  output.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber > b.blockNumber ? 1 : -1;
    }
    return 0;
  });
  return output;
}

async function startEthLoop(ethDataMap, startBlock, endBlock, newEventCallback) {
  lastBlock = startBlock;
  try {
    const events = await getBlockEvents(startBlock, endBlock);
    handleEventsIntoMap(ethDataMap, events);
    lastBlock = endBlock;
  } catch (err) {
    console.error(err);
  }

  /* eslint-disable no-await-in-loop */
  while (isLooping) {
    try {
      const currentBlock = await web3.eth.getBlockNumber() - CONFIRM_BLOCKS;
      if (currentBlock > lastBlock) {
        const events = await getBlockEvents(lastBlock + 1, currentBlock);
        const newEvents = handleEventsIntoMap(ethDataMap, events);
        if (newEvents && newEventCallback && typeof newEventCallback === 'function') {
          newEventCallback(newEvents);
        }
        lastBlock = currentBlock;
      }
    } catch (err) {
      console.error(err);
    }
    await timeout(ETH_LOOP_INTERVAL);
  }
  /* eslint-enable no-await-in-loop */
}

function stopEthLoop() {
  isLooping = false;
}

module.exports = {
  web3,
  LikeCoin,
  getBlockEvents,
  startEthLoop,
  stopEthLoop,
};
