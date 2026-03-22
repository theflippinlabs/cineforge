import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface Props {
  title: string;
  description: string;
  requiredTier: 'pro' | 'premium' | 'nft_verified';
  onUpgrade?: () => void;
  className?: string;
  /** If true, renders as an overlay over existing content */
  overlay?: boolean;
}

const TIER_LABELS: Record<Props['requiredTier'], string> = {
  pro: 'Pro',
  premium: 'Premium',
  nft_verified: 'NFT Access',
};

export function LockedFeatureCard({ title, description, requiredTier, onUpgrade, className, overlay = false }: Props) {
  const tier = TIER_LABELS[requiredTier];

  if (overlay) {
    return (
      <div className={cn('absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl z-10', className)}>
        <div className="text-center px-6">
          <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
          <p className="text-xs text-muted-foreground mb-4">{description}</p>
          {onUpgrade && (
            <Button size="sm" variant="outline" onClick={onUpgrade}>
              Unlock with {tier}
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border border-border/40 bg-secondary/10 p-5',
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <span className="inline-flex items-center gap-1 text-xs bg-primary/8 text-primary border border-primary/20 rounded-full px-2 py-0.5">
              <Sparkles className="w-3 h-3" />
              {tier}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Unlock access
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
