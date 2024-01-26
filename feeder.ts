import { createPublicClient, http, parseAbi, createWalletClient, defineChain } from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'

dotenv.config()

const mainnetFeedContracts = {
  'ETH-USD': '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419',
  'BTC-USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  'DAI-USD': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
}

const aggregatorContracts = {
  'ETH-USD': '0x2E246850207295e3676990b5c681351D8AE700cf',
}

const abi = parseAbi([
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function transmit(uint80 _roundId, int192 _answer, uint64 _timestamp) external',
  'function getRoundData(uint80 _roundId) public view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
])

// tanssi dancebox
const chain = defineChain({
  id: 5678,
  name: 'dancebox-evm-container',
  rpcUrls: {
    default: {
      http: ['https://fraa-dancebox-3001-rpc.a.dancebox.tanssi.network'],
    },
    public: {
      http: ['https://fraa-dancebox-3001-rpc.a.dancebox.tanssi.network'],
    }
  }
})

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

async function getLatestRoundData(pair: string) {
  const address = mainnetFeedContracts[pair]
  if (!address) {
    throw new Error(`${pair} mainnet feed contract did not exist.`)
  }
  const data = await publicClient.readContract({
    address,
    abi,
    functionName: 'latestRoundData',
  })
  return data
}

async function getRoundDataFromAggregator(pair: string, roundId: number) {
  const address = aggregatorContracts[pair]
  if (!address) {
    throw new Error(`${pair} aggregator contract did not exist.`)
  }
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  try {
    const data = await publicClient.readContract({
      address,
      abi,
      functionName: 'getRoundData',
      args: [roundId]
    })
    return data
  } catch {}
}

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('missing process.env.PRIVATE_KEY')
  }
  const pair = 'ETH-USD'
  if (!aggregatorContracts[pair]) {
    throw new Error(`${pair} aggregator contract did not exist.`)
  }
  const [roundId, answer, startedAt, updatedAt, answeredInRound] = await getLatestRoundData(pair)
  const aggregatorRoundId = Number(roundId & BigInt('0xFFFFFFFFFFFFFFFF'))
  const data = await getRoundDataFromAggregator(pair, aggregatorRoundId)
  if (data[1] === answer) {
    console.info(`aggregatorRoundId ${aggregatorRoundId} data exists: ${data}`)
    return
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)
  const walletClient = createWalletClient({
    chain,
    transport: http(),
    account,
  })
  const hash = await walletClient.writeContract({
    address: aggregatorContracts[pair],
    abi,
    functionName: 'transmit',
    args: [roundId, answer, startedAt]
  })
  console.info(`Done. Transmit tx hash: ${hash}`)
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})
