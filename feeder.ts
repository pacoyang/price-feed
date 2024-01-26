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
  'ETH-USD': '0xA3C7DbCC80256AcFef360b7Bf25E1428E523468E',
}

const abi = parseAbi([
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
])

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

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('missing process.env.PRIVATE_KEY')
  }
  const pair = 'ETH-USD'
  if (!aggregatorContracts[pair]) {
    throw new Error(`${pair} aggregator contract did not exist.`)
  }
  const [roundId, answer, startedAt, updatedAt, answeredInRound] = await getLatestRoundData(pair)
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)
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
  const walletClient = createWalletClient({
    chain,
    transport: http(),
    account,
  })
  const hash = await walletClient.writeContract({
    address: aggregatorContracts[pair],
    abi: parseAbi([
      'function transmit(uint80 _roundId, int192 _answer, uint64 _timestamp) external'
    ]),
    functionName: 'transmit',
    args: [roundId, answer, startedAt]
  })
  console.info(`Done. Transmit tx hash: ${hash}`)
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})
