import { useState } from 'react';
import { Palette, Check, Lock, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { ProBadge } from './ProBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const PROFILE_THEMES = [
  { id: 'default', name: 'Classic Red', color: 'hsl(0, 84%, 60%)', gradient: 'from-red-500 to-rose-600' },
  { id: 'ocean', name: 'Ocean Blue', color: 'hsl(210, 84%, 60%)', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'forest', name: 'Forest Green', color: 'hsl(142, 71%, 45%)', gradient: 'from-green-500 to-emerald-600' },
  { id: 'sunset', name: 'Sunset Orange', color: 'hsl(25, 95%, 53%)', gradient: 'from-orange-500 to-amber-600' },
  { id: 'purple', name: 'Royal Purple', color: 'hsl(270, 76%, 60%)', gradient: 'from-purple-500 to-violet-600' },
  { id: 'gold', name: 'Premium Gold', color: 'hsl(45, 93%, 47%)', gradient: 'from-amber-400 to-yellow-500' },
];

export const PROFILE_EFFECTS = [
  { id: 'none', name: 'None', description: 'Standard profile appearance' },
  { id: 'glow', name: 'Subtle Glow', description: 'Soft ambient glow around avatar' },
  { id: 'animated', name: 'Animated Border', description: 'Rotating gradient border' },
  { id: 'sparkle', name: 'Sparkle', description: 'Subtle sparkle effect' },
];

export const ThemeCustomizer = () => {
  const { profile, updateProfile } = useProfile();
  const { isProUser } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(profile?.theme_color || 'default');
  const [selectedEffect, setSelectedEffect] = useState(profile?.profile_effects || 'none');
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (open && !isProUser) {
      setShowUpgradeModal(true);
      return;
    }
    setIsOpen(open);
    if (open && profile) {
      setSelectedTheme(profile.theme_color || 'default');
      setSelectedEffect(profile.profile_effects || 'none');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        theme_color: selectedTheme,
        profile_effects: selectedEffect
      });
      toast.success('Profile theme updated!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  const currentTheme = PROFILE_THEMES.find(t => t.id === selectedTheme) || PROFILE_THEMES[0];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Palette className="h-4 w-4" />
            Customize Theme
            <ProBadge size="sm" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Profile Theme
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <div className={cn(
                "relative w-24 h-24 rounded-full",
                selectedEffect === 'glow' && "shadow-lg shadow-current/30",
                selectedEffect === 'animated' && "animate-border-spin"
              )}>
                <div className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-br",
                  currentTheme.gradient,
                  selectedEffect === 'animated' && "animate-spin-slow"
                )} />
                <div className="absolute inset-1 rounded-full bg-card flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: currentTheme.color }}>
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                {selectedEffect === 'sparkle' && (
                  <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-amber-400 animate-pulse" />
                )}
              </div>
            </div>

            {/* Theme Colors */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Accent Color</label>
              <div className="grid grid-cols-3 gap-3">
                {PROFILE_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all",
                      selectedTheme === theme.id
                        ? "border-foreground"
                        : "border-border/50 hover:border-foreground/50"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full bg-gradient-to-br",
                          theme.gradient
                        )}
                      />
                      <span className="text-xs font-medium">{theme.name}</span>
                    </div>
                    {selectedTheme === theme.id && (
                      <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Effects */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Profile Effect</label>
              <div className="space-y-2">
                {PROFILE_EFFECTS.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => setSelectedEffect(effect.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                      selectedEffect === effect.id
                        ? "border-foreground bg-muted/50"
                        : "border-border/50 hover:border-foreground/50"
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{effect.name}</div>
                      <div className="text-xs text-muted-foreground">{effect.description}</div>
                    </div>
                    {selectedEffect === effect.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Profile Customization"
        description="Personalize your profile with custom themes, colors, and effects. Stand out from the crowd!"
      />
    </>
  );
};
