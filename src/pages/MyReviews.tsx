import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Star, Calendar, BookOpen, Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigation } from '@/components/Navigation';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { LogMediaModal } from '@/components/LogMediaModal';
import { MobileFilterPills } from '@/components/MobileFilterPills';
import { MobileActionSheet } from '@/components/MobileActionSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface Review {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  review_text: string | null;
  rating: number | null;
  is_spoiler: boolean | null;
  created_at: string;
  updated_at: string;
}

type SortOption = 'recent' | 'oldest' | 'highest' | 'lowest' | 'title';
type FilterOption = 'all' | 'movies' | 'tv' | 'rated' | 'unrated';

const MyReviews = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  useEffect(() => {
    if (user) {
      loadReviews();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadReviews = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowLogModal(true);
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];
    
    // Apply filters
    switch (filterBy) {
      case 'rated':
        filtered = filtered.filter(r => r.rating && r.rating > 0);
        break;
      case 'unrated':
        filtered = filtered.filter(r => !r.rating || r.rating === 0);
        break;
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'lowest':
        filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'title':
        filtered.sort((a, b) => a.movie_title.localeCompare(b.movie_title));
        break;
    }
    
    return filtered;
  };

  // Stats
  const totalReviews = reviews.length;
  const ratedReviews = reviews.filter(r => r.rating && r.rating > 0);
  const avgRating = ratedReviews.length > 0 
    ? ratedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedReviews.length 
    : 0;
  const thisMonthReviews = reviews.filter(r => {
    const reviewDate = new Date(r.created_at);
    const now = new Date();
    return reviewDate.getMonth() === now.getMonth() && reviewDate.getFullYear() === now.getFullYear();
  }).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 xl:pb-12">
        <DesktopHeader />
        <MobileHeader title="My Reviews" />
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">My Reviews</h1>
          <p className="text-muted-foreground mb-4">Sign in to see your reviews</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  const filteredReviews = getFilteredAndSortedReviews();

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="My Reviews" />
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{totalReviews}</div>
            <div className="text-xs text-muted-foreground">Total Reviews</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-cinema-gold">{avgRating.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg Rating</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{thisMonthReviews}</div>
            <div className="text-xs text-muted-foreground">This Month</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <MobileFilterPills
            options={[
              { value: 'all', label: 'All Reviews' },
              { value: 'rated', label: 'With Rating' },
              { value: 'unrated', label: 'No Rating' },
            ]}
            selectedValue={filterBy}
            onSelect={(v) => setFilterBy(v as FilterOption)}
          />
        </div>

        {/* Sort Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowSortSheet(true)}
            className="h-11 px-4 rounded-xl gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortBy === 'recent' && 'Most Recent'}
            {sortBy === 'oldest' && 'Oldest First'}
            {sortBy === 'highest' && 'Highest Rated'}
            {sortBy === 'lowest' && 'Lowest Rated'}
            {sortBy === 'title' && 'Title A-Z'}
          </Button>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.map(review => (
              <Card key={review.id} className="p-4">
                <div className="flex gap-4">
                  <Link to={`/movie/${review.movie_id}`}>
                    {review.movie_poster ? (
                      <img 
                        src={`${IMAGE_BASE}${review.movie_poster}`} 
                        alt={review.movie_title} 
                        className="w-16 h-24 object-cover rounded" 
                      />
                    ) : (
                      <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                        <Film className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link 
                          to={`/movie/${review.movie_id}`}
                          className="font-semibold hover:underline line-clamp-1"
                        >
                          {review.movie_title}
                        </Link>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {review.rating && review.rating > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cinema-gold/20 rounded text-cinema-gold font-semibold text-xs">
                              <Star className="h-3 w-3 fill-current" />
                              {review.rating}/5
                            </span>
                          )}
                          {review.is_spoiler && (
                            <Badge variant="destructive" className="text-xs">Spoiler</Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditReview(review)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete your review for "{review.movie_title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReview(review.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {/* Full Review Text */}
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Write reviews using the Log button on movie/TV pages!
            </p>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <LogMediaModal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setEditingReview(null);
            loadReviews();
          }}
          mediaId={editingReview.movie_id}
          mediaTitle={editingReview.movie_title}
          mediaPoster={editingReview.movie_poster}
          mediaType="movie"
          initialRating={editingReview.rating || undefined}
        />
      )}

      {/* Sort Action Sheet */}
      <MobileActionSheet
        isOpen={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title="Sort Reviews"
        options={[
          { value: 'recent', label: 'Most Recent' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'highest', label: 'Highest Rated' },
          { value: 'lowest', label: 'Lowest Rated' },
          { value: 'title', label: 'Title A-Z' },
        ]}
        selectedValue={sortBy}
        onSelect={(v) => setSortBy(v as SortOption)}
      />
    </div>
  );
};

export default MyReviews;