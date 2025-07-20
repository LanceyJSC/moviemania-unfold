
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
}

export const MobileHeader = ({ title, showBack = true }: MobileHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-cinema-black/95 backdrop-blur-sm border-b border-border safe-top">
      <div className="flex items-center h-16 px-4">
        {showBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-3 p-3 hover:bg-cinema-charcoal/50 touch-target rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
        )}
        <h1 className="mobile-title text-foreground truncate flex-1">
          {title.toUpperCase()}
        </h1>
      </div>
    </header>
  );
};
