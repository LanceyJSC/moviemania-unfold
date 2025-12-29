import { useState } from 'react';
import { Plus, X, Pencil, Tag, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useTags, TAG_COLORS } from '@/hooks/useTags';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { ProBadge } from './ProBadge';
import { cn } from '@/lib/utils';

export const TagManager = () => {
  const { tags, createTag, updateTag, deleteTag, loading } = useTags();
  const { isProUser } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleOpenChange = (open: boolean) => {
    if (open && !isProUser) {
      setShowUpgradeModal(true);
      return;
    }
    setIsOpen(open);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0].value);
  };

  const handleUpdateTag = async (id: string) => {
    if (!editName.trim()) return;
    await updateTag(id, { name: editName.trim() });
    setEditingTag(null);
    setEditName('');
  };

  const startEditing = (tag: { id: string; name: string }) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Tag className="h-4 w-4" />
            Manage Tags
            <ProBadge size="sm" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Custom Tags
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create new tag */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <label className="text-sm font-medium text-foreground">Create New Tag</label>
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Button onClick={handleCreateTag} size="icon" disabled={!newTagName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewTagColor(color.value)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      newTagColor === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Existing tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Your Tags ({tags.length})</label>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : tags.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No tags yet. Create your first one above!
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border/50"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      
                      {editingTag === tag.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTag(tag.id)}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleUpdateTag(tag.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingTag(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium">{tag.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEditing(tag)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteTag(tag.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Custom Tags"
        description="Create custom tags to organize your movies and TV shows your way. Add labels like 'Must Rewatch', 'Date Night', or anything you like!"
      />
    </>
  );
};
