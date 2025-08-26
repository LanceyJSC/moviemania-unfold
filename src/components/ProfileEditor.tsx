import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';

interface ProfileEditorProps {
  initialUsername: string;
  initialFullName?: string;
  currentProfile?: {
    username: string;
    full_name?: string;
  } | null;
}

export const ProfileEditor = ({ initialUsername, initialFullName, currentProfile }: ProfileEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [fullName, setFullName] = useState(initialFullName || '');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const { updateProfile, checkUsernameAvailability } = useProfile();
  const { toast } = useToast();

  // Use current profile data if available, fallback to initial props
  const displayUsername = currentProfile?.username || initialUsername;
  const displayFullName = currentProfile?.full_name || initialFullName;

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    
    if (value === initialUsername) {
      setUsernameAvailable(null);
      return;
    }

    if (value.length < 3) {
      setUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    const available = await checkUsernameAvailability(value);
    setUsernameAvailable(available);
    setIsCheckingUsername(false);
  };

  const handleSave = async () => {
    if (username !== initialUsername && !usernameAvailable) {
      toast({
        title: "Username not available",
        description: "Please choose a different username",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProfile({
        username: username,
        full_name: fullName || null,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setUsername(initialUsername);
    setFullName(initialFullName || '');
    setUsernameAvailable(null);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <Label className="font-medium">Username</Label>
          <p className="text-sm text-muted-foreground">@{displayUsername}</p>
        </div>
        <div>
          <Label className="font-medium">Full Name</Label>
          <p className="text-sm text-muted-foreground">{displayFullName || 'Not set'}</p>
        </div>
        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
          Edit Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="Enter username"
            className="pr-8"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isCheckingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!isCheckingUsername && username !== initialUsername && (
              <>
                {usernameAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                {usernameAvailable === false && <X className="h-4 w-4 text-red-500" />}
              </>
            )}
          </div>
        </div>
        {username !== initialUsername && (
          <p className="text-xs mt-1">
            {username.length < 3 ? (
              <span className="text-red-500">Username must be at least 3 characters</span>
            ) : usernameAvailable === true ? (
              <span className="text-green-600">Username is available</span>
            ) : usernameAvailable === false ? (
              <span className="text-red-500">Username is already taken</span>
            ) : null}
          </p>
        )}
      </div>
      
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm">
          Save Changes
        </Button>
        <Button onClick={handleCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
};