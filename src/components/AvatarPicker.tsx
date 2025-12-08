import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Check } from 'lucide-react';

// Import all avatar images
import darthVader from '@/assets/avatars/darth-vader.png';
import babyYoda from '@/assets/avatars/baby-yoda.png';
import ironMan from '@/assets/avatars/iron-man.png';
import batman from '@/assets/avatars/batman.png';
import spiderMan from '@/assets/avatars/spider-man.png';
import harryPotter from '@/assets/avatars/harry-potter.png';
import stormtrooper from '@/assets/avatars/stormtrooper.png';
import captainAmerica from '@/assets/avatars/captain-america.png';
import wonderWoman from '@/assets/avatars/wonder-woman.png';
import joker from '@/assets/avatars/joker.png';
import pikachu from '@/assets/avatars/pikachu.png';
import groot from '@/assets/avatars/groot.png';
import deadpool from '@/assets/avatars/deadpool.png';
import superman from '@/assets/avatars/superman.png';
import r2d2 from '@/assets/avatars/r2d2.png';
import blackPanther from '@/assets/avatars/black-panther.png';
import stitch from '@/assets/avatars/stitch.png';
import rick from '@/assets/avatars/rick.png';
import thanos from '@/assets/avatars/thanos.png';
import thor from '@/assets/avatars/thor.png';
import hulk from '@/assets/avatars/hulk.png';
import yoda from '@/assets/avatars/yoda.png';
import mandalorian from '@/assets/avatars/mandalorian.png';
import loki from '@/assets/avatars/loki.png';

interface AvatarOption {
  id: string;
  name: string;
  src: string;
  category: string;
}

const avatarOptions: AvatarOption[] = [
  // Star Wars
  { id: 'darth-vader', name: 'Darth Vader', src: darthVader, category: 'Star Wars' },
  { id: 'baby-yoda', name: 'Grogu', src: babyYoda, category: 'Star Wars' },
  { id: 'stormtrooper', name: 'Stormtrooper', src: stormtrooper, category: 'Star Wars' },
  { id: 'r2d2', name: 'R2-D2', src: r2d2, category: 'Star Wars' },
  { id: 'yoda', name: 'Yoda', src: yoda, category: 'Star Wars' },
  { id: 'mandalorian', name: 'Mandalorian', src: mandalorian, category: 'Star Wars' },
  
  // Marvel
  { id: 'iron-man', name: 'Iron Man', src: ironMan, category: 'Marvel' },
  { id: 'spider-man', name: 'Spider-Man', src: spiderMan, category: 'Marvel' },
  { id: 'captain-america', name: 'Captain America', src: captainAmerica, category: 'Marvel' },
  { id: 'black-panther', name: 'Black Panther', src: blackPanther, category: 'Marvel' },
  { id: 'deadpool', name: 'Deadpool', src: deadpool, category: 'Marvel' },
  { id: 'groot', name: 'Groot', src: groot, category: 'Marvel' },
  { id: 'thanos', name: 'Thanos', src: thanos, category: 'Marvel' },
  { id: 'thor', name: 'Thor', src: thor, category: 'Marvel' },
  { id: 'hulk', name: 'Hulk', src: hulk, category: 'Marvel' },
  { id: 'loki', name: 'Loki', src: loki, category: 'Marvel' },
  
  // DC
  { id: 'batman', name: 'Batman', src: batman, category: 'DC' },
  { id: 'superman', name: 'Superman', src: superman, category: 'DC' },
  { id: 'wonder-woman', name: 'Wonder Woman', src: wonderWoman, category: 'DC' },
  { id: 'joker', name: 'The Joker', src: joker, category: 'DC' },
  
  // Other
  { id: 'harry-potter', name: 'Harry Potter', src: harryPotter, category: 'Harry Potter' },
  { id: 'pikachu', name: 'Pikachu', src: pikachu, category: 'Pokémon' },
  { id: 'stitch', name: 'Stitch', src: stitch, category: 'Disney' },
  { id: 'rick', name: 'Rick Sanchez', src: rick, category: 'Rick and Morty' },
];

interface AvatarPickerProps {
  currentAvatarUrl?: string;
  username: string;
  onAvatarSelect: (url: string) => void;
}

export const AvatarPicker = ({ currentAvatarUrl, username, onAvatarSelect }: AvatarPickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const categories = [...new Set(avatarOptions.map(a => a.category))];

  const handleSelect = (avatar: AvatarOption) => {
    setSelectedAvatar(avatar.src);
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
      <Avatar className="h-24 w-24 ring-2 ring-primary/20">
        <AvatarImage src={currentAvatarUrl} alt={username} />
        <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Choose Avatar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {avatarOptions
                      .filter(a => a.category === category)
                      .map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => handleSelect(avatar)}
                          className={`relative p-1 rounded-full transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                            selectedAvatar === avatar.src 
                              ? 'ring-2 ring-primary bg-primary/10' 
                              : 'hover:bg-muted'
                          }`}
                          title={avatar.name}
                        >
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={avatar.src} alt={avatar.name} />
                            <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {selectedAvatar === avatar.src && (
                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
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
