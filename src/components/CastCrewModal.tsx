import { Users, Clapperboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActorCard } from '@/components/ActorCard';
import { CrewCard } from '@/components/CrewCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

interface CastCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cast: CastMember[];
  crew: CrewMember[];
  title: string;
}

export const CastCrewModal = ({
  isOpen,
  onClose,
  cast,
  crew,
  title,
}: CastCrewModalProps) => {
  // Group crew by department
  const crewByDepartment = crew.reduce((acc, person) => {
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
  }, {} as Record<string, CrewMember[]>);

  const departmentOrder = ['Directing', 'Writing', 'Production', 'Camera', 'Editing', 'Art', 'Sound', 'Costume & Make-Up', 'Visual Effects', 'Other'];
  const sortedDepartments = Object.keys(crewByDepartment).sort((a, b) => {
    const indexA = departmentOrder.indexOf(a);
    const indexB = departmentOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cinema-gold" />
            Cast & Crew - {title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="cast" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4" style={{ width: 'calc(100% - 32px)' }}>
            <TabsTrigger value="cast" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cast ({cast.length})
            </TabsTrigger>
            <TabsTrigger value="crew" className="flex items-center gap-2">
              <Clapperboard className="h-4 w-4" />
              Crew ({crew.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] px-4 pb-4">
            <TabsContent value="cast" className="mt-4">
              {cast.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No cast information available</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cast.map((actor, index) => (
                    <ActorCard key={`${actor.id}-${index}`} actor={actor} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="crew" className="mt-4">
              {crew.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No crew information available</p>
              ) : (
                <div className="space-y-6">
                  {sortedDepartments.map((department) => (
                    <div key={department}>
                      <h3 className="font-semibold text-foreground text-sm mb-3 border-b border-border pb-2">
                        {department}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {crewByDepartment[department].map((person, index) => (
                          <CrewCard key={`${person.id}-${person.job}-${index}`} person={person} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
