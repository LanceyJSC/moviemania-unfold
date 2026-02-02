import { useState, useEffect } from 'react';
import { X, Save, Eye, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { BlogPost, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from '@/hooks/useBlogPosts';

interface BlogEditorProps {
  post?: BlogPost | null;
  onClose: () => void;
  onSave?: () => void;
}

export const BlogEditor = ({ post, onClose, onSave }: BlogEditorProps) => {
  const { user } = useAuth();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    status: 'draft' as 'draft' | 'published',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        featured_image: post.featured_image || '',
        status: post.status as 'draft' | 'published' || 'draft',
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        seo_keywords: post.seo_keywords?.join(', ') || ''
      });
    }
  }, [post]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleSave = async (publish = false) => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    const postData = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt || null,
      content: formData.content || null,
      featured_image: formData.featured_image || null,
      status: publish ? 'published' : formData.status,
      published_at: publish ? new Date().toISOString() : (post?.published_at || null),
      seo_title: formData.seo_title || null,
      seo_description: formData.seo_description || null,
      seo_keywords: formData.seo_keywords ? formData.seo_keywords.split(',').map(k => k.trim()) : null,
      author_id: user?.id || null
    };

    try {
      if (post) {
        await updatePost.mutateAsync({ id: post.id, ...postData });
        toast.success(publish ? 'Article published!' : 'Article updated!');
      } else {
        await createPost.mutateAsync(postData);
        toast.success(publish ? 'Article published!' : 'Draft saved!');
      }
      onSave?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save article');
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      await deletePost.mutateAsync(post.id);
      toast.success('Article deleted');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete article');
    }
  };

  const isLoading = createPost.isPending || updatePost.isPending || deletePost.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-foreground">
            {post ? 'Edit Article' : 'New Article'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {post && (
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSave(true)} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6 overflow-y-auto" style={{ height: 'calc(100vh - 60px)' }}>
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title"
                className="text-xl font-semibold"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/blog/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary for previews..."
                rows={2}
              />
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label htmlFor="featured_image">Featured Image URL</Label>
              <Input
                id="featured_image"
                value={formData.featured_image}
                onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              {formData.featured_image && (
                <img 
                  src={formData.featured_image} 
                  alt="Preview" 
                  className="w-full max-w-md h-48 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your article content here...

Use # for headers
Use ## for subheaders
Use ### for smaller headers

Regular text becomes paragraphs."
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="Custom title for search engines (leave empty to use article title)"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seo_title.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="Description for search results..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seo_description.length}/155 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_keywords">Keywords</Label>
                  <Input
                    id="seo_keywords"
                    value={formData.seo_keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords: e.target.value }))}
                    placeholder="movies, reviews, best films 2025"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate keywords with commas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
