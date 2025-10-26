import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, BookOpen, TrendingUp, Trophy, Search } from 'lucide-react';

interface EnrolledPathway {
  id: string;
  pathway_id: string;
  enrolled_at: string;
  completed_at: string | null;
  pathways: {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
  };
  progress?: number;
}

const ConsumerDashboard = () => {
  const { user } = useAuth();
  const [enrolledPathways, setEnrolledPathways] = useState<EnrolledPathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    completed: 0,
    achievements: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          pathways(id, title, description, image_url)
        `)
        .eq('user_id', user.id);

      const { data: achievements } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', user.id);

      if (enrollments) {
        setEnrolledPathways(enrollments as EnrolledPathway[]);
        setStats({
          totalEnrolled: enrollments.length,
          completed: enrollments.filter(e => e.completed_at).length,
          achievements: achievements?.length || 0
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Learning Journey</h1>
          <p className="text-muted-foreground">Track your progress and continue learning</p>
        </div>
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary">
          <Link to="/browse" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Browse Pathways
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Pathways</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEnrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.achievements}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Continue Learning</CardTitle>
          <CardDescription>Pick up where you left off</CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledPathways.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pathways yet</h3>
              <p className="text-muted-foreground mb-6">Browse and enroll in learning pathways to start your journey</p>
              <Button asChild>
                <Link to="/browse">Browse Pathways</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrolledPathways.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  to={`/pathway/${enrollment.pathway_id}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {enrollment.pathways.title[0]}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">
                            {enrollment.pathways.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-1">
                            {enrollment.pathways.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{enrollment.progress || 0}%</span>
                            </div>
                            <Progress value={enrollment.progress || 0} className="h-2" />
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

export default ConsumerDashboard;
