import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Crown, Sparkles } from "lucide-react";
import { useUserLists, FREE_LIST_LIMIT } from "@/hooks/useUserLists";
import { useSubscription } from "@/hooks/useSubscription";

interface CreateListModalProps {
  trigger?: React.ReactNode;
  onCreated?: (list: any) => void;
}

export const CreateListModal = ({ trigger, onCreated }: CreateListModalProps) => {
  const { createList, canCreateList, remainingLists, isProUser } = useUserLists();
  const { upgradeToPro } = useSubscription();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    const result = await createList(name.trim(), description.trim() || undefined, isPublic);
    setCreating(false);

    if (result.limitReached) {
      setShowUpgradePrompt(true);
      return;
    }

    if (result.data) {
      setOpen(false);
      setName("");
      setDescription("");
      setIsPublic(true);
      setShowUpgradePrompt(false);
      onCreated?.(result.data);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    const result = await upgradeToPro();
    setUpgrading(false);
    
    if (result.success) {
      setShowUpgradePrompt(false);
      // Now try to create the list again
      handleCreate();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setShowUpgradePrompt(false);
      setName("");
      setDescription("");
      setIsPublic(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        {showUpgradePrompt ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Upgrade to SceneBurn Pro
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold">You've reached your list limit</h3>
                <p className="text-muted-foreground text-sm">
                  Free users can create up to {FREE_LIST_LIMIT} lists. Upgrade to SceneBurn Pro for unlimited lists and more!
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">SceneBurn Pro includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Unlimited lists
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Advanced statistics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Priority support
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowUpgradePrompt(false)} 
                className="h-12 touch-manipulation active:scale-95"
              >
                Maybe Later
              </Button>
              <Button 
                onClick={handleUpgrade} 
                disabled={upgrading}
                className="h-12 touch-manipulation active:scale-95 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {!isProUser && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  {remainingLists > 0 ? (
                    <>You can create {remainingLists} more list{remainingLists !== 1 ? 's' : ''} on the free plan</>
                  ) : (
                    <>You've used all {FREE_LIST_LIMIT} lists on the free plan</>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">List Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Favorite Sci-Fi Films"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's this list about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public">Public List</Label>
                  <p className="text-xs text-muted-foreground">
                    Public lists can be seen by anyone
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="h-12 touch-manipulation active:scale-95">
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!name.trim() || creating || !canCreateList} 
                className="h-12 touch-manipulation active:scale-95"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create List'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
