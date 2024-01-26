# Price Feed

## Usage

### Setup

```bash
# Install deps
yarn install

# Fill your wallet private key in the .env file
cp env.example .env
```

### Build and test

```bash
yarn build
yarn test
```

### Deploy

Firstly, you need to deploy the `OffchainAggregator` contract for a price feed, such as the ETH/USD pair.

```bash
yarn deploy
```

Then update the `aggregatorContracts` in the `feeder.ts` file, Update the deployed contract address to the corresponding pair aggregator address.

### Trigger price feed update

```bash
bun feeder.ts

# Or

npx tsx feeder.ts
```
