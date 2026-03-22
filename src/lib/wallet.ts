import { supabase } from './supabase';
import type { Wallet, WalletNFTStatus, AccessStatus, NFTAccessRule } from '../types';

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  137: 'Polygon',
  42161: 'Arbitrum One',
  8453: 'Base',
  10: 'Optimism',
};

// ─── Wallet Management ────────────────────────────────────────────────────────

export async function linkWallet(
  userId: string,
  address: string,
  chainId: number = 1
): Promise<{ data: Wallet | null; error: Error | null }> {
  const { data: existing } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .eq('address', address.toLowerCase())
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('wallets')
      .update({ chain_id: chainId, chain_name: CHAIN_NAMES[chainId] ?? 'Unknown' })
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error: error ? new Error(error.message) : null };
  }

  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: userId,
      address: address.toLowerCase(),
      chain_id: chainId,
      chain_name: CHAIN_NAMES[chainId] ?? 'Unknown',
      is_primary: true,
    })
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function getWallets(userId: string): Promise<{ data: Wallet[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('linked_at', { ascending: false });
  return { data, error: error ? new Error(error.message) : null };
}

export async function unlinkWallet(walletId: string, userId: string) {
  const { error } = await supabase
    .from('wallets')
    .delete()
    .eq('id', walletId)
    .eq('user_id', userId);
  return { error };
}

// ─── NFT Verification ─────────────────────────────────────────────────────────

export async function getNFTAccessRules(): Promise<NFTAccessRule[]> {
  const { data } = await supabase
    .from('nft_access_rules')
    .select('*')
    .eq('is_active', true);
  return data ?? [];
}

export async function verifyNFTOwnership(
  walletAddress: string,
  _chainId: number = 1
): Promise<WalletNFTStatus[]> {
  // Production: replace with real on-chain RPC or NFT indexer (Alchemy, Moralis)
  const rules = await getNFTAccessRules();
  return rules.map((rule) => ({
    id: `mock-${rule.id}`,
    wallet_id: walletAddress,
    rule_id: rule.id,
    is_eligible: false,
    token_ids: [],
    last_verified_at: new Date().toISOString(),
    rule,
  }));
}

export async function getWalletNFTStatus(walletId: string): Promise<WalletNFTStatus[]> {
  const { data } = await supabase
    .from('wallet_nft_status')
    .select('*, nft_access_rules(*)')
    .eq('wallet_id', walletId);
  return data ?? [];
}

// ─── Access Tier Resolution ────────────────────────────────────────────────────

export async function resolveAccessStatus(userId: string): Promise<AccessStatus> {
  // Fetch wallets and check NFT eligibility in two parallel queries
  const [walletsResult, eligibilityResult] = await Promise.all([
    supabase.from('wallets').select('id, address').eq('user_id', userId),
    supabase
      .from('wallet_nft_status')
      .select('wallet_id, wallets!inner(user_id)')
      .eq('wallets.user_id', userId)
      .eq('is_eligible', true)
      .limit(1),
  ]);

  const wallets = walletsResult.data ?? [];
  const hasWallet = wallets.length > 0;
  const nftVerified = (eligibilityResult.data?.length ?? 0) > 0;

  const FREE_LIMIT = 5;

  return {
    tier: nftVerified ? 'nft_verified' : 'free',
    walletConnected: hasWallet,
    nftVerified,
    unlockedFeatures: nftVerified
      ? ['hd_export', 'unlimited_generations', 'priority_queue', 'all_styles', 'brand_overlay']
      : ['preview_generation'],
    generationsRemaining: nftVerified ? 999 : FREE_LIMIT,
    generationsTotal: nftVerified ? 999 : FREE_LIMIT,
  };
}

// ─── Wallet Connection (Browser) ──────────────────────────────────────────────

export interface WalletConnectionResult {
  address: string;
  chainId: number;
  chainName: string;
}

export async function connectBrowserWallet(): Promise<WalletConnectionResult> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum wallet detected. Install MetaMask or another Web3 wallet.');
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
  if (!accounts.length) throw new Error('No accounts returned from wallet.');

  const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' }) as string;
  const chainId = parseInt(chainIdHex, 16);

  return {
    address: accounts[0],
    chainId,
    chainName: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,
  };
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
