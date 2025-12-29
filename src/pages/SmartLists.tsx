import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Trash2, ChevronRight, Lock, Sparkles, Film, Star, Clock, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Navigation } from '@/components/Navigation';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { ProBadge } from '@/components/ProBadge';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { useSmartLists, SMART_LIST_TEMPLATES, SmartListCriteria } from '@/hooks/useSmartLists';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  'Unwatched from 2024': <Film className="h-5 w-5" />,
  'Loved but Not Reviewed': <Star className="h-5 w-5" />,
  'Recently Added': <Clock className="h-5 w-5" />,
  'Binge-Worthy Series': <Tv className="h-5 w-5" />,
};

const SmartLists = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const { smartLists, loading, createSmartList, deleteSmartList } = useSmartLists();
  const [showProModal, setShowProModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof SMART_LIST_TEMPLATES[0] | null>(null);

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isProUser) {
    return (
      <div className="min-h-screen bg-background pb-24 2xl:pb-12">
        <DesktopHeader />
        <MobileHeader title="Smart Lists" showBack />
        
        <div className="px-4 md:px-6 pt-4 max-w-4xl mx-auto">
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Smart Lists are Pro-Only</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create auto-updating lists based on your viewing habits. Get recommendations like "Unwatched from 2024" or "Loved but Not Reviewed".
              </p>
              <Button 
                onClick={() => setShowProModal(true)}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>

        <ProUpgradeModal
          isOpen={showProModal}
          onClose={() => setShowProModal(false)}
          feature="Smart Lists"
          description="Create intelligent auto-updating lists that organize your movies based on your viewing habits and preferences."
        />
        <Navigation />
      </div>
    );
  }

  const handleCreateFromTemplate = async (template: typeof SMART_LIST_TEMPLATES[0]) => {
    await createSmartList(template.name, template.description, template.criteria);
  };

  const handleCreateCustom = async () => {
    if (!newListName.trim() || !selectedTemplate) return;
    await createSmartList(newListName, newListDescription, selectedTemplate.criteria);
    setShowCreateModal(false);
    setNewListName('');
    setNewListDescription('');
    setSelectedTemplate(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-12">
      <DesktopHeader />
      <MobileHeader title="Smart Lists" showBack />
      
      <div className="px-4 md:px-6 pt-4 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h1 className="text-xl font-bold">Smart Lists</h1>
            <ProBadge size="sm" />
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Smart List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">List Name</label>
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="My Smart List"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="What's this list about?"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Based On</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SMART_LIST_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        onClick={() => setSelectedTemplate(template)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          selectedTemplate?.name === template.name
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-foreground/30"
                        )}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={handleCreateCustom} 
                  className="w-full"
                  disabled={!newListName.trim() || !selectedTemplate}
                >
                  Create Smart List
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Quick Start Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SMART_LIST_TEMPLATES.map((template) => {
              const exists = smartLists.some(sl => sl.name === template.name);
              return (
                <Card 
                  key={template.name}
                  className={cn(
                    "transition-all",
                    exists ? "opacity-50" : "hover:border-foreground/30 cursor-pointer"
                  )}
                  onClick={() => !exists && handleCreateFromTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {TEMPLATE_ICONS[template.name] || <Zap className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{template.name}</h3>
                          {exists && (
                            <span className="text-xs text-muted-foreground">(Added)</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      {!exists && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* User's Smart Lists */}
        {smartLists.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Your Smart Lists</h2>
            <div className="space-y-2">
              {smartLists.map((list) => (
                <Card key={list.id} className="hover:border-foreground/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{list.name}</h3>
                          {list.description && (
                            <p className="text-xs text-muted-foreground">{list.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSmartList(list.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default SmartLists;
