import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListPlus, Check, Plus, Loader2 } from "lucide-react";
import { useUserLists } from "@/hooks/useUserLists";
import { useAuth } from "@/hooks/useAuth";
import { CreateListModal } from "./CreateListModal";

interface AddToListButtonProps {
  movie: {
    id: number;
    title: string;
    poster?: string;
  };
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const AddToListButton = ({ 
  movie, 
  variant = "ghost",
  size = "sm",
  className = ""
}: AddToListButtonProps) => {
  const { user } = useAuth();
  const { lists, loading, addToList } = useUserLists();
  const [open, setOpen] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [addedToLists, setAddedToLists] = useState<string[]>([]);

  if (!user) {
    return null;
  }

  const handleAddToList = async (listId: string) => {
    setAddingToList(listId);
    await addToList(listId, movie);
    setAddedToLists(prev => [...prev, listId]);
    setAddingToList(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <ListPlus className="h-4 w-4 mr-2" />
          Add to List
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add "{movie.title}" to List</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't created any lists yet</p>
              <CreateListModal
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First List
                  </Button>
                }
              />
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {lists.map((list) => {
                  const isAdded = addedToLists.includes(list.id);
                  const isAdding = addingToList === list.id;
                  
                  return (
                    <Button
                      key={list.id}
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => !isAdded && handleAddToList(list.id)}
                      disabled={isAdding || isAdded}
                    >
                      <span className="truncate">{list.name}</span>
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isAdded ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          
          {lists.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <CreateListModal
                trigger={
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New List
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
