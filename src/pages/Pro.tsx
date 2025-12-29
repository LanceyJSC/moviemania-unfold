import { Crown, Sparkles, Check, X, Zap, Palette, Brain, ListChecks, Import, Tags, TrendingUp, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProBadge } from '@/components/ProBadge';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { Navigation } from '@/components/Navigation';

const COMPARISON_FEATURES = [
  { name: 'Custom Lists', free: true, pro: true, proNote: 'Unlimited' },
  { name: 'Movie & TV Diary', free: true, pro: true },
  { name: 'Rating (1-5 Flames)', free: true, pro: true },
  { name: 'Basic Stats', free: true, pro: true },
  { name: 'Community Reviews', free: true, pro: true },
  { name: 'Follow Other Users', free: true, pro: true },
  { name: 'Basic Genre Filters', free: true, pro: true },
  { name: 'Wrapped Summary', free: true, pro: true },
  { name: 'Advanced Discovery Filters', free: false, pro: true, proNote: 'Mood, Tone, Pacing, Era, Language' },
  { name: 'Mood-Based Discovery', free: false, pro: true },
  { name: '"Because You Loved..." Recommendations', free: false, pro: true },
  { name: 'Smart Lists (Auto-populated)', free: false, pro: true },
  { name: 'Custom Tags & Labels', free: false, pro: true },
  { name: 'Taste Profile Insights', free: false, pro: true },
  { name: 'Profile Customization', free: false, pro: true, proNote: 'Themes & Effects' },
  { name: 'Import from Letterboxd/IMDb', free: false, pro: true },
  { name: 'Pro Badge', free: false, pro: true },
  { name: 'Priority Support', free: false, pro: true },
  { name: 'Early Access to Features', free: false, pro: true },
];

const PRO_FEATURES = [
  {
    icon: ListChecks,
    title: 'Unlimited Lists',
    description: 'Create as many custom lists as you want to organize your movie collection exactly how you like it.',
  },
  {
    icon: Brain,
    title: 'Taste Profile',
    description: 'AI-powered insights about your viewing preferences, including genre DNA, rating style, and era preferences.',
  },
  {
    icon: Zap,
    title: 'Smart Lists',
    description: 'Auto-populated lists based on your viewing history - "Unwatched from 2024", "Highly Rated, No Review", and more.',
  },
  {
    icon: Heart,
    title: 'Mood Discovery',
    description: 'Find movies that match exactly how you\'re feeling. Cozy night in? Need a thrill? We\'ve got you covered.',
  },
  {
    icon: Tags,
    title: 'Custom Tags',
    description: 'Create your own tagging system to categorize and find movies your way.',
  },
  {
    icon: Import,
    title: 'Data Import',
    description: 'Seamlessly bring your existing ratings and watchlists from Letterboxd or IMDb.',
  },
  {
    icon: Palette,
    title: 'Profile Themes',
    description: 'Customize your profile with unique themes and visual effects that showcase your personality.',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Filters',
    description: 'Discover movies with powerful filters including mood, tone, pacing, era, and language.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data is always yours. If you cancel Pro, you\'ll keep all your ratings, reviews, and diary entries. You\'ll just lose access to Pro-exclusive features like advanced filters and unlimited lists (lists over 3 will become read-only).',
  },
  {
    question: 'Can I downgrade after upgrading?',
    answer: 'Yes, you can downgrade at any time. Your Pro features will remain active until the end of your billing period.',
  },
  {
    question: 'How do Smart Lists work?',
    answer: 'Smart Lists automatically populate based on criteria you set. For example, "Unwatched from 2024" will show all movies from 2024 in your watchlist that you haven\'t marked as watched yet.',
  },
  {
    question: 'What\'s included in Taste Profile?',
    answer: 'Your Taste Profile analyzes your ratings to reveal your genre preferences (Genre DNA), how you rate compared to others (Rating Style), your preferred movie eras, and your favorite actors and directors.',
  },
];

export default function Pro() {
  const { user } = useAuth();
  const { isProUser, upgradeToPro, loading } = useSubscription();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const result = await upgradeToPro();
    if (result.success) {
      toast.success('Welcome to SceneBurn Pro!');
    } else {
      toast.error(result.error || 'Failed to upgrade');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="SceneBurn Pro" />
      <DesktopHeader />

      <main className="pb-24 md:pb-12 md:max-w-5xl md:mx-auto md:px-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pt-6 pb-8 md:pt-12 md:pb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent" />
          <div className="relative text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center animate-pulse">
              <Crown className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Unlock the Full <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">SceneBurn</span> Experience
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Upgrade to Pro for unlimited features, personalized discovery, and exclusive insights into your viewing habits.
            </p>
            
            {isProUser ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <ProBadge size="md" />
                <span className="font-semibold text-foreground">You're a Pro member!</span>
              </div>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg shadow-lg shadow-amber-500/25"
              >
                <Crown className="h-5 w-5 mr-2" />
                {loading ? 'Upgrading...' : 'Upgrade to Pro'}
              </Button>
            )}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-6">Free vs Pro</h2>
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-0">
              <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
                <div className="p-3 md:p-4 font-semibold text-foreground">Feature</div>
                <div className="p-3 md:p-4 font-semibold text-center text-foreground">Free</div>
                <div className="p-3 md:p-4 font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Pro</div>
              </div>
              {COMPARISON_FEATURES.map((feature, index) => (
                <div 
                  key={feature.name}
                  className={`grid grid-cols-3 border-b border-border/50 last:border-0 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <div className="p-3 md:p-4 text-sm md:text-base text-foreground">
                    {feature.name}
                  </div>
                  <div className="p-3 md:p-4 flex justify-center items-center">
                    {feature.free ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="p-3 md:p-4 flex flex-col justify-center items-center gap-1">
                    <Check className="h-5 w-5 text-amber-500" />
                    {feature.proNote && (
                      <span className="text-xs text-muted-foreground text-center">{feature.proNote}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Feature Showcase */}
        <section className="px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-6">Pro Features</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {PRO_FEATURES.map((feature) => (
              <Card key={feature.title} className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20 hover:border-amber-500/40 transition-colors">
                <CardContent className="p-4 md:p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {feature.title}
                        <Sparkles className="h-4 w-4 text-amber-500" />
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        {!isProUser && (
          <section className="px-4 py-8">
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
              <CardContent className="p-6 md:p-8 text-center space-y-4">
                <Crown className="h-12 w-12 mx-auto text-amber-500" />
                <h2 className="text-2xl font-bold text-foreground">Ready to Go Pro?</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Join thousands of movie lovers who've upgraded their SceneBurn experience.
                </p>
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  {loading ? 'Upgrading...' : 'Upgrade to Pro'}
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* FAQ */}
        <section className="px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <Navigation />
    </div>
  );
}
