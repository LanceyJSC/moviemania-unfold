import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Check } from 'lucide-react';

// Import individual avatar images
import darthVader from '@/assets/avatars/darth-vader.png';
import babyYoda from '@/assets/avatars/baby-yoda.png';
import stormtrooper from '@/assets/avatars/stormtrooper.png';
import r2d2 from '@/assets/avatars/r2d2.png';
import mandalorian from '@/assets/avatars/mandalorian.png';
import yoda from '@/assets/avatars/yoda.png';
import ironMan from '@/assets/avatars/iron-man.png';
import captainAmerica from '@/assets/avatars/captain-america.png';
import spiderMan from '@/assets/avatars/spider-man.png';
import blackPanther from '@/assets/avatars/black-panther.png';
import thanos from '@/assets/avatars/thanos.png';
import groot from '@/assets/avatars/groot.png';
import deadpool from '@/assets/avatars/deadpool.png';
import thor from '@/assets/avatars/thor.png';
import hulk from '@/assets/avatars/hulk.png';
import loki from '@/assets/avatars/loki.png';
import batman from '@/assets/avatars/batman.png';
import superman from '@/assets/avatars/superman.png';
import wonderWoman from '@/assets/avatars/wonder-woman.png';
import joker from '@/assets/avatars/joker.png';
import harryPotter from '@/assets/avatars/harry-potter.png';
import stitch from '@/assets/avatars/stitch.png';
import pikachu from '@/assets/avatars/pikachu.png';
import rick from '@/assets/avatars/rick.png';

interface AvatarOption {
  id: string;
  name: string;
  src: string;
  category: 'Star Wars' | 'Marvel' | 'DC' | 'Other';
}

const avatarOptions: AvatarOption[] = [
  // Star Wars
  { id: 'darth-vader', name: 'Darth Vader', src: darthVader, category: 'Star Wars' },
  { id: 'baby-yoda', name: 'Baby Yoda', src: babyYoda, category: 'Star Wars' },
  { id: 'stormtrooper', name: 'Stormtrooper', src: stormtrooper, category: 'Star Wars' },
  { id: 'r2d2', name: 'R2-D2', src: r2d2, category: 'Star Wars' },
  { id: 'mandalorian', name: 'Mandalorian', src: mandalorian, category: 'Star Wars' },
  { id: 'yoda', name: 'Yoda', src: yoda, category: 'Star Wars' },
  
  // Marvel
  { id: 'iron-man', name: 'Iron Man', src: ironMan, category: 'Marvel' },
  { id: 'captain-america', name: 'Captain America', src: captainAmerica, category: 'Marvel' },
  { id: 'spider-man', name: 'Spider-Man', src: spiderMan, category: 'Marvel' },
  { id: 'black-panther', name: 'Black Panther', src: blackPanther, category: 'Marvel' },
  { id: 'thanos', name: 'Thanos', src: thanos, category: 'Marvel' },
  { id: 'groot', name: 'Groot', src: groot, category: 'Marvel' },
  { id: 'deadpool', name: 'Deadpool', src: deadpool, category: 'Marvel' },
  { id: 'thor', name: 'Thor', src: thor, category: 'Marvel' },
  { id: 'hulk', name: 'Hulk', src: hulk, category: 'Marvel' },
  { id: 'loki', name: 'Loki', src: loki, category: 'Marvel' },
  
  // DC
  { id: 'batman', name: 'Batman', src: batman, category: 'DC' },
  { id: 'superman', name: 'Superman', src: superman, category: 'DC' },
  { id: 'wonder-woman', name: 'Wonder Woman', src: wonderWoman, category: 'DC' },
  { id: 'joker', name: 'Joker', src: joker, category: 'DC' },
  
  // Other
  { id: 'harry-potter', name: 'Harry Potter', src: harryPotter, category: 'Other' },
  { id: 'stitch', name: 'Stitch', src: stitch, category: 'Other' },
  { id: 'pikachu', name: 'Pikachu', src: pikachu, category: 'Other' },
  { id: 'rick', name: 'Rick', src: rick, category: 'Other' },
];

interface AvatarPickerProps {
  currentAvatarUrl?: string;
  username: string;
  onAvatarSelect: (url: string) => void;
}

export const AvatarPicker = ({ currentAvatarUrl, username, onAvatarSelect }: AvatarPickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);

  const categories = ['Star Wars', 'Marvel', 'DC', 'Other'] as const;

  const handleSelect = (avatar: AvatarOption) => {
    setSelectedAvatar(avatar);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onAvatarSelect(selectedAvatar.src);
      setOpen(false);
      setSelectedAvatar(null);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="h-24 w-24 ring-2 ring-primary/20 rounded-full overflow-hidden">
        {currentAvatarUrl ? (
          <img 
            src={currentAvatarUrl} 
            alt={username} 
            className="h-full w-full object-cover"
          />
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
            <div className="space-y-6">
              {categories.map((category) => {
                const categoryAvatars = avatarOptions.filter(a => a.category === category);
                if (categoryAvatars.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      {category}
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {categoryAvatars.map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => handleSelect(avatar)}
                          className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105 focus:outline-none ${
                            selectedAvatar?.id === avatar.id
                              ? 'border-primary ring-2 ring-primary/30 scale-110'
                              : 'border-transparent hover:border-primary/50'
                          }`}
                          title={avatar.name}
                        >
                          <img
                            src={avatar.src}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                          {selectedAvatar?.id === avatar.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
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

// Simplified SpriteAvatar that just displays images
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
  if (avatarUrl) {
    return (
      <Avatar className={className} style={{ width: size, height: size }}>
        <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
        <AvatarFallback className="bg-primary/10">
          {fallback?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
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
