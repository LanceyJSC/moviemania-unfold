import { ArrowLeft } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-cinema-black/95 backdrop-blur-sm border-b border-border xl:hidden">
      <div className="flex items-center h-14 px-4">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="mr-3 p-2 hover:bg-cinema-charcoal/50 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md active:bg-cinema-charcoal/70"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        <h1 className="font-cinematic text-lg text-foreground tracking-wide truncate">
          {title}
        </h1>
      </div>
    </header>
  );
};
