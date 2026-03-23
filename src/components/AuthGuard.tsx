import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Film } from 'lucide-react';

// Pages accessible without NFT verification (so users can connect wallet)
const NFT_EXEMPT_PATHS = ['/dashboard/wallet', '/dashboard/settings'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, accessStatus } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // NFT gate: only verified holders and admins can access the dashboard
  // Fail open if accessStatus couldn't be loaded (null)
  const isExemptPath = NFT_EXEMPT_PATHS.includes(location.pathname);
  const hasNFTAccess =
    !accessStatus ||
    accessStatus.nftVerified ||
    accessStatus.tier === 'admin';

  if (!hasNFTAccess && !isExemptPath) {
    return <Navigate to="/dashboard/wallet" state={{ nftRequired: true }} replace />;
  }

  return <>{children}</>;
}
