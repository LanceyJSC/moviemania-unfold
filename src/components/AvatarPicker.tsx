import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Check } from 'lucide-react';
import avatarSprite from '@/assets/avatars/avatar-sprite.png';

interface AvatarOption {
  id: string;
  name: string;
  row: number;
  col: number;
  category: string;
}

// Grid is 14 columns x 9 rows - each avatar is ~110px with the circle
const COLS = 14;
const ROWS = 9;
const SPRITE_WIDTH = 1540;
const SPRITE_HEIGHT = 990;
const CELL_WIDTH = SPRITE_WIDTH / COLS;
const CELL_HEIGHT = SPRITE_HEIGHT / ROWS;

const avatarOptions: AvatarOption[] = [
  // Row 1 - Star Wars, Star Trek, LOTR, Harry Potter, Doctor Who
  { id: 'darth-vader', name: 'Darth Vader', row: 0, col: 0, category: 'Star Wars' },
  { id: 'baby-yoda', name: 'Grogu', row: 0, col: 1, category: 'Star Wars' },
  { id: 'stormtrooper', name: 'Stormtrooper', row: 0, col: 2, category: 'Star Wars' },
  { id: 'r2d2', name: 'R2-D2', row: 0, col: 3, category: 'Star Wars' },
  { id: 'spock-hand', name: 'Vulcan Salute', row: 0, col: 4, category: 'Star Trek' },
  { id: 'starfleet', name: 'Starfleet', row: 0, col: 5, category: 'Star Trek' },
  { id: 'one-ring', name: 'The One Ring', row: 0, col: 6, category: 'Lord of the Rings' },
  { id: 'wizard-hat', name: 'Wizard Hat', row: 0, col: 7, category: 'Harry Potter' },
  { id: 'harry-potter', name: 'Harry Potter', row: 0, col: 8, category: 'Harry Potter' },
  { id: 'sorting-hat', name: 'Sorting Hat', row: 0, col: 9, category: 'Harry Potter' },
  { id: 'tardis', name: 'TARDIS', row: 0, col: 10, category: 'Doctor Who' },
  { id: 'target', name: 'Target', row: 0, col: 11, category: 'Misc' },
  { id: 'neytiri', name: 'Neytiri', row: 0, col: 12, category: 'Avatar' },
  { id: 'terminator', name: 'Terminator', row: 0, col: 13, category: 'Sci-Fi' },
  
  // Row 2 - Marvel & DC
  { id: 'iron-man', name: 'Iron Man', row: 1, col: 0, category: 'Marvel' },
  { id: 'captain-america', name: 'Captain America', row: 1, col: 1, category: 'Marvel' },
  { id: 'spider-man', name: 'Spider-Man', row: 1, col: 2, category: 'Marvel' },
  { id: 'infinity-gauntlet', name: 'Infinity Gauntlet', row: 1, col: 3, category: 'Marvel' },
  { id: 'black-panther', name: 'Black Panther', row: 1, col: 4, category: 'Marvel' },
  { id: 'batman', name: 'Batman', row: 1, col: 5, category: 'DC' },
  { id: 'superman', name: 'Superman', row: 1, col: 6, category: 'DC' },
  { id: 'wonder-woman', name: 'Wonder Woman', row: 1, col: 7, category: 'DC' },
  { id: 'joker', name: 'The Joker', row: 1, col: 8, category: 'DC' },
  { id: 'star-lord', name: 'Star-Lord', row: 1, col: 9, category: 'Marvel' },
  { id: 'eleven', name: 'Eleven', row: 1, col: 10, category: 'Stranger Things' },
  { id: 'harley-quinn', name: 'Harley Quinn', row: 1, col: 11, category: 'DC' },
  { id: 'hellboy', name: 'Hellboy', row: 1, col: 12, category: 'Comics' },
  { id: 'v-vendetta', name: 'V for Vendetta', row: 1, col: 13, category: 'Comics' },

  // Row 3 - Animation & TV
  { id: 'mickey-mouse', name: 'Mickey Mouse', row: 2, col: 0, category: 'Disney' },
  { id: 'indiana-jones', name: 'Indiana Jones', row: 2, col: 1, category: 'Adventure' },
  { id: 'woody', name: 'Woody', row: 2, col: 2, category: 'Toy Story' },
  { id: 'astronaut', name: 'Astronaut', row: 2, col: 3, category: 'Space' },
  { id: 'mike-wazowski', name: 'Mike Wazowski', row: 2, col: 4, category: 'Monsters Inc' },
  { id: 'stitch', name: 'Stitch', row: 2, col: 5, category: 'Disney' },
  { id: 'homer-simpson', name: 'Homer Simpson', row: 2, col: 6, category: 'Simpsons' },
  { id: 'donut', name: 'Donut', row: 2, col: 7, category: 'Simpsons' },
  { id: 'rick', name: 'Rick Sanchez', row: 2, col: 8, category: 'Rick and Morty' },
  { id: 'pokeball', name: 'Pokeball', row: 2, col: 9, category: 'Pokémon' },
  { id: 'pikachu', name: 'Pikachu', row: 2, col: 10, category: 'Pokémon' },
  { id: 'pikachu-face', name: 'Pikachu Face', row: 2, col: 11, category: 'Pokémon' },
  { id: 'no-face', name: 'No-Face', row: 2, col: 12, category: 'Ghibli' },
  { id: 'dragon-ball', name: 'Dragon Ball', row: 2, col: 13, category: 'Anime' },

  // Row 4 - TV Shows
  { id: 'friends-frame', name: 'Friends Frame', row: 3, col: 0, category: 'Friends' },
  { id: 'coffee-cup', name: 'Coffee Cup', row: 3, col: 1, category: 'Friends' },
  { id: 'dunder-mifflin', name: 'Dunder Mifflin', row: 3, col: 2, category: 'The Office' },
  { id: 'dwight', name: 'Dwight', row: 3, col: 3, category: 'The Office' },
  { id: 'walter-white', name: 'Walter White', row: 3, col: 4, category: 'Breaking Bad' },
  { id: 'crystal', name: 'Crystal', row: 3, col: 5, category: 'Breaking Bad' },
  { id: 'iron-throne', name: 'Iron Throne', row: 3, col: 6, category: 'Game of Thrones' },
  { id: 'dire-wolf', name: 'Dire Wolf', row: 3, col: 7, category: 'Game of Thrones' },
  { id: 'waffle', name: 'Eggo Waffle', row: 3, col: 8, category: 'Stranger Things' },
  { id: 'demogorgon', name: 'Demogorgon', row: 3, col: 9, category: 'Stranger Things' },
  { id: 'demogorgon-2', name: 'Mind Flayer', row: 3, col: 10, category: 'Stranger Things' },
  { id: 'magneto', name: 'Magneto', row: 3, col: 11, category: 'Marvel' },
  { id: 'ted-lasso', name: 'Ted Lasso', row: 3, col: 12, category: 'Ted Lasso' },
  { id: 'ted-lasso-face', name: 'Ted Lasso Face', row: 3, col: 13, category: 'Ted Lasso' },

  // Row 5 - Mixed
  { id: 'spock', name: 'Spock', row: 4, col: 0, category: 'Star Trek' },
  { id: 'kylo-ren', name: 'Kylo Ren', row: 4, col: 1, category: 'Star Wars' },
  { id: 'x-files', name: 'X-Files', row: 4, col: 2, category: 'X-Files' },
  { id: 'thanos', name: 'Thanos Gauntlet', row: 4, col: 3, category: 'Marvel' },
  { id: 'thanos-face', name: 'Thanos', row: 4, col: 4, category: 'Marvel' },
  { id: 'mega-mind', name: 'Mega Mind', row: 4, col: 5, category: 'Animation' },
  { id: 'twin-peaks', name: 'Twin Peaks', row: 4, col: 6, category: 'Twin Peaks' },
  { id: 'doctor-strange', name: 'Doctor Strange', row: 4, col: 7, category: 'Marvel' },
  { id: 'anchorman', name: 'Anchorman', row: 4, col: 8, category: 'Comedy' },
  { id: 'joker-card', name: 'Joker Card', row: 4, col: 9, category: 'DC' },
  { id: 'twin-peaks-floor', name: 'Twin Peaks Floor', row: 4, col: 10, category: 'Twin Peaks' },
  { id: 'curly-red', name: 'Curly Red', row: 4, col: 11, category: 'Misc' },
  { id: 'merida', name: 'Merida', row: 4, col: 12, category: 'Disney' },

  // Row 6 - Classic Movies
  { id: 'james-bond', name: 'James Bond', row: 5, col: 0, category: 'Action' },
  { id: 'ruby-slippers', name: 'Ruby Slippers', row: 5, col: 1, category: 'Wizard of Oz' },
  { id: 'indy-hat', name: 'Indiana Jones Hat', row: 5, col: 2, category: 'Adventure' },
  { id: '007', name: '007', row: 5, col: 3, category: 'Action' },
  { id: 'delorean', name: 'DeLorean', row: 5, col: 4, category: 'Back to the Future' },
  { id: 'flux-capacitor', name: 'Flux Capacitor', row: 5, col: 5, category: 'Back to the Future' },
  { id: 'et', name: 'E.T.', row: 5, col: 6, category: 'Sci-Fi' },
  { id: 'jurassic-park', name: 'Jurassic Park', row: 5, col: 7, category: 'Jurassic Park' },
  { id: 'ghostbusters', name: 'Ghostbusters', row: 5, col: 8, category: 'Ghostbusters' },
  { id: 'leon', name: 'Leon', row: 5, col: 9, category: 'Action' },
  { id: 'fight-club', name: 'Fight Club Soap', row: 5, col: 10, category: 'Drama' },
  { id: 'home-alone', name: 'Home Alone', row: 5, col: 11, category: 'Comedy' },
  { id: 'christmas-sweater', name: 'Christmas Sweater', row: 5, col: 12, category: 'Holiday' },
  { id: 'bucket-hat', name: 'Bucket Hat', row: 5, col: 13, category: 'Misc' },

  // Row 7 - More Movies
  { id: 'wilson', name: 'Wilson', row: 6, col: 0, category: 'Cast Away' },
  { id: 'volleyball', name: 'Volleyball', row: 6, col: 1, category: 'Cast Away' },
  { id: 'chihuahua', name: 'Chihuahua', row: 6, col: 2, category: 'Beverly Hills' },
  { id: 'burn-book', name: 'Burn Book', row: 6, col: 3, category: 'Mean Girls' },
  { id: 'big-hero', name: 'Big Hero 6', row: 6, col: 4, category: 'Animation' },
  { id: 'ghostface', name: 'Ghostface', row: 6, col: 5, category: 'Horror' },
  { id: 'it-balloon', name: 'IT Balloon', row: 6, col: 6, category: 'Horror' },
  { id: 'jason', name: 'Jason', row: 6, col: 7, category: 'Horror' },
  { id: 'michael-myers', name: 'Michael Myers', row: 6, col: 8, category: 'Horror' },
  { id: 'edward-scissor', name: 'Edward Scissorhands', row: 6, col: 9, category: 'Fantasy' },
  { id: 'predator', name: 'Predator', row: 6, col: 10, category: 'Sci-Fi' },
  { id: 'predator-mask', name: 'Predator Mask', row: 6, col: 11, category: 'Sci-Fi' },
  { id: 'kratos', name: 'Kratos', row: 6, col: 12, category: 'Gaming' },
  { id: 'axe', name: 'Axe', row: 6, col: 13, category: 'Horror' },

  // Row 8 - Mixed Characters
  { id: 'blonde-girl', name: 'Blonde Girl', row: 7, col: 0, category: 'Misc' },
  { id: 'maleficent', name: 'Maleficent', row: 7, col: 1, category: 'Disney' },
  { id: 'hunger-games', name: 'Hunger Games', row: 7, col: 2, category: 'Hunger Games' },
  { id: 'loki', name: 'Loki Helmet', row: 7, col: 3, category: 'Marvel' },
  { id: 'sorting-hat-2', name: 'Sorting Hat', row: 7, col: 4, category: 'Harry Potter' },
  { id: 'dog-1', name: 'Dog', row: 7, col: 5, category: 'Pets' },
  { id: 'paddington', name: 'Paddington', row: 7, col: 6, category: 'Animation' },
  { id: 'dog-2', name: 'Golden Retriever', row: 7, col: 7, category: 'Pets' },
  { id: 'minion', name: 'Minion', row: 7, col: 8, category: 'Minions' },
  { id: 'groot', name: 'Groot', row: 7, col: 9, category: 'Marvel' },
  { id: 'deadpool', name: 'Deadpool', row: 7, col: 10, category: 'Marvel' },
  { id: 'furiosa', name: 'Furiosa', row: 7, col: 11, category: 'Mad Max' },
  { id: 'lamp', name: 'Pixar Lamp', row: 7, col: 12, category: 'Pixar' },
  { id: 'apple', name: 'Apple', row: 7, col: 13, category: 'Misc' },

  // Row 9 - Bottom Row
  { id: 'blonde-2', name: 'Blonde', row: 8, col: 0, category: 'Misc' },
  { id: 'bitmoji', name: 'Bitmoji Style', row: 8, col: 1, category: 'Misc' },
  { id: 'purple-b', name: 'Purple B', row: 8, col: 2, category: 'Misc' },
  { id: 'cat', name: 'Cat', row: 8, col: 3, category: 'Pets' },
  { id: 'winged-ball', name: 'Golden Snitch', row: 8, col: 4, category: 'Harry Potter' },
  { id: 'corgi', name: 'Corgi', row: 8, col: 5, category: 'Pets' },
  { id: 'marty-mcfly', name: 'Marty McFly', row: 8, col: 6, category: 'Back to the Future' },
  { id: 'puppy', name: 'Puppy', row: 8, col: 7, category: 'Pets' },
  { id: 'gizmo', name: 'Gizmo', row: 8, col: 8, category: 'Gremlins' },
  { id: 'gizmo-2', name: 'Gizmo Face', row: 8, col: 9, category: 'Gremlins' },
  { id: 'totoro', name: 'Totoro', row: 8, col: 10, category: 'Ghibli' },
  { id: 'soot-sprite', name: 'Soot Sprite', row: 8, col: 11, category: 'Ghibli' },
  { id: 'simpsons-donut', name: 'Simpsons Donut', row: 8, col: 12, category: 'Simpsons' },
  { id: 'orange', name: 'Orange', row: 8, col: 13, category: 'Misc' },
];

interface AvatarPickerProps {
  currentAvatarUrl?: string;
  username: string;
  onAvatarSelect: (url: string) => void;
}

export const AvatarPicker = ({ currentAvatarUrl, username, onAvatarSelect }: AvatarPickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);

  const categories = [...new Set(avatarOptions.map(a => a.category))];

  const handleSelect = (avatar: AvatarOption) => {
    setSelectedAvatar(avatar);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      // Store as a special format that includes sprite info
      const avatarData = `sprite:${selectedAvatar.row}:${selectedAvatar.col}`;
      onAvatarSelect(avatarData);
      setOpen(false);
      setSelectedAvatar(null);
    }
  };

  // Calculate background position for sprite - pixel-based for accuracy
  const getAvatarStyle = (row: number, col: number, size: number = 56) => {
    // Scale factor from original cell size to display size
    const scale = size / CELL_WIDTH;
    const scaledSpriteWidth = SPRITE_WIDTH * scale;
    const scaledSpriteHeight = SPRITE_HEIGHT * scale;
    
    // Position to center of each cell
    const xPos = col * CELL_WIDTH * scale;
    const yPos = row * CELL_HEIGHT * scale;
    
    return {
      backgroundImage: `url(${avatarSprite})`,
      backgroundPosition: `-${xPos}px -${yPos}px`,
      backgroundSize: `${scaledSpriteWidth}px ${scaledSpriteHeight}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
    };
  };

  // Parse current avatar if it's a sprite reference
  const parseAvatarUrl = (url?: string) => {
    if (url?.startsWith('sprite:')) {
      const parts = url.split(':');
      return { row: parseInt(parts[1]), col: parseInt(parts[2]) };
    }
    return null;
  };

  const currentSpriteData = parseAvatarUrl(currentAvatarUrl);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="h-24 w-24 ring-2 ring-primary/20 rounded-full overflow-hidden">
        {currentSpriteData ? (
          <div style={getAvatarStyle(currentSpriteData.row, currentSpriteData.col, 96)} />
        ) : currentAvatarUrl ? (
          <Avatar className="h-24 w-24">
            <AvatarImage src={currentAvatarUrl} alt={username} />
            <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-24 w-24 flex items-center justify-center bg-primary text-primary-foreground text-xl font-semibold rounded-full">
            {username.charAt(0).toUpperCase()}
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
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-1">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleSelect(avatar)}
                  className={`relative p-0.5 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary ${
                    selectedAvatar?.id === avatar.id 
                      ? 'ring-2 ring-primary bg-primary/10 scale-110' 
                      : 'hover:bg-muted'
                  }`}
                  title={avatar.name}
                >
                  <div 
                    style={getAvatarStyle(avatar.row, avatar.col, 44)}
                    className="mx-auto"
                  />
                  {selectedAvatar?.id === avatar.id && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
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

// Export helper for displaying sprite avatars elsewhere
export const SpriteAvatar = ({ avatarUrl, size = 40, fallback }: { avatarUrl?: string; size?: number; fallback?: string }) => {
  const parseAvatarUrl = (url?: string) => {
    if (url?.startsWith('sprite:')) {
      const parts = url.split(':');
      return { row: parseInt(parts[1]), col: parseInt(parts[2]) };
    }
    return null;
  };

  const spriteData = parseAvatarUrl(avatarUrl);

  if (spriteData) {
    const scale = size / CELL_WIDTH;
    const scaledSpriteWidth = SPRITE_WIDTH * scale;
    const scaledSpriteHeight = SPRITE_HEIGHT * scale;
    const xPos = spriteData.col * CELL_WIDTH * scale;
    const yPos = spriteData.row * CELL_HEIGHT * scale;

    return (
      <div
        style={{
          backgroundImage: `url(${avatarSprite})`,
          backgroundPosition: `-${xPos}px -${yPos}px`,
          backgroundSize: `${scaledSpriteWidth}px ${scaledSpriteHeight}px`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
        }}
      />
    );
  }

  if (avatarUrl) {
    return (
      <Avatar style={{ width: size, height: size }}>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{fallback?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div 
      className="flex items-center justify-center bg-primary text-primary-foreground rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {fallback?.charAt(0).toUpperCase()}
    </div>
  );
};
