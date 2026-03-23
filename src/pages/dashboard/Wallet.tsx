import React, { useState, useEffect } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useAuth } from '../../contexts/AuthContext';
import {
  connectBrowserWallet,
  linkWallet,
  getWallets,
  unlinkWallet,
  verifyNFTOwnership,
  getNFTAccessRules,
} from '../../lib/wallet';
import type { Wallet, NFTAccessRule } from '../../types';
import { cn } from '../../lib/utils';

export default function WalletPage() {
  const { user, accessStatus, refreshAccessStatus } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [nftRules, setNftRules] = useState<NFTAccessRule[]>([]);
  const [nftStatuses, setNftStatuses] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
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

  const handleConnect = async () => {
    if (!user) return;
    setError(null);
    setConnecting(true);

    try {
      const result = await connectBrowserWallet();
      const { data, error } = await linkWallet(user.id, result.address, result.chainId);

      if (error) {
        setError(error.message);
      } else if (data) {
        setSuccess(`Wallet ${result.address.slice(0, 6)}...${result.address.slice(-4)} connected successfully.`);
        await loadWallets();
        await refreshAccessStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet.');
    } finally {
      setConnecting(false);
    }
  };

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
          // If any wallet holds the NFT, mark it eligible
          merged[r.rule_id] = merged[r.rule_id] || r.is_eligible;
        }
      }
      setNftStatuses(merged);
      await refreshAccessStatus();
      const verifiedCount = Object.values(merged).filter(Boolean).length;
      setSuccess(
        verifiedCount > 0
          ? `NFT verification complete. ${verifiedCount} eligible collection${verifiedCount > 1 ? 's' : ''} found.`
          : 'NFT verification complete. No eligible NFTs found in connected wallets.'
      );
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Wallet & Access</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your wallet and verify NFT ownership to unlock premium features.
        </p>
      </div>

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
      <Card className={cn(
        'border',
        accessStatus?.nftVerified
          ? 'border-primary/30 bg-primary/3'
          : 'border-border/50 bg-card/40'
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                accessStatus?.nftVerified
                  ? 'bg-primary/10 border border-primary/25'
                  : 'bg-secondary border border-border'
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
                    {accessStatus?.nftVerified ? 'Premium Access Active' : 'Free Tier'}
                  </h3>
                  <Badge
                    className={cn(
                      'text-xs',
                      accessStatus?.nftVerified
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-secondary text-muted-foreground border-border'
                    )}
                  >
                    {accessStatus?.nftVerified ? 'NFT Verified' : 'Free'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {accessStatus?.nftVerified
                    ? 'You have full access to all Synema features, unlimited generations, and priority rendering.'
                    : 'Connect a wallet holding a valid NFT to unlock premium features, or upgrade to Pro.'}
                </p>
                {accessStatus && (
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
                {verifying ? 'Verifying...' : 'Refresh'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connected wallets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground">Connected Wallets</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Ethereum-compatible wallets</p>
          </div>
          <Button size="sm" onClick={handleConnect} disabled={connecting} className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15">
            {connecting ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Connecting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                Connect Wallet
              </div>
            )}
          </Button>
        </div>

        {wallets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-10 text-center">
            <WalletIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No wallets connected</p>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Connect a MetaMask or compatible wallet to get started.
            </p>
            <Button size="sm" onClick={handleConnect} disabled={connecting} variant="outline">
              <WalletIcon className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/40 p-4"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary/60 border border-border/40 flex items-center justify-center flex-shrink-0">
                  <WalletIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-medium text-foreground">
                      {truncateAddress(wallet.address)}
                    </p>
                    {wallet.is_primary && (
                      <Badge variant="outline" className="text-xs border-primary/20 text-primary">Primary</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{wallet.chain_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
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
              {verifying ? 'Verifying NFT ownership...' : 'Verify NFT Ownership'}
            </Button>
          </div>
        )}
      </div>

      <Separator className="bg-border/40" />

      {/* Eligible collections */}
      <div>
        <div className="mb-5">
          <h2 className="font-semibold text-foreground">Eligible Collections</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Holding NFTs from these collections unlocks premium access.
          </p>
        </div>

        {nftRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-8 text-center">
            <p className="text-sm text-muted-foreground">No NFT collections configured yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nftRules.map((rule) => {
              const hasBeenChecked = rule.id in nftStatuses;
              const isEligible = nftStatuses[rule.id] === true;
              return (
                <div
                  key={rule.id}
                  className={cn(
                    'flex items-start gap-4 rounded-xl border bg-card/30 p-4',
                    isEligible ? 'border-primary/30' : 'border-border/40'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg border flex-shrink-0',
                    isEligible
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/15'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        {rule.collection_name || rule.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          rule.tier_unlocked === 'premium'
                            ? 'border-primary/30 text-primary'
                            : 'border-border text-muted-foreground'
                        )}
                      >
                        {rule.tier_unlocked}
                      </Badge>
                      {hasBeenChecked && (
                        isEligible ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success border border-success/20 rounded-full px-2 py-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">Not held</span>
                        )
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-xs text-muted-foreground mb-1">{rule.description}</p>
                    )}
                    <p className="text-xs font-mono text-muted-foreground/60">
                      {rule.contract_address} · {rule.chain} · {rule.token_standard}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!accessStatus?.nftVerified && (
          <div className="mt-6 rounded-xl border border-border/40 bg-card/20 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Don't hold an eligible NFT? Upgrade to Pro for monthly access.
            </p>
            <Button variant="outline" size="sm">
              View Pro Plans
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
