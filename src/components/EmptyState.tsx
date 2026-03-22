import { type LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface Action {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: Action[];
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, actions = [], className, compact = false }: Props) {
  return (
    <div className={cn(
      'rounded-xl border border-dashed border-border/40 bg-secondary/5 text-center',
      compact ? 'p-8' : 'p-16',
      className
    )}>
      <div className={cn(
        'rounded-full bg-secondary/30 border border-border/40 flex items-center justify-center mx-auto',
        compact ? 'w-10 h-10 mb-3' : 'w-14 h-14 mb-5'
      )}>
        <Icon className={cn('text-muted-foreground/40', compact ? 'w-5 h-5' : 'w-7 h-7')} />
      </div>

      <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm mb-0.5' : 'text-base mb-1.5')}>
        {title}
      </h3>

      {description && (
        <p className={cn('text-muted-foreground mx-auto', compact ? 'text-xs max-w-xs' : 'text-sm max-w-sm')}>
          {description}
        </p>
      )}

      {actions.length > 0 && (
        <div className={cn('flex items-center justify-center gap-2 flex-wrap', compact ? 'mt-4' : 'mt-6')}>
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.label}
                size={compact ? 'sm' : 'sm'}
                variant={action.variant ?? 'outline'}
                onClick={action.onClick}
              >
                {ActionIcon && <ActionIcon className="mr-2 h-3.5 w-3.5" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
