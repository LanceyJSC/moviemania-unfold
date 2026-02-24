import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUserLists } from '@/hooks/useUserLists';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateListModal } from '@/components/CreateListModal';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

export const CollectionListsGrid = () => {
  const { lists, loading } = useUserLists();
  const [coverData, setCoverData] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (lists.length > 0) fetchCovers();
  }, [lists]);

  const fetchCovers = async () => {
    const covers: Record<string, string[]> = {};
    await Promise.all(
      lists.map(async (list) => {
        const { data } = await supabase
          .from('list_items')
          .select('movie_poster')
          .eq('list_id', list.id)
          .order('position', { ascending: true })
          .limit(4);
        covers[list.id] = (data || []).map(d => d.movie_poster).filter(Boolean) as string[];
      })
    );
    setCoverData(covers);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
        <CreateListModal
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New List
            </Button>
          }
        />
      </div>

      {lists.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Layers className="h-14 w-14 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-semibold text-foreground mb-1">No lists yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create curated lists of your favorite movies and shows</p>
          <CreateListModal
            trigger={
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" /> Create Your First List
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {lists.map(list => {
            const posters = coverData[list.id] || [];
            return (
              <Link
                key={list.id}
                to={`/lists/${list.id}`}
                className="group block rounded-xl overflow-hidden border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-[2/3] bg-muted relative overflow-hidden">
                  {posters.length > 0 ? (
                    posters.length === 1 ? (
                      <img
                        src={posters[0].startsWith('http') ? posters[0] : `${IMAGE_BASE}${posters[0]}`}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="grid grid-cols-2 grid-rows-2 gap-px w-full h-full">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="bg-muted overflow-hidden">
                            {posters[i] ? (
                              <img
                                src={posters[i].startsWith('http') ? posters[i] : `${IMAGE_BASE}${posters[i]}`}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted-foreground/5" />
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Layers className="h-8 w-8 text-muted-foreground/30" />
                      <span className="text-[10px] text-muted-foreground/50">Empty list</span>
                    </div>
                  )}
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-2.5">
                    <p className="text-sm font-semibold text-white truncate drop-shadow-sm">{list.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {list.is_public ? (
                        <Globe className="h-3 w-3 text-white/70" />
                      ) : (
                        <Lock className="h-3 w-3 text-white/70" />
                      )}
                      <span className="text-[10px] text-white/70">
                        {posters.length} item{posters.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
