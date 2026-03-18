import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Layers3, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReviewEntryRow } from './ReviewRows';
import {
  GroupedTVReview,
  formatReviewDate,
  getGroupPreviewText,
  getPosterUrl,
  groupEpisodeReviewsBySeason,
} from './utils';

export const TVReviewGroupCard = ({
  group,
  onDelete,
}: {
  group: GroupedTVReview;
  onDelete: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const seasons = useMemo(() => groupEpisodeReviewsBySeason(group.episodeReviews), [group.episodeReviews]);

  const summaryParts = [
    group.seriesReview ? '1 series review' : null,
    group.episodeReviews.length > 0
      ? `${group.episodeReviews.length} episode review${group.episodeReviews.length === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean);

  const previewText = getGroupPreviewText(group);
  const posterUrl = getPosterUrl(group.poster);

  return (
    <Card className="overflow-hidden border-border/80">
      <div className="flex gap-3 p-4">
        <div className="h-[84px] w-14 shrink-0 overflow-hidden rounded-md bg-muted">
          {posterUrl ? (
            <img src={posterUrl} alt={`${group.title} poster`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Tv className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Tv className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-sm font-semibold text-foreground">{group.title}</p>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {summaryParts.join(' · ') || 'TV reviews'} · Updated {formatReviewDate(group.sortDate)}
          </p>

          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{previewText}</p>
        </div>

        <div className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isOpen ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-muted/20 p-4">
          <div className="space-y-4">
            {group.seriesReview && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <Layers3 className="h-3.5 w-3.5" />
                  Series review
                </div>
                <ReviewEntryRow review={group.seriesReview} label="Overall series review" onDelete={onDelete} />
              </section>
            )}

            {seasons.map((season) => (
              <section key={season.seasonNumber} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {season.seasonNumber > 0 ? `Season ${season.seasonNumber}` : 'Specials'}
                </p>
                <div className="space-y-2">
                  {season.reviews.map((review) => (
                    <ReviewEntryRow
                      key={review.id}
                      review={review}
                      label={`Episode ${review.episode_number}`}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
