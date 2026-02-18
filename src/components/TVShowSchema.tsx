import { Helmet } from 'react-helmet-async';
import { TVShow } from '@/lib/tmdb';

interface TVShowSchemaProps {
  tvShow: TVShow;
  posterUrl: string;
}

export const TVShowSchema = ({ tvShow, posterUrl }: TVShowSchemaProps) => {
  const firstAirDate = tvShow.first_air_date || '';
  const creators = tvShow.created_by?.map(creator => ({
    "@type": "Person",
    "name": creator.name
  })) || [];
  const actors = tvShow.credits?.cast?.slice(0, 5).map(actor => ({
    "@type": "Person",
    "name": actor.name
  })) || [];
  const genres = tvShow.genres?.map(g => g.name) || [];

  const schema = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": tvShow.name,
    "image": posterUrl,
    "description": tvShow.overview || `${tvShow.name} - Watch on SceneBurn`,
    "datePublished": firstAirDate,
    "creator": creators.length > 0 ? creators : undefined,
    "actor": actors.length > 0 ? actors : undefined,
    "genre": genres.length > 0 ? genres : undefined,
    "numberOfSeasons": tvShow.number_of_seasons,
    "numberOfEpisodes": tvShow.number_of_episodes,
    "aggregateRating": tvShow.vote_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": tvShow.vote_average.toFixed(1),
      "bestRating": "10",
      "worstRating": "0",
      "ratingCount": tvShow.vote_count
    } : undefined,
    "url": `https://sceneburn.com/tv/${tvShow.id}`
  };

  // Remove undefined values
  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(cleanSchema)}
      </script>
    </Helmet>
  );
};
