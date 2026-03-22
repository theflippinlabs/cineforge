import { Sparkles, Lock, Shield } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import type { AccessStatus } from '../types';

interface Props {
  accessStatus: AccessStatus | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const TIER_CONFIG = {
  guest: { label: 'Guest', icon: Lock, className: 'bg-secondary text-muted-foreground border-border' },
  free: { label: 'Free', icon: Lock, className: 'bg-secondary text-muted-foreground border-border' },
  nft_verified: { label: 'NFT Verified', icon: Sparkles, className: 'bg-primary/10 text-primary border-primary/25' },
  pro: { label: 'Pro', icon: Shield, className: 'bg-primary/10 text-primary border-primary/25' },
  premium: { label: 'Premium', icon: Sparkles, className: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  enterprise: { label: 'Enterprise', icon: Shield, className: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
  admin: { label: 'Admin', icon: Shield, className: 'bg-red-500/10 text-red-400 border-red-500/25' },
} as const;

export function NFTAccessBadge({ accessStatus, size = 'md', showLabel = true }: Props) {
  const tier = accessStatus?.tier ?? 'free';
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const Icon = config.icon;

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 font-medium', textSize, config.className)}
    >
      <Icon className={iconSize} />
      {showLabel && config.label}
    </Badge>
  );
}
