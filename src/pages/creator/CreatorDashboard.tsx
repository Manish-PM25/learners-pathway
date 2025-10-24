import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Pathway {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  created_at: string;
  enrollments?: { count: number }[];
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPathways: 0,
    publishedPathways: 0,
    totalEnrollments: 0
  });

  useEffect(() => {
    const fetchPathways = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('pathways')
        .select(`
          *,
          enrollments(count)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPathways(data);
        
        const totalEnrollments = data.reduce((sum, p) => 
          sum + (p.enrollments?.[0]?.count || 0), 0
        );
        
        setStats({
          totalPathways: data.length,
          publishedPathways: data.filter(p => p.is_published).length,
          totalEnrollments
        });
      }
      
      setLoading(false);
    };

    fetchPathways();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your pathways...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage and create learning pathways</p>
        </div>
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary">
          <Link to="/creator/pathway/new" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Pathway
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pathways</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPathways}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Sparkles className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.publishedPathways}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Pathways</CardTitle>
          <CardDescription>Manage and edit your learning pathways</CardDescription>
        </CardHeader>
        <CardContent>
          {pathways.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pathways yet</h3>
              <p className="text-muted-foreground mb-6">Create your first learning pathway to get started</p>
              <Button asChild>
                <Link to="/creator/pathway/new">Create Your First Pathway</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pathways.map((pathway) => (
                <Link
                  key={pathway.id}
                  to={`/creator/pathway/${pathway.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{pathway.title}</h3>
                            <Badge variant={pathway.is_published ? "default" : "secondary"}>
                              {pathway.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">
                            {pathway.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {pathway.enrollments?.[0]?.count || 0} enrolled
                            </div>
                            <div>
                              Created {new Date(pathway.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorDashboard;
