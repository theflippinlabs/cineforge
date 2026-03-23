import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Wallet as WalletIcon,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Unlink,
  Plus,
  Sparkles,
  Lock,
  KeyRound,
  X,
  Copy,
  Smartphone,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import {
  connectBrowserWallet,
  linkWallet,
  getWallets,
  unlinkWallet,
  verifyNFTOwnership,
  getNFTAccessRules,
} from '../../lib/wallet';
import {
  createWCPairing,
  buildWalletDeepLink,
  isMobileBrowser,
  type WCPairing,
} from '../../lib/walletconnect';
import type { Wallet, NFTAccessRule } from '../../types';
import { cn } from '../../lib/utils';

// ─── WalletConnect Modal ───────────────────────────────────────────────────────

function WCModal({
  pairing,
  onClose,
  onConnected,
}: {
  pairing: WCPairing;
  onClose: () => void;
  onConnected: (address: string, chainId: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isMobile = isMobileBrowser();

  useEffect(() => {
    let cancelled = false;
    pairing.approve().then(({ address, chainId }) => {
      if (!cancelled) onConnected(address, chainId);
    }).catch(() => {
      if (!cancelled) onClose();
    });
    return () => { cancelled = true; };
  }, []);

  const copyUri = async () => {
    await navigator.clipboard.writeText(pairing.uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openDeepLink = (wallet: 'metamask' | 'defi' | 'trust') => {
    window.location.href = buildWalletDeepLink(wallet, pairing.uri);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { pairing.abort(); onClose(); } }}>
      <DialogContent className="max-w-sm bg-background border-border/60">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Connect with WalletConnect</DialogTitle>
        </DialogHeader>

        {isMobile ? (
          // Mobile: show deep link buttons to open wallet apps
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground text-center">
              Open your wallet app to connect. Make sure Cronos network is enabled.
            </p>
            <div className="space-y-2">
              {[
                { id: 'metamask' as const, label: 'MetaMask', sublabel: 'Supports Cronos via custom RPC' },
                { id: 'defi' as const, label: 'DeFi Wallet', sublabel: 'Crypto.com — native Cronos support' },
                { id: 'trust' as const, label: 'Trust Wallet', sublabel: 'Supports Cronos' },
              ].map(({ id, label, sublabel }) => (
                <button
                  key={id}
                  onClick={() => openDeepLink(id)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors p-3 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={copyUri}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy connection URI'}
            </button>
          </div>
        ) : (
          // Desktop: show QR code
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground text-center">
              Scan with your mobile wallet app. Make sure Cronos network is enabled.
            </p>
            <div className="flex justify-center">
              <div className="rounded-xl border border-border/40 bg-white p-4">
                <QRCodeSVG value={pairing.uri} size={220} />
              </div>
            </div>
            <button
              onClick={copyUri}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy URI'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground/50 pt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
          Waiting for wallet connection…
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { user, accessStatus, refreshAccessStatus } = useAuth();
  const location = useLocation();
  const nftRequired = (location.state as { nftRequired?: boolean } | null)?.nftRequired === true;

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [nftRules, setNftRules] = useState<NFTAccessRule[]>([]);
  const [nftStatuses, setNftStatuses] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [wcPairing, setWcPairing] = useState<WCPairing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) loadWallets();
    loadNftRules();
  }, [user?.id]);

  const loadNftRules = async () => {
    const rules = await getNFTAccessRules();
    setNftRules(rules);
  };

  const loadWallets = async () => {
    if (!user) return;
    const { data } = await getWallets(user.id);
    if (data) setWallets(data);
  };

  // Browser extension wallet (MetaMask desktop etc.)
  const handleConnectExtension = async () => {
    if (!user) return;
    setError(null);
    setConnecting(true);
    try {
      const result = await connectBrowserWallet();
      const { data, error } = await linkWallet(user.id, result.address, result.chainId);
      if (error) {
        setError(error.message);
      } else if (data) {
        setSuccess(`Wallet ${result.address.slice(0, 6)}...${result.address.slice(-4)} connected.`);
        await loadWallets();
        await refreshAccessStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet.');
    } finally {
      setConnecting(false);
    }
  };

  // WalletConnect
  const handleConnectWC = async () => {
    if (!user) return;
    setError(null);
    setConnecting(true);
    try {
      const pairing = await createWCPairing();
      setWcPairing(pairing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start WalletConnect session.');
    } finally {
      setConnecting(false);
    }
  };

  const handleWCConnected = useCallback(async (address: string, chainId: number) => {
    setWcPairing(null);
    if (!user) return;
    const { data, error } = await linkWallet(user.id, address, chainId);
    if (error) {
      setError(error.message);
    } else if (data) {
      setSuccess(`Wallet ${address.slice(0, 6)}...${address.slice(-4)} connected via WalletConnect.`);
      await loadWallets();
      await refreshAccessStatus();
    }
  }, [user]);

  const handleUnlink = async (walletId: string) => {
    if (!user) return;
    const { error } = await unlinkWallet(walletId, user.id);
    if (!error) {
      await loadWallets();
      await refreshAccessStatus();
    }
  };

  const handleVerify = async () => {
    if (!user || wallets.length === 0) return;
    setVerifying(true);
    setError(null);
    try {
      const allResults = await Promise.all(
        wallets.map((w) => verifyNFTOwnership(w.address, w.id))
      );
      const merged: Record<string, boolean> = {};
      for (const results of allResults) {
        for (const r of results) {
          merged[r.rule_id] = merged[r.rule_id] || r.is_eligible;
        }
      }
      setNftStatuses(merged);
      await refreshAccessStatus();
      const verifiedCount = Object.values(merged).filter(Boolean).length;
      setSuccess(
        verifiedCount > 0
          ? `Verification complete — ${verifiedCount} eligible collection${verifiedCount > 1 ? 's' : ''} found.`
          : 'Verification complete — no eligible NFTs found in connected wallets.'
      );
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const hasExtensionWallet = typeof window !== 'undefined' && !!window.ethereum;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* WalletConnect modal */}
      {wcPairing && (
        <WCModal
          pairing={wcPairing}
          onClose={() => setWcPairing(null)}
          onConnected={handleWCConnected}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Wallet & Access</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Cronos wallet and verify NFT ownership to unlock access.
        </p>
      </div>

      {/* NFT access required notice */}
      {nftRequired && !accessStatus?.nftVerified && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Accès réservé aux détenteurs du NFT</p>
            <p className="text-sm text-muted-foreground">
              Connectez votre wallet Cronos et vérifiez la possession du NFT pour accéder à la plateforme.
            </p>
          </div>
        </div>
      )}

      {/* Feedback */}
      {error && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-success/30 bg-success/5">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      {/* Access status card */}
      <Card className={cn('border', accessStatus?.nftVerified ? 'border-primary/30 bg-primary/3' : 'border-border/50 bg-card/40')}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                accessStatus?.nftVerified ? 'bg-primary/10 border border-primary/25' : 'bg-secondary border border-border'
              )}>
                {accessStatus?.nftVerified ? (
                  <Sparkles className="w-6 h-6 text-primary" />
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    {accessStatus?.nftVerified ? 'Accès débloqué' : 'Accès verrouillé'}
                  </h3>
                  <Badge className={cn('text-xs', accessStatus?.nftVerified ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-muted-foreground border-border')}>
                    {accessStatus?.nftVerified ? 'NFT Vérifié' : 'Non vérifié'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {accessStatus?.nftVerified
                    ? 'Vous avez accès complet à la plateforme Synema.'
                    : 'Connectez un wallet détenant le NFT Synema Access Pass sur Cronos.'}
                </p>
                {accessStatus?.nftVerified && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {accessStatus.unlockedFeatures.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs border-border/60 font-mono">
                        {feature.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {accessStatus?.nftVerified && (
              <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifying}>
                <RefreshCw className={cn('mr-2 h-3.5 w-3.5', verifying && 'animate-spin')} />
                {verifying ? 'Vérification...' : 'Rafraîchir'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connected wallets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground">Wallets connectés</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Wallets compatibles Cronos (EVM)</p>
          </div>
          <div className="flex items-center gap-2">
            {/* WalletConnect — works on mobile & desktop */}
            <Button
              size="sm"
              onClick={handleConnectWC}
              disabled={connecting}
              className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
            >
              {connecting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Connexion…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  WalletConnect
                </div>
              )}
            </Button>
            {/* Extension wallet — only show if available */}
            {hasExtensionWallet && (
              <Button size="sm" variant="outline" onClick={handleConnectExtension} disabled={connecting}>
                Extension
              </Button>
            )}
          </div>
        </div>

        {wallets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-10 text-center">
            <WalletIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">Aucun wallet connecté</p>
            <p className="text-xs text-muted-foreground/60 mb-5">
              Utilisez WalletConnect pour connecter MetaMask, DeFi Wallet, Trust Wallet ou tout wallet compatible Cronos.
            </p>
            <Button size="sm" onClick={handleConnectWC} disabled={connecting}>
              <WalletIcon className="mr-2 h-4 w-4" />
              Connecter via WalletConnect
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/40 p-4">
                <div className="w-9 h-9 rounded-lg bg-secondary/60 border border-border/40 flex items-center justify-center flex-shrink-0">
                  <WalletIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-medium text-foreground">
                      {truncateAddress(wallet.address)}
                    </p>
                    {wallet.is_primary && (
                      <Badge variant="outline" className="text-xs border-primary/20 text-primary">Principal</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{wallet.chain_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => window.open(`https://cronoscan.com/address/${wallet.address}`, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnlink(wallet.id)}
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifying} className="w-full">
              <Shield className={cn('mr-2 h-4 w-4', verifying && 'animate-spin')} />
              {verifying ? 'Vérification en cours…' : 'Vérifier la possession du NFT'}
            </Button>
          </div>
        )}
      </div>

      <Separator className="bg-border/40" />

      {/* Eligible collections */}
      <div>
        <div className="mb-5">
          <h2 className="font-semibold text-foreground">Collection éligible</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Détenir ce NFT sur Cronos débloque l'accès complet à la plateforme.
          </p>
        </div>

        {nftRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-8 text-center">
            <p className="text-sm text-muted-foreground">Aucune collection configurée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nftRules.map((rule) => {
              const hasBeenChecked = rule.id in nftStatuses;
              const isEligible = nftStatuses[rule.id] === true;
              return (
                <div
                  key={rule.id}
                  className={cn('flex items-start gap-4 rounded-xl border bg-card/30 p-4', isEligible ? 'border-primary/30' : 'border-border/40')}
                >
                  <div className={cn('w-10 h-10 rounded-lg border flex-shrink-0', isEligible ? 'bg-primary/10 border-primary/20' : 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/15')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{rule.collection_name || rule.name}</p>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        {rule.tier_unlocked}
                      </Badge>
                      {hasBeenChecked && (
                        isEligible ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success border border-success/20 rounded-full px-2 py-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Vérifié
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">Non détenu</span>
                        )
                      )}
                    </div>
                    {rule.description && <p className="text-xs text-muted-foreground mb-1">{rule.description}</p>}
                    <p className="text-xs font-mono text-muted-foreground/60">
                      {rule.contract_address} · {rule.chain} · {rule.token_standard}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
