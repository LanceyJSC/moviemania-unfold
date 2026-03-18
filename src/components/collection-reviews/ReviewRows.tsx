import { Link } from 'react-router-dom';
import { Flame, Film, Trash2, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { CollectionReview, formatReviewDate, getPosterUrl } from './utils';

const flameClasses = ['text-primary', 'text-primary/90', 'text-primary/80', 'text-primary/70', 'text-primary/60'];

export const FlameRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: rating }).map((_, index) => (
      <Flame key={index} className={`h-3 w-3 fill-current ${flameClasses[index] || flameClasses[4]}`} />
    ))}
  </div>
);

export const DeleteReviewButton = ({
  review,
  onDelete,
}: {
  review: CollectionReview;
  onDelete: (id: string) => void;
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3 w-3" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete review?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently remove your review for &quot;{review.movie_title}&quot;.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => onDelete(review.id)}>Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const MovieReviewRow = ({
  review,
  onDelete,
}: {
  review: CollectionReview;
  onDelete: (id: string) => void;
}) => {
  const posterUrl = getPosterUrl(review.movie_poster);
  const detailPath = `/${review.media_type === 'tv' ? 'tv' : 'movie'}/${review.movie_id}/reviews`;

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/5">
      <Link to={detailPath} className="shrink-0">
        <div className="h-[72px] w-12 overflow-hidden rounded bg-muted">
          {posterUrl ? (
            <img src={posterUrl} alt={`${review.movie_title} poster`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={detailPath} className="hover:underline">
          <div className="flex items-center gap-1.5">
            {review.media_type === 'tv' ? (
              <Tv className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <Film className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            <p className="truncate text-sm font-medium text-foreground">{review.movie_title}</p>
          </div>
        </Link>

        {review.rating != null && review.rating > 0 && (
          <div className="mt-1">
            <FlameRating rating={review.rating} />
          </div>
        )}

        {review.review_text && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{review.review_text}</p>
        )}

        <p className="mt-1 text-[10px] text-muted-foreground/70">{formatReviewDate(review.created_at)}</p>
      </div>

      <div className="shrink-0">
        <DeleteReviewButton review={review} onDelete={onDelete} />
      </div>
    </div>
  );
};

export const ReviewEntryRow = ({
  review,
  label,
  onDelete,
}: {
  review: CollectionReview;
  label: string;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="flex gap-3 rounded-lg border border-border/70 bg-background/80 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {review.rating != null && review.rating > 0 && <FlameRating rating={review.rating} />}
        </div>

        {review.review_text?.trim() ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.review_text}</p>
        ) : (
          <p className="mt-1 text-xs italic text-muted-foreground">Rating saved without written review.</p>
        )}

        <p className="mt-2 text-[10px] text-muted-foreground/70">{formatReviewDate(review.created_at)}</p>
      </div>

      <div className="shrink-0">
        <DeleteReviewButton review={review} onDelete={onDelete} />
      </div>
    </div>
  );
};
