import { Helmet } from 'react-helmet-async';
import { Movie, MovieWithCollection } from '@/lib/tmdb';

interface MovieSchemaProps {
  movie: Movie | MovieWithCollection;
  posterUrl: string;
}

export const MovieSchema = ({ movie, posterUrl }: MovieSchemaProps) => {
  const releaseDate = movie.release_date || '';
  const director = movie.credits?.crew?.find(person => person.job === 'Director');
  const actors = movie.credits?.cast?.slice(0, 5).map(actor => ({
    "@type": "Person",
    "name": actor.name
  })) || [];
  const genres = movie.genres?.map(g => g.name) || [];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "image": posterUrl,
    "description": movie.overview || `${movie.title} - Watch on SceneBurn`,
    "datePublished": releaseDate,
    "director": director ? {
      "@type": "Person",
      "name": director.name
    } : undefined,
    "actor": actors.length > 0 ? actors : undefined,
    "genre": genres.length > 0 ? genres : undefined,
    "aggregateRating": movie.vote_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": movie.vote_average.toFixed(1),
      "bestRating": "10",
      "worstRating": "0",
      "ratingCount": movie.vote_count
    } : undefined,
    "duration": movie.runtime ? `PT${movie.runtime}M` : undefined,
    "url": `https://sceneburn.app/movie/${movie.id}`
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
