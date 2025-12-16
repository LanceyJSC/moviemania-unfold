import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface MobileFilterPillsProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  className?: string;
}

export const MobileFilterPills = ({
  options,
  selectedValue,
  onSelect,
  className,
}: MobileFilterPillsProps) => {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 scrollbar-hide", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={cn(
            "flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-manipulation",
            "min-h-[44px] active:scale-95",
            selectedValue === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
