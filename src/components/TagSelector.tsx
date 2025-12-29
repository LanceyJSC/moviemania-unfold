import { useState } from 'react';
import { Tag, Plus, Check, X, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useTags } from '@/hooks/useTags';
import { useSubscription } from '@/hooks/useSubscription';
import { ProUpgradeModal } from './ProUpgradeModal';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  movieId: number;
  mediaType?: string;
  variant?: 'button' | 'inline';
  className?: string;
}

export const TagSelector = ({ movieId, mediaType = 'movie', variant = 'button', className }: TagSelectorProps) => {
  const { tags, getTagsForMedia, addTagToMedia, removeTagFromMedia } = useTags();
  const { isProUser } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const appliedTags = getTagsForMedia(movieId, mediaType);
  const appliedTagIds = new Set(appliedTags.map(t => t.id));

  const handleOpenChange = (open: boolean) => {
    if (open && !isProUser) {
      setShowUpgradeModal(true);
      return;
    }
    setIsOpen(open);
  };

  const toggleTag = async (tagId: string) => {
    if (appliedTagIds.has(tagId)) {
      await removeTagFromMedia(tagId, movieId, mediaType);
    } else {
      await addTagToMedia(tagId, movieId, mediaType);
    }
  };

  if (variant === 'inline') {
    return (
      <>
        <div className={cn("flex flex-wrap gap-1", className)}>
          {appliedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              {isProUser && (
                <button
                  onClick={() => removeTagFromMedia(tag.id, movieId, mediaType)}
                  className="hover:opacity-75"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
          <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-dashed border-border/50 text-muted-foreground hover:border-foreground/50 hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" />
                Tag
                {!isProUser && <Lock className="h-3 w-3" />}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No tags yet. Create some in Tag Manager.
                </p>
              ) : (
                <div className="space-y-1">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-sm">{tag.name}</span>
                      {appliedTagIds.has(tag.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <ProUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="Custom Tags"
          description="Tag movies and TV shows with custom labels for better organization."
        />
      </>
    );
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Tag className="h-4 w-4" />
            {appliedTags.length > 0 ? `${appliedTags.length} Tags` : 'Add Tags'}
            {!isProUser && <Lock className="h-3 w-3" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">
              Select Tags
            </p>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tags created yet.
              </p>
            ) : (
              tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted transition-colors text-left"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-sm font-medium">{tag.name}</span>
                  {appliedTagIds.has(tag.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Custom Tags"
        description="Tag movies and TV shows with custom labels for better organization."
      />
    </>
  );
};
