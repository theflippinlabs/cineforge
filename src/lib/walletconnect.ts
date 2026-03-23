import SignClient from '@walletconnect/sign-client';

const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

// Cronos mainnet (chain ID 25) is the target chain for NFT verification
const REQUIRED_NAMESPACES = {
  eip155: {
    methods: ['eth_accounts', 'eth_chainId'],
    chains: ['eip155:25'],
    events: ['accountsChanged', 'chainChanged'],
  },
};

let _client: SignClient | null = null;

async function getSignClient(): Promise<SignClient> {
  if (_client) return _client;

  if (!PROJECT_ID) {
    throw new Error(
      'WalletConnect project ID not configured. Add VITE_WALLETCONNECT_PROJECT_ID to your .env file. ' +
      'Get a free project ID at https://cloud.walletconnect.com'
    );
  }

  _client = await SignClient.init({
    projectId: PROJECT_ID,
    metadata: {
      name: 'Synema',
      description: 'AI Video Generation Platform — NFT gated access',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://synemalabs.xyz',
      icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : ''],
    },
  });

  return _client;
}

export interface WCPairing {
  uri: string;
  /** Call to wait for the user to approve in their wallet. Resolves with address + chainId. */
  approve: () => Promise<{ address: string; chainId: number }>;
  /** Call to abort the pairing. */
  abort: () => void;
}

export async function createWCPairing(): Promise<WCPairing> {
  const client = await getSignClient();

  const { uri, approval } = await client.connect({
    requiredNamespaces: REQUIRED_NAMESPACES,
  });

  if (!uri) throw new Error('Failed to generate WalletConnect pairing URI.');

  let aborted = false;
  let rejectApproval: (() => void) | null = null;

  return {
    uri,
    approve: () =>
      new Promise<{ address: string; chainId: number }>((resolve, reject) => {
        rejectApproval = () => reject(new Error('Connection cancelled.'));
        if (aborted) { reject(new Error('Connection cancelled.')); return; }

        approval()
          .then((session) => {
            if (aborted) { reject(new Error('Connection cancelled.')); return; }
            const accounts = session.namespaces.eip155?.accounts ?? [];
            if (!accounts.length) { reject(new Error('No accounts returned from wallet.')); return; }
            const parts = accounts[0].split(':');
            const chainId = parseInt(parts[1], 10);
            const address = parts[2];
            resolve({ address, chainId });
          })
          .catch(reject);
      }),
    abort: () => {
      aborted = true;
      rejectApproval?.();
    },
  };
}

/** Deep link builders for common wallets (mobile only) */
export function buildWalletDeepLink(wallet: 'metamask' | 'defi' | 'trust', wcUri: string): string {
  const encoded = encodeURIComponent(wcUri);
  switch (wallet) {
    case 'metamask':
      return `metamask://wc?uri=${encoded}`;
    case 'defi':
      // Crypto.com DeFi Wallet
      return `cryptowallet://wc?uri=${encoded}`;
    case 'trust':
      return `trust://wc?uri=${encoded}`;
  }
}

export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
