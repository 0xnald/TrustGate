export const SUPPORTED_CHAINS = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
  },
} as const;

/** Deployed contract addresses — Sepolia & Mainnet
 *  NOTE: After running scripts/fix-acl-permissions.ts, update the Sepolia
 *  trustScoring address with the newly deployed contract address.
 */
export const CONTRACT_ADDRESSES: Record<
  number,
  { trustScoring: string; payGramCore: string; payGramToken: string }
> = {
  [SUPPORTED_CHAINS.sepolia.chainId]: {
    trustScoring: "0x1DacB05d09435b2d9dBf56761487177dB893d0f5",
    payGramToken: "0xA8b4Fa823A2c0551F95bC61a8CbeE0fcD9c0a896",
    payGramCore: "0x2b8037E8480DB5B4DFb19EA332Db667A6c6cC0Dc",
  },
  [SUPPORTED_CHAINS.mainnet.chainId]: {
    trustScoring: "0xaa3ae25ebac250ff67f4d9e3195c4c7610055067",
    payGramToken: "0x41fa55cefd625e50fa1ae08baea87ac5c8be0ad7",
    payGramCore: "0xDC41FF140129846f7a2e63A5CcE73e9d767CB4e1",
  },
};

export const TRUST_TIERS = {
  HIGH: {
    min: 75,
    label: "High Trust",
    color: "green",
    icon: "shield-check",
    description: "Instant encrypted transfer",
  },
  MEDIUM: {
    min: 40,
    label: "Medium Trust",
    color: "yellow",
    icon: "clock",
    description: "24-hour delayed release",
  },
  LOW: {
    min: 0,
    label: "Low Trust",
    color: "red",
    icon: "lock",
    description: "Milestone-gated escrow",
  },
} as const;

export type TrustTier = keyof typeof TRUST_TIERS;

export const PAYMENT_STATUS = {
  0: "None",
  1: "Instant",
  2: "Delayed",
  3: "Escrowed",
  4: "Released",
  5: "Completed",
} as const;

export const DELAY_PERIOD_SECONDS = 24 * 60 * 60; // 24 hours
