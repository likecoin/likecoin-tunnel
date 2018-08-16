# LikeCoin Tunnel

[![CircleCI](https://circleci.com/gh/likecoin/likecoin-tunnel.svg?style=svg)](https://circleci.com/gh/likecoin/likecoin-tunnel)

Sync between LikeChain and Ethereum chain.

## Development Setup

The suggested way of development environment is docker based. This guide will
assume you have Docker Community Edition 18+ installed. Please download it at
[https://store.docker.com](https://store.docker.com) and follow the
installation instruction.

After you setup docker, run the following command to setup the docker images
 and also kick start the docker container for development.

``` bash
# Build the docker images, run it for the first time or if you have dependency
# updates
docker-compose build

# Kick off the development setup
docker-compose up
```

Local files are mount into docker you can modify file in your fs.

## Test

``` bash
npm run test
```
