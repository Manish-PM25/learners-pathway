import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, BookOpen, ArrowRight } from 'lucide-react';

interface Pathway {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
  enrollments?: { count: number }[];
  milestones?: { count: number }[];
}

const BrowsePathways = () => {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchPathways();
  }, [user]);

  const fetchPathways = async () => {
    const { data, error } = await supabase
      .from('pathways')
      .select(`
        *,
        profiles:creator_id(full_name),
        enrollments:enrollments(count),
        milestones:milestones(count)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pathways:', error);
    } else {
      setPathways(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pathways...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Browse Learning Pathways
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover curated learning experiences designed by experts
          </p>
        </div>

        {pathways.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No pathways available yet</h3>
              <p className="text-muted-foreground">Check back soon for new learning opportunities!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pathways.map((pathway) => (
              <Card
                key={pathway.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 overflow-hidden"
                onClick={() => navigate(`/pathway/${pathway.id}`)}
              >
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                  {pathway.image_url ? (
                    <img 
                      src={pathway.image_url} 
                      alt={pathway.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-20 h-20 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-background/90 text-foreground hover:bg-background">
                      Course
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                      {pathway.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>4.3</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{pathway.enrollments?.[0]?.count || 0} enrolled</span>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {pathway.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      By {pathway.profiles?.full_name || 'Unknown'}
                    </span>
                    <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                      View <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePathways;
