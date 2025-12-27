import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  List, 
  Filter, 
  BarChart3, 
  Download, 
  Zap,
  Check,
  ArrowLeft
} from 'lucide-react';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { IOSTabBar } from '@/components/IOSTabBar';
import { Navigation } from '@/components/Navigation';
import { useIsMobile } from '@/hooks/use-mobile';

const FEATURES = [
  {
    icon: List,
    title: 'Unlimited Lists',
    description: 'Create unlimited lists and organise films your way — no limits, no compromises.',
    items: ['Unlimited watchlists', 'Unlimited custom lists', 'Reordering lists', 'List notes', 'List tags'],
  },
  {
    icon: Filter,
    title: 'Advanced Filters',
    description: 'Find films by mood, pacing, era, and tone — not just genre.',
    items: ['Filter by mood', 'Filter by tone', 'Filter by pacing', 'Filter by era', 'Filter by language', 'Save filter presets'],
  },
  {
    icon: BarChart3,
    title: 'Taste Profile',
    description: 'See what you consistently love, what you burn, and how your taste really looks.',
    items: ['Auto-generated taste profile', 'Genre breakdown', 'Era breakdown', 'Director affinity', '"You consistently love/burn" insights'],
  },
  {
    icon: Zap,
    title: 'History & Tracking',
    description: 'Track how your ratings and preferences change over time.',
    items: ['Rating history', 'Re-rating tracking', '"Taste over time" view'],
  },
  {
    icon: Download,
    title: 'Exports',
    description: 'Export your lists to PDF or CSV — perfect for sharing or keeping offline.',
    items: ['Export to PDF', 'Export to CSV', 'Private shareable links', 'Print-friendly views'],
  },
];

const Upgrade: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isPro, loading } = useSubscription();

  const handleUpgrade = (plan: 'monthly' | 'annual') => {
    // TODO: Integrate with Stripe when ready
    console.log('Upgrade to:', plan);
    // For now, show a toast or redirect to Stripe checkout
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="min-h-screen bg-background">
        {isMobile ? <MobileHeader title="Subscription" /> : <DesktopHeader />}
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">You're a Pro!</CardTitle>
              <CardDescription>
                You have full access to all SceneBurn Pro features.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" onClick={() => navigate('/settings/subscription')}>
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </main>
        {isMobile && <IOSTabBar />}
        {!isMobile && <Navigation />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobileHeader title="Upgrade to Pro" /> : <DesktopHeader />}
      
      <main className="container mx-auto px-4 py-8 pb-24 2xl:pb-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            SceneBurn Pro
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Understand your taste. Control your lists. Discover better films.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            SceneBurn Pro gives you advanced tools to organise your watchlists, discover films 
            that actually match your taste, and see how your preferences evolve over time.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
          <Card className="relative">
            <CardHeader>
              <CardTitle>Monthly</CardTitle>
              <CardDescription>Flexible, cancel anytime</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">£3.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleUpgrade('monthly')}
                disabled={!user}
              >
                {user ? 'Upgrade to Pro' : 'Sign in to upgrade'}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-primary">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Save over 25%
              </Badge>
            </div>
            <CardHeader>
              <CardTitle>Annual</CardTitle>
              <CardDescription>Best value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">£35</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleUpgrade('annual')}
                disabled={!user}
              >
                {user ? 'Upgrade to Pro' : 'Sign in to upgrade'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-muted-foreground mb-12">
          No tiers. No confusion.
        </p>

        {/* Feature Groups */}
        <div className="space-y-8 max-w-3xl mx-auto">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {feature.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {isMobile && <IOSTabBar />}
      {!isMobile && <Navigation />}
    </div>
  );
};

export default Upgrade;
