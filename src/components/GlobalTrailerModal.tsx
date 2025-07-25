import { TrailerModal } from "./TrailerModal";
import { useTrailerContext } from "@/contexts/TrailerContext";

export const GlobalTrailerModal = () => {
  const { isTrailerOpen, setIsTrailerOpen, trailerKey, movieTitle } = useTrailerContext();

  const handleClose = () => {
    setIsTrailerOpen(false);
  };

  return (
    <TrailerModal
      isOpen={isTrailerOpen}
      onClose={handleClose}
      trailerKey={trailerKey}
      movieTitle={movieTitle}
    />
  );
};