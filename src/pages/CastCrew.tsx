import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Loader2, Users, Clapperboard } from "lucide-react";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { Navigation } from "@/components/Navigation";
import { ActorCard } from "@/components/ActorCard";
import { CrewCard } from "@/components/CrewCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tmdbService, Movie, TVShow } from "@/lib/tmdb";

const CastCrew = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const type = location.pathname.includes('/movie/') ? 'movie' : 'tv';
  const [media, setMedia] = useState<Movie | TVShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id || !type) return;
      
      setIsLoading(true);
      try {
        if (type === 'movie') {
          const data = await tmdbService.getMovieDetails(Number(id));
          setMedia(data);
        } else {
          const data = await tmdbService.getTVShowDetails(Number(id));
          setMedia(data);
        }
      } catch (error) {
        console.error('Failed to load details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [id, type]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 md:pb-12">
        <DesktopHeader />
        <MobileHeader title="Loading..." />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-cinema-red" />
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen bg-background pb-32 md:pb-12">
        <DesktopHeader />
        <MobileHeader title="Not Found" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Content not found</h1>
            <Link to="/" className="text-cinema-red hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isTV = type === 'tv';
  const title = isTV ? (media as TVShow).name : (media as Movie).title;
  const cast = media.credits?.cast || [];
  const crew = media.credits?.crew || [];

  // Group crew by job category
  const crewByDepartment = crew.reduce((acc, person) => {
    // Derive department from job title
    let dept = 'Other';
    const job = person.job.toLowerCase();
    if (job.includes('director') && !job.includes('art')) dept = 'Directing';
    else if (job.includes('writer') || job.includes('screenplay') || job.includes('story')) dept = 'Writing';
    else if (job.includes('producer')) dept = 'Production';
    else if (job.includes('camera') || job.includes('cinematograph') || job.includes('photography')) dept = 'Camera';
    else if (job.includes('editor') || job.includes('editing')) dept = 'Editing';
    else if (job.includes('art') || job.includes('design') || job.includes('decorator')) dept = 'Art';
    else if (job.includes('sound') || job.includes('music') || job.includes('composer')) dept = 'Sound';
    else if (job.includes('costume') || job.includes('makeup') || job.includes('hair')) dept = 'Costume & Make-Up';
    else if (job.includes('visual') || job.includes('effects') || job.includes('vfx')) dept = 'Visual Effects';
    
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(person);
    return acc;
  }, {} as Record<string, typeof crew>);

  // Sort departments by importance
  const departmentOrder = ['Directing', 'Writing', 'Production', 'Camera', 'Editing', 'Art', 'Sound', 'Costume & Make-Up', 'Visual Effects', 'Other'];
  const sortedDepartments = Object.keys(crewByDepartment).sort((a, b) => {
    const indexA = departmentOrder.indexOf(a);
    const indexB = departmentOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12">
      <DesktopHeader />
      <MobileHeader title={`Cast & Crew`} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link 
            to={type === 'movie' ? `/movie/${id}` : `/tv/${id}`}
            className="text-cinema-gold hover:underline text-sm"
          >
            ← Back to {title}
          </Link>
          <h1 className="font-cinematic text-2xl text-foreground mt-2">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">
            Full Cast & Crew
          </p>
        </div>

        <Tabs defaultValue="cast" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="cast" className="flex items-center gap-2 touch-manipulation">
              <Users className="h-4 w-4" />
              Cast ({cast.length})
            </TabsTrigger>
            <TabsTrigger value="crew" className="flex items-center gap-2 touch-manipulation">
              <Clapperboard className="h-4 w-4" />
              Crew ({crew.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cast">
            {cast.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No cast information available</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cast.map((actor) => (
                  <ActorCard key={`${actor.id}-${actor.character}`} actor={actor} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="crew">
            {crew.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No crew information available</p>
            ) : (
              <div className="space-y-8">
                {sortedDepartments.map((department) => (
                  <div key={department}>
                    <h3 className="font-semibold text-foreground text-lg mb-4 border-b border-border pb-2">
                      {department}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {crewByDepartment[department].map((person, index) => (
                        <CrewCard key={`${person.id}-${person.job}-${index}`} person={person} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
};

export default CastCrew;