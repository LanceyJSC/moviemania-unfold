import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { Movie } from "@/lib/tmdb";

interface PhotoSearchProps {
  onMovieFound: (movie: Movie) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const PhotoSearch = ({ onMovieFound, isOpen, onToggle }: PhotoSearchProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsProcessing(true);
    try {
      // For now, we'll simulate movie detection
      // In a real app, you'd use Google Vision API, AWS Rekognition, or similar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock movie result - in reality, you'd analyze the image
      const mockMovie: Movie = {
        id: 550,
        title: "Fight Club",
        overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
        poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        backdrop_path: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
        release_date: "1999-10-15",
        vote_average: 8.4,
        vote_count: 26280,
        genre_ids: [18, 53],
        adult: false,
        original_language: "en",
        original_title: "Fight Club",
        popularity: 61.416,
        video: false
      };
      
      onMovieFound(mockMovie);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        onClick={onToggle}
        className="fixed top-20 right-20 z-50 border-border hover:bg-card"
      >
        <Camera className="h-4 w-4 mr-2" />
        Photo Search
      </Button>
    );
  }

  return (
    <Card className="fixed top-20 right-20 w-80 p-4 z-50 bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Photo Search</h3>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Upload a movie poster or screenshot to find the movie
      </div>

      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Upload preview" className="w-full h-40 object-cover rounded" />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-background/80"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="py-8">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Drop an image here or click to upload
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {isProcessing && (
        <div className="flex items-center justify-center mt-4 p-4 bg-muted rounded">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Analyzing image...</span>
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        <p>📸 Pro tip: Works best with clear movie posters or recognizable scenes</p>
      </div>
    </Card>
  );
};