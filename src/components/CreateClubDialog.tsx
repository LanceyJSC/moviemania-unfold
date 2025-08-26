import { useState } from 'react';
import { Plus, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateClubDialogProps {
  onClubCreated?: () => void;
}

const genres = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western', 'Independent'
];

export const CreateClubDialog = ({ onClubCreated }: CreateClubDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre: '',
    isPublic: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create clubs');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Club name is required');
      return;
    }

    if (!formData.genre) {
      toast.error('Please select a genre');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movie_clubs')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          genre: formData.genre,
          created_by: user.id,
          is_public: formData.isPublic
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically join the creator to the club
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .insert({
          club_id: data.id,
          user_id: user.id,
          role: 'admin'
        });

      if (membershipError) throw membershipError;

      toast.success('Movie club created successfully! 🎬');
      setOpen(false);
      setFormData({
        name: '',
        description: '',
        genre: '',
        isPublic: true
      });
      
      if (onClubCreated) {
        onClubCreated();
      }
    } catch (error) {
      console.error('Error creating club:', error);
      toast.error('Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Club
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Movie Club
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Club Name</Label>
            <Input
              id="name"
              placeholder="e.g., Horror Movie Enthusiasts"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="genre">Primary Genre</Label>
            <Select value={formData.genre} onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell people what this club is about..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
            />
            <Label htmlFor="isPublic">Make this club public</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Club'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};