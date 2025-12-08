import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera } from 'lucide-react';
import avatarGrid from '@/assets/avatars/avatar-grid.png';

const GRID_COLS = 15;
const GRID_ROWS = 10;

// Generate all 150 avatar positions
const avatarOptions = Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  return {
    id: `avatar-${row}-${col}`,
    row,
    col,
  };
});

const getAvatarStyle = (row: number, col: number, size: number = 64) => ({
  width: size,
  height: size,
  backgroundImage: `url(${avatarGrid})`,
  backgroundSize: `${GRID_COLS * 100}% ${GRID_ROWS * 100}%`,
  backgroundPosition: `${(col / (GRID_COLS - 1)) * 100}% ${(row / (GRID_ROWS - 1)) * 100}%`,
  backgroundRepeat: 'no-repeat' as const,
  borderRadius: '50%',
});

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  username?: string | null;
  onAvatarSelect: (avatarUrl: string) => void;
}

export const AvatarPicker = ({ currentAvatarUrl, username, onAvatarSelect }: AvatarPickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const parseAvatarId = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return null;
    const match = avatarUrl.match(/avatar-(\d+)-(\d+)/);
    if (match) {
      return { row: parseInt(match[1]), col: parseInt(match[2]) };
    }
    return null;
  };

  const currentAvatarPos = parseAvatarId(currentAvatarUrl);

  const handleSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onAvatarSelect(selectedAvatar);
      setOpen(false);
      setSelectedAvatar(null);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="h-24 w-24 ring-2 ring-primary/20 rounded-full overflow-hidden">
        {currentAvatarPos ? (
          <div style={getAvatarStyle(currentAvatarPos.row, currentAvatarPos.col, 96)} />
        ) : (
          <div className="h-24 w-24 flex items-center justify-center bg-primary text-primary-foreground text-xl font-semibold rounded-full">
            {getInitials(username)}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Choose Avatar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 p-2">
              {avatarOptions.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelect(avatar.id)}
                    className={`relative rounded-full transition-all hover:scale-110 focus:outline-none ${
                      isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''
                    }`}
                  >
                    <div style={getAvatarStyle(avatar.row, avatar.col, 48)} />
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedAvatar}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component to display sprite avatars elsewhere in the app
interface SpriteAvatarProps {
  avatarUrl?: string | null;
  size?: number;
  fallback?: string;
  className?: string;
}

export const SpriteAvatar: React.FC<SpriteAvatarProps> = ({
  avatarUrl,
  size = 40,
  fallback = '?',
  className = ''
}) => {
  const parseAvatarId = (url: string | null | undefined) => {
    if (!url) return null;
    const match = url.match(/avatar-(\d+)-(\d+)/);
    if (match) {
      return { row: parseInt(match[1]), col: parseInt(match[2]) };
    }
    return null;
  };

  const avatarPos = parseAvatarId(avatarUrl);

  if (avatarPos) {
    return (
      <div 
        style={getAvatarStyle(avatarPos.row, avatarPos.col, size)}
        className={className}
      />
    );
  }

  return (
    <div 
      className={`flex items-center justify-center bg-primary text-primary-foreground rounded-full font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {fallback?.charAt(0).toUpperCase()}
    </div>
  );
};

export default AvatarPicker;
