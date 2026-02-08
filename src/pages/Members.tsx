import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from "lucide-react";
import { FollowButton } from "@/components/FollowButton";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

interface Member {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchMembers();
  }, [debouncedSearch]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*')
        .order('follower_count', { ascending: false })
        .limit(50);

      if (debouncedSearch) {
        query = query.or(`username.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead 
        title="Community Members - Movie & TV Enthusiasts | SceneBurn"
        description="Connect with fellow movie and TV show enthusiasts. Follow members, see their reviews, and discover what they're watching on SceneBurn."
        url="/members"
      />
      <MobileHeader title="Members" />
      
      <div className="px-4 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-cinema-red" />
          <h1 className="font-cinematic text-2xl text-foreground">Members</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : members.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "No members found matching your search" : "No members yet"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => (
              <Card key={member.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Link to={`/user/${member.username || member.id}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/user/${member.username || member.id}`}
                      className="font-medium text-foreground hover:underline block truncate"
                    >
                      {member.username || 'User'}
                    </Link>
                    {member.full_name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {member.full_name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {member.follower_count} followers
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.following_count} following
                      </span>
                    </div>
                  </div>
                  
                  <FollowButton userId={member.id} variant="outline" size="sm" />
                </div>
                
                {member.bio && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {member.bio}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Members;
