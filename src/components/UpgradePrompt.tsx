import React from 'react';
import { ProFeature } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, List, Filter, BarChart3, Download, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature?: ProFeature;
  variant?: 'inline' | 'card' | 'modal';
  className?: string;
}

// Feature group descriptions for paywalls
const FEATURE_GROUPS = {
  lists: {
    icon: List,
    title: 'Unlimited Lists',
    description: 'Create unlimited lists and organise films your way — no limits, no compromises.',
  },
  filters: {
    icon: Filter,
    title: 'Advanced Filters',
    description: 'Find films by mood, pacing, era, and tone — not just genre.',
  },
  taste: {
    icon: BarChart3,
    title: 'Taste Profile',
    description: 'See what you consistently love, what you burn, and how your taste really looks.',
  },
  history: {
    icon: Zap,
    title: 'History & Tracking',
    description: 'Track how your ratings and preferences change over time.',
  },
  exports: {
    icon: Download,
    title: 'Exports',
    description: 'Export your lists to PDF or CSV — perfect for sharing or keeping offline.',
  },
};

// Map features to their groups
const FEATURE_TO_GROUP: Record<ProFeature, keyof typeof FEATURE_GROUPS> = {
  unlimited_watchlists: 'lists',
  unlimited_lists: 'lists',
  list_reordering: 'lists',
  list_notes: 'lists',
  list_tags: 'lists',
  filter_mood: 'filters',
  filter_tone: 'filters',
  filter_pacing: 'filters',
  filter_era: 'filters',
  filter_language: 'filters',
  combine_filters: 'filters',
  save_filter_presets: 'filters',
  taste_profile: 'taste',
  genre_breakdown: 'taste',
  era_breakdown: 'taste',
  director_affinity: 'taste',
  taste_insights: 'taste',
  taste_comparison: 'taste',
  rating_history: 'history',
  're_rating_tracking': 'history',
  taste_over_time: 'history',
  export_pdf: 'exports',
  export_csv: 'exports',
  private_share_links: 'exports',
  print_views: 'exports',
  no_ads: 'lists', // fallback
  early_access: 'lists',
  priority_feedback: 'lists',
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  feature, 
  variant = 'card',
  className = '' 
}) => {
  const navigate = useNavigate();
  
  const groupKey = feature ? FEATURE_TO_GROUP[feature] : 'lists';
  const group = FEATURE_GROUPS[groupKey];
  const Icon = group.icon;

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 ${className}`}>
        <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{group.title}</p>
          <p className="text-xs text-muted-foreground truncate">{group.description}</p>
        </div>
        <Button size="sm" onClick={handleUpgrade} className="flex-shrink-0">
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{group.title}</CardTitle>
        <CardDescription className="text-sm">
          {group.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pt-0">
        <Button onClick={handleUpgrade} className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade to SceneBurn Pro
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          £3.99/month or £35/year
        </p>
      </CardContent>
    </Card>
  );
};

// Compact version for list limits
export const ListLimitPrompt: React.FC<{ 
  current: number; 
  max: number;
  type: 'watchlist' | 'list';
}> = ({ current, max, type }) => {
  const navigate = useNavigate();
  
  const remaining = max - current;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining <= 1 && remaining > 0;

  if (!isAtLimit && !isNearLimit) return null;

  return (
    <div className={`p-3 rounded-lg ${isAtLimit ? 'bg-destructive/10 border border-destructive/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className={`h-4 w-4 ${isAtLimit ? 'text-destructive' : 'text-amber-500'}`} />
        <span className="text-sm font-medium">
          {isAtLimit 
            ? `You've reached your ${type} limit` 
            : `Only ${remaining} ${type}${remaining === 1 ? '' : 's'} remaining`}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Free accounts can create up to {max} {type}s. Upgrade to Pro for unlimited.
      </p>
      <Button size="sm" variant="outline" onClick={() => navigate('/upgrade')} className="w-full">
        Upgrade to Pro
      </Button>
    </div>
  );
};
