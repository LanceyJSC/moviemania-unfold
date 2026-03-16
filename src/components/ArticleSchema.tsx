import { Helmet } from 'react-helmet-async';

interface ArticleSchemaProps {
  title: string;
  description: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  authorName?: string;
  slug: string;
  pathPrefix?: '/blog' | '/news';
  schemaType?: 'BlogPosting' | 'NewsArticle';
}

export const ArticleSchema = ({
  title,
  description,
  image,
  publishedTime,
  modifiedTime,
  authorName,
  slug,
  pathPrefix = '/blog',
  schemaType = 'BlogPosting'
}: ArticleSchemaProps) => {
  const canonicalUrl = `https://sceneburn.com${pathPrefix}/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "headline": title,
    "description": description,
    "image": image || 'https://sceneburn.com/sceneburn-logo.png',
    "datePublished": publishedTime,
    "dateModified": modifiedTime || publishedTime,
    "author": authorName ? {
      "@type": 'Person',
      "name": authorName
    } : {
      "@type": 'Organization',
      "name": 'SceneBurn'
    },
    "publisher": {
      "@type": 'Organization',
      "name": 'SceneBurn',
      "logo": {
        "@type": 'ImageObject',
        "url": 'https://sceneburn.com/sceneburn-logo.png'
      }
    },
    "mainEntityOfPage": {
      "@type": 'WebPage',
      "@id": canonicalUrl
    },
    "url": canonicalUrl
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
