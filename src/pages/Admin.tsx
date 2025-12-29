import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Film, Tv, Star, Clock, Calendar, TrendingUp, Activity, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navigation } from "@/components/Navigation";
import { DesktopHeader } from "@/components/DesktopHeader";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface UserStats {
  totalUsers: number;
  proUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersToday: number;
}

interface ContentStats {
  totalMoviesWatched: number;
  totalTVWatched: number;
  totalRatings: number;
  totalReviews: number;
  totalLists: number;
}

interface RecentUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface DailySignup {
  date: string;
  count: number;
}

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [dailySignups, setDailySignups] = useState<DailySignup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStats(),
        fetchContentStats(),
        fetchRecentUsers(),
        fetchDailySignups()
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    const today = new Date();
    const weekAgo = subDays(today, 7);

    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Pro users
    const { count: proUsers } = await supabase
      .from("user_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("tier", "pro")
      .eq("status", "active");

    // New users today
    const { count: newUsersToday } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay(today).toISOString())
      .lte("created_at", endOfDay(today).toISOString());

    // New users this week
    const { count: newUsersThisWeek } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // Active users today (users who logged diary entries today)
    const { count: activeUsersToday } = await supabase
      .from("movie_diary")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", startOfDay(today).toISOString());

    setUserStats({
      totalUsers: totalUsers || 0,
      proUsers: proUsers || 0,
      newUsersToday: newUsersToday || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      activeUsersToday: activeUsersToday || 0
    });
  };

  const fetchContentStats = async () => {
    const { count: totalMoviesWatched } = await supabase
      .from("movie_diary")
      .select("*", { count: "exact", head: true });

    const { count: totalTVWatched } = await supabase
      .from("tv_diary")
      .select("*", { count: "exact", head: true });

    const { count: totalRatings } = await supabase
      .from("user_ratings")
      .select("*", { count: "exact", head: true });

    const { count: totalReviews } = await supabase
      .from("user_reviews")
      .select("*", { count: "exact", head: true });

    const { count: totalLists } = await supabase
      .from("user_lists")
      .select("*", { count: "exact", head: true });

    setContentStats({
      totalMoviesWatched: totalMoviesWatched || 0,
      totalTVWatched: totalTVWatched || 0,
      totalRatings: totalRatings || 0,
      totalReviews: totalReviews || 0,
      totalLists: totalLists || 0
    });
  };

  const fetchRecentUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    setRecentUsers(data || []);
  };

  const fetchDailySignups = async () => {
    const days = 14;
    const signups: DailySignup[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfDay(date).toISOString())
        .lte("created_at", endOfDay(date).toISOString());

      signups.push({
        date: format(date, "MMM d"),
        count: count || 0
      });
    }

    setDailySignups(signups);
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background pb-24 2xl:pb-0">
        <DesktopHeader />
        <div className="max-w-7xl mx-auto px-4 2xl:px-6 py-8 2xl:pt-24 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Navigation />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24 2xl:pb-0">
      <DesktopHeader />

      <div className="max-w-7xl mx-auto px-4 2xl:px-6 py-8 2xl:pt-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-cinematic text-foreground tracking-wide">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Platform statistics and user management</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{userStats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{userStats?.proUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Pro Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{userStats?.newUsersToday || 0}</p>
                  <p className="text-xs text-muted-foreground">New Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{userStats?.newUsersThisWeek || 0}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4 text-center">
              <Film className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{contentStats?.totalMoviesWatched || 0}</p>
              <p className="text-xs text-muted-foreground">Movies Logged</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4 text-center">
              <Tv className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{contentStats?.totalTVWatched || 0}</p>
              <p className="text-xs text-muted-foreground">TV Entries</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{contentStats?.totalRatings || 0}</p>
              <p className="text-xs text-muted-foreground">Ratings</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{contentStats?.totalReviews || 0}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/50">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{contentStats?.totalLists || 0}</p>
              <p className="text-xs text-muted-foreground">Lists Created</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signups Chart */}
          <Card className="bg-card/60 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">User Signups (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySignups}>
                    <defs>
                      <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#colorSignups)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="bg-card/60 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {user.full_name || user.username || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username || "no-username"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(user.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={fetchAdminData} className="gap-2">
            <Activity className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Admin;
