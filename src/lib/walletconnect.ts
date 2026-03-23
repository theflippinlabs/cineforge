import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import type { AppKitNetwork } from '@reown/appkit/networks';

const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

// Cronos Mainnet (chain ID 25)
const cronos: AppKitNetwork = {
  id: 25,
  name: 'Cronos',
  nativeCurrency: { name: 'CRO', symbol: 'CRO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm.cronos.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronoscan', url: 'https://cronoscan.com' },
  },
};

let _kit: ReturnType<typeof createAppKit> | null = null;

export function getAppKit(): ReturnType<typeof createAppKit> {
  if (_kit) return _kit;

  if (!PROJECT_ID) {
    throw new Error(
      'WalletConnect project ID manquant. Ajoutez VITE_WALLETCONNECT_PROJECT_ID dans votre .env. ' +
      'Obtenez un ID gratuit sur https://cloud.walletconnect.com'
    );
  }

  _kit = createAppKit({
    adapters: [new EthersAdapter()],
    networks: [cronos],
    projectId: PROJECT_ID,
    metadata: {
      name: 'Synema',
      description: 'AI Video Generation Platform',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.ico`],
    },
    features: {
      analytics: false,
      email: false,
      socials: false,
    },
    themeMode: 'dark',
  });

  return _kit;
}
