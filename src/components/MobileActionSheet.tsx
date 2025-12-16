import { Check } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionSheetOption {
  value: string;
  label: string;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: ActionSheetOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const MobileActionSheet = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: MobileActionSheetProps) => {
  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-card border-t border-border">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="text-center font-semibold text-foreground">
            {title}
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-4 rounded-xl text-left transition-colors touch-manipulation",
                "min-h-[52px] active:bg-muted/80",
                selectedValue === option.value
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <span className="text-base font-medium">{option.label}</span>
              {selectedValue === option.value && (
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl text-base font-medium"
            >
              Cancel
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
