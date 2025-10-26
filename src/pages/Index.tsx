import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, BookOpen, ArrowRight, GraduationCap } from 'lucide-react';

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

const Index = () => {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPathways();
  }, []);

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
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching pathways:', error);
    } else {
      setPathways(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your Journey to Mastery Starts Here
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Discover curated learning pathways designed by experts. Learn at your own pace and achieve your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg px-8"
                onClick={() => navigate('/browse')}
              >
                Browse All Pathways
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="text-lg px-8"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 bg-white/10 border-white/30 hover:bg-white/20 text-white"
                  onClick={() => navigate('/browse')}
                >
                  Browse Pathways
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Featured Pathways Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Featured Learning Pathways
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our most popular and highly-rated learning experiences
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading pathways...</p>
            </div>
          </div>
        ) : pathways.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No pathways available yet</h3>
              <p className="text-muted-foreground">Check back soon for new learning opportunities!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            
            <div className="text-center">
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/browse')}
              >
                View All Pathways
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-background to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Expert-Curated Content</CardTitle>
                <CardDescription>
                  Learn from carefully designed pathways created by industry professionals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Flexible Learning</CardTitle>
                <CardDescription>
                  Progress at your own pace with structured milestones and assessments
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Track Your Progress</CardTitle>
                <CardDescription>
                  Monitor your achievements and earn certificates upon completion
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
