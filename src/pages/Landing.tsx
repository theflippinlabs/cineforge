import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wand2,
  Music,
  Layers,
  Zap,
  Shield,
  Download,
  Play,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Sparkles,
  Film,
  SlidersHorizontal,
  Clock,
  Globe,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PublicLayout } from '../components/layout/PublicLayout';
import { LogoMark } from '../components/LogoMark';
import { cn } from '../lib/utils';

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(204_100%_60%_/_0.12),transparent)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(hsl(204 100% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(204 100% 60%) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="animate-slide-up">
          <div className="flex justify-center mb-8">
            <LogoMark className="w-16 h-16" />
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8">
            <span className="text-gradient-cinematic">Turn music into</span>
            <br />
            <span className="text-foreground">cinematic motion.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
            Generate premium visual clips from audio, prompts, and creative direction —
            with speed, control, and style.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-12 text-base shadow-lg shadow-primary/20"
              onClick={() => navigate('/auth/signup')}
            >
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border/60 text-foreground h-12 px-8 text-base"
              onClick={() => navigate('/auth/login')}
            >
              <Play className="mr-2 h-4 w-4" />
              See Demo
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['E', 'M', 'R', 'K'].map((i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium text-foreground">
                    {i}
                  </div>
                ))}
              </div>
              <span>Trusted by 2,400+ artists</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Real-time generation</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>NFT-gated access</span>
            </div>
          </div>
        </div>

        {/* Demo UI mockup */}
        <div className="mt-24 max-w-4xl mx-auto animate-fade-in">
          <DemoMockup />
        </div>
      </div>
    </section>
  );
}

function DemoMockup() {
  return (
    <div className="relative rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 h-9 border-b border-border/40 bg-card/80">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
        <div className="flex-1 mx-4 h-5 rounded bg-secondary/60 flex items-center px-3">
          <span className="text-xs text-muted-foreground font-mono">app.synemalabs.xyz/dashboard/create</span>
        </div>
      </div>

      {/* Mockup content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Left: controls */}
        <div className="md:col-span-2 space-y-3">
          <div className="rounded-lg border border-border/40 bg-background/60 p-3">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Music className="w-3 h-3" /> Audio Track
            </div>
            <div className="h-8 rounded bg-secondary/40 border border-border/30 flex items-center px-3 gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary/40" />
              <div className="h-2 flex-1 rounded bg-primary/20">
                <div className="h-full w-2/3 rounded bg-primary/60" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">3:42</span>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-background/60 p-3">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Wand2 className="w-3 h-3" /> Creative Direction
            </div>
            <div className="h-14 rounded bg-secondary/30 border border-border/30 p-2">
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Rain-soaked streets, neon reflections, cinematic depth...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {['Visual Style', 'Mood', 'Pacing', 'Camera'].map((label) => (
              <div key={label} className="rounded-lg border border-border/40 bg-background/60 p-2.5">
                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                <div className="h-5 rounded bg-secondary/40 border border-border/30" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: preview */}
        <div className="md:col-span-3 space-y-3">
          <div className="aspect-video rounded-lg border border-border/40 bg-gradient-to-br from-secondary/30 to-background/80 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Film className="w-6 h-6 text-primary/60" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground/60">Rendering Final Export</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">87% complete</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
              <div className="h-full w-[87%] bg-primary animate-shimmer rounded-r" />
            </div>
          </div>

          {/* Status steps */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Audio Analysis', done: true },
              { label: 'Scene Planning', done: true },
              { label: 'Rendering', active: true },
            ].map((step) => (
              <div
                key={step.label}
                className={cn(
                  'rounded p-2 text-center border',
                  step.done
                    ? 'border-success/20 bg-success/5'
                    : step.active
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/30 bg-secondary/20'
                )}
              >
                <div className={cn(
                  'text-xs font-medium',
                  step.done ? 'text-success' : step.active ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {step.done ? '✓' : step.active ? '◉' : '○'} {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    title: 'One-Click Generation',
    description: 'From audio to finished clip in minutes. Provide a track, a prompt, and your style — Synema handles everything else.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Precision Creative Control',
    description: 'Visual style, mood, pacing, camera language, editing intensity — every dimension of your clip is configurable.',
  },
  {
    icon: Music,
    title: 'Audio-Driven Editing',
    description: 'Beat detection, BPM analysis, and automatic track segmentation ensure every cut lands on the right moment.',
  },
  {
    icon: Layers,
    title: 'Versioned Projects',
    description: 'Every generation is saved. Compare versions, reuse prompts, duplicate settings, and iterate without losing history.',
  },
  {
    icon: Wallet,
    title: 'NFT-Gated Premium Access',
    description: 'Connect your wallet and verify NFT ownership to unlock premium generation tiers and exclusive capabilities.',
  },
  {
    icon: Download,
    title: 'Export-Ready Output',
    description: 'Download rendered clips in HD. Support for multiple aspect ratios — 16:9, 9:16, 1:1 — and output formats.',
  },
  {
    icon: Globe,
    title: 'Multi-Style Visual Engine',
    description: 'Cinematic, Noir, Neon Cyberpunk, Abstract, Vintage Film, Hyper Real — 10 distinct visual modes, each production-grade.',
  },
  {
    icon: Clock,
    title: 'Persistent Job Queue',
    description: 'Leave the page. Come back later. Jobs run in the background and results are waiting when you return.',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-4 border-border text-muted-foreground text-xs tracking-wider px-3 py-1">
            CAPABILITIES
          </Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-5">
            Built for serious creative work.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Every feature is designed for artists and production teams who need real results, not AI experiments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={cn(
                'rounded-xl border border-border/50 bg-card/40 p-6 hover:bg-card/70 hover:border-border transition-all duration-200 group',
                i === 0 || i === 4 ? 'lg:col-span-1' : ''
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                <feature.icon className="w-4.5 h-4.5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Upload or link your track',
    description: 'Drop an audio file or paste a URL. Synema ingests and analyzes the audio structure.',
  },
  {
    number: '02',
    title: 'Define your creative direction',
    description: 'Enter a concept prompt. Select visual style, mood, pacing, and all cinematic parameters.',
  },
  {
    number: '03',
    title: 'One click — generation begins',
    description: 'Synema segments the track, generates scene plans, dispatches image generation, and assembles the edit.',
  },
  {
    number: '04',
    title: 'Preview, download, iterate',
    description: 'Review your rendered clip. Download in your target format. Duplicate and refine as needed.',
  },
];

function HowItWorksSection() {
  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <Badge variant="outline" className="mb-4 border-border text-muted-foreground text-xs tracking-wider px-3 py-1">
              THE PROCESS
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              From audio to finished
              <br />
              clip in minutes.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Synema orchestrates every step of the production pipeline automatically.
              You provide creative direction. The platform handles the execution.
            </p>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex gap-5 group">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg border border-border/60 bg-secondary/30 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                    <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      {step.number}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px h-6 bg-border/40 mx-auto mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <h3 className="font-semibold text-foreground mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── NFT Access Section ───────────────────────────────────────────────────────

function NFTAccessSection() {
  const navigate = useNavigate();

  return (
    <section id="access" className="py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_70%_50%,hsl(204_100%_60%_/_0.06),transparent)]" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* NFT card mockup */}
          <div className="order-2 lg:order-1">
            <div className="max-w-sm mx-auto">
              <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur p-6 shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Wallet Connected</p>
                      <p className="text-xs text-muted-foreground font-mono">0x7f3a...c91d</p>
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20 text-xs">Verified</Badge>
                </div>

                <div className="space-y-3 mb-6">
                  {['Synema Genesis Pass', 'Creative Collective #7', 'Founder Series'].map((nft, i) => (
                    <div key={nft} className="flex items-center gap-3 rounded-lg bg-secondary/30 border border-border/40 p-3">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{nft}</p>
                        <p className="text-xs text-muted-foreground">Token #{100 + i}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">Premium Access Unlocked</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Unlimited generations · HD export · Priority queue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <Badge variant="outline" className="mb-4 border-border text-muted-foreground text-xs tracking-wider px-3 py-1">
              NFT GATING
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Premium access for
              <br />
              <span className="text-gradient-primary">token holders.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Synema rewards Web3 communities with exclusive access. Connect your wallet,
              verify NFT ownership, and unlock the full platform — no subscription required.
            </p>

            <div className="space-y-4 mb-10">
              {[
                'Unlimited clip generations',
                'HD and 4K export quality',
                'Priority rendering queue',
                'All visual styles and presets',
                'Brand overlay and subtitle tools',
                'Extended clip duration',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate('/auth/signup')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Connect Wallet & Access
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    description: 'For getting started.',
    features: [
      '5 generations per month',
      'Preview quality only',
      '720p export',
      '3 visual styles',
      '60s max duration',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'NFT Premium',
    price: 'NFT',
    priceLabel: 'Token gated',
    description: 'For token holders.',
    features: [
      'Unlimited generations',
      'HD & 4K export',
      'All visual styles',
      'Priority queue',
      'Brand overlay & subtitles',
      '10 min max duration',
      'Versioning & history',
    ],
    cta: 'Connect Wallet',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$49',
    priceLabel: '/month',
    description: 'For independent artists.',
    features: [
      '100 generations / month',
      'HD export (1080p)',
      'All visual styles',
      'Standard queue',
      'Versioning & history',
      '5 min max duration',
    ],
    cta: 'Start Pro',
    highlighted: false,
  },
];

function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-4 border-border text-muted-foreground text-xs tracking-wider px-3 py-1">
            PRICING
          </Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-5">
            Structured for creators.
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Start free. Unlock premium with your NFT or upgrade directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'rounded-xl border p-7 flex flex-col relative',
                plan.highlighted
                  ? 'border-primary/30 bg-primary/3 shadow-lg shadow-primary/5'
                  : 'border-border/50 bg-card/30'
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display font-semibold text-lg text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    'text-3xl font-bold font-display',
                    plan.highlighted ? 'text-primary' : 'text-foreground'
                  )}>
                    {plan.price}
                  </span>
                  {plan.priceLabel && (
                    <span className="text-sm text-muted-foreground">{plan.priceLabel}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className={cn(
                      'w-3.5 h-3.5 flex-shrink-0',
                      plan.highlighted ? 'text-primary' : 'text-muted-foreground/60'
                    )} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? 'default' : 'outline'}
                className={cn(
                  'w-full',
                  plan.highlighted ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''
                )}
                onClick={() => navigate('/auth/signup')}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-12">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Film className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight mb-4">
            Ready to forge your vision?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Join thousands of artists using Synema to create cinematic music videos at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-10"
              onClick={() => navigate('/auth/signup')}
            >
              Start Creating — Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <PublicLayout>
      <HeroSection />
      <div className="cinematic-line mx-auto max-w-7xl" />
      <FeaturesSection />
      <div className="cinematic-line mx-auto max-w-7xl" />
      <HowItWorksSection />
      <NFTAccessSection />
      <PricingSection />
      <CTASection />
    </PublicLayout>
  );
}
