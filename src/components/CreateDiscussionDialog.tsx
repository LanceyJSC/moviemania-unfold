import { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateDiscussionDialogProps {
  movieId?: number;
  movieTitle?: string;
  clubId?: string;
  onDiscussionCreated?: () => void;
}

export const CreateDiscussionDialog = ({ 
  movieId, 
  movieTitle, 
  clubId,
  onDiscussionCreated 
}: CreateDiscussionDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    movieTitle: movieTitle || '',
    movieId: movieId || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create discussions');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Discussion title is required');
      return;
    }

    if (!formData.movieTitle.trim()) {
      toast.error('Movie title is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          movie_title: formData.movieTitle.trim(),
          movie_id: formData.movieId || 0,
          club_id: clubId || null,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Discussion created successfully! 🎬');
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        movieTitle: movieTitle || '',
        movieId: movieId || 0
      });
      
      if (onDiscussionCreated) {
        onDiscussionCreated();
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Failed to create discussion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Start Discussion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Start a Movie Discussion
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Discussion Title</Label>
            <Input
              id="title"
              placeholder="What's your discussion about?"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="movieTitle">Movie Title</Label>
            <Input
              id="movieTitle"
              placeholder="Which movie are you discussing?"
              value={formData.movieTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, movieTitle: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more details about your discussion..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Discussion'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};