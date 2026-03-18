export const IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

export const reviewFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv-show', label: 'Series' },
  { value: 'episode', label: 'Episodes' },
] as const;

export interface CollectionReview {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
  is_spoiler: boolean | null;
  media_type: string | null;
  season_number: number | null;
  episode_number: number | null;
}

export interface GroupedTVReview {
  movieId: number;
  title: string;
  poster: string | null;
  seriesReview: CollectionReview | null;
  episodeReviews: CollectionReview[];
  sortDate: string;
}

export type ReviewTimelineItem =
  | { type: 'movie'; review: CollectionReview; sortDate: string }
  | { type: 'tv'; group: GroupedTVReview; sortDate: string };

export const getPosterUrl = (poster: string | null) => {
  if (!poster) return null;
  return poster.startsWith('http') ? poster : `${IMAGE_BASE}${poster}`;
};

export const getSeriesName = (title: string) => {
  return title.replace(/\s*[-–]\s*S\d+E\d+.*$/i, '').replace(/\s+S\d+E\d+.*$/i, '').trim();
};

export const formatReviewDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const buildGroupedTVReviews = (reviews: CollectionReview[]): GroupedTVReview[] => {
  const groups = new Map<number, GroupedTVReview>();

  for (const review of reviews) {
    if (review.media_type !== 'tv') continue;

    const existing = groups.get(review.movie_id) ?? {
      movieId: review.movie_id,
      title: getSeriesName(review.movie_title),
      poster: review.movie_poster,
      seriesReview: null,
      episodeReviews: [],
      sortDate: review.created_at,
    };

    existing.poster = existing.poster ?? review.movie_poster;
    existing.title = existing.title || getSeriesName(review.movie_title);
    existing.sortDate = existing.sortDate > review.created_at ? existing.sortDate : review.created_at;

    if (review.episode_number == null) {
      existing.seriesReview = review;
    } else {
      existing.episodeReviews.push(review);
    }

    groups.set(review.movie_id, existing);
  }

  return [...groups.values()].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
};

export const buildReviewTimeline = (reviews: CollectionReview[]): ReviewTimelineItem[] => {
  const movieItems: ReviewTimelineItem[] = reviews
    .filter((review) => review.media_type !== 'tv')
    .map((review) => ({ type: 'movie', review, sortDate: review.created_at }));

  const tvItems: ReviewTimelineItem[] = buildGroupedTVReviews(reviews).map((group) => ({
    type: 'tv',
    group,
    sortDate: group.sortDate,
  }));

  return [...movieItems, ...tvItems].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
};

export const getGroupPreviewText = (group: GroupedTVReview) => {
  const allReviews: CollectionReview[] = [];

  if (group.seriesReview) {
    allReviews.push(group.seriesReview);
  }

  allReviews.push(...group.episodeReviews);
  allReviews.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const latestWithText = allReviews.find((review) => review.review_text?.trim());

  if (latestWithText?.review_text) {
    return latestWithText.review_text.trim();
  }

  if (group.episodeReviews.length > 0) {
    return `${group.episodeReviews.length} episode review${group.episodeReviews.length === 1 ? '' : 's'} logged.`;
  }

  return 'Series review logged.';
};

export const groupEpisodeReviewsBySeason = (episodeReviews: CollectionReview[]) => {
  const seasonMap = new Map<number, CollectionReview[]>();

  for (const review of episodeReviews) {
    const seasonNumber = review.season_number ?? 0;
    const existing = seasonMap.get(seasonNumber) ?? [];
    existing.push(review);
    seasonMap.set(seasonNumber, existing);
  }

  return [...seasonMap.entries()]
    .sort(([seasonA], [seasonB]) => seasonA - seasonB)
    .map(([seasonNumber, reviews]) => ({
      seasonNumber,
      reviews: [...reviews].sort((a, b) => {
        if ((a.episode_number ?? 0) !== (b.episode_number ?? 0)) {
          return (a.episode_number ?? 0) - (b.episode_number ?? 0);
        }

        return b.created_at.localeCompare(a.created_at);
      }),
    }));
};
