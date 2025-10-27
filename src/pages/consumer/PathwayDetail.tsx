import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Star, Users, BookOpen, Clock, Video, FileText, 
  Award, Lock, Unlock, ChevronDown, ChevronUp, Sparkles 
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  order_index: number;
  course_program_name: string | null;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  passing_score: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  order_index: number;
  days_to_complete: number;
  courses: Course[];
  assessments: Assessment[];
}

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
  milestones: Milestone[];
  learning_outcomes: { outcome_text: string; order_index: number }[];
}

const PathwayDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !id) return;
    fetchPathwayDetails();
    checkEnrollment();
  }, [user, id]);

  const fetchPathwayDetails = async () => {
    const { data, error } = await supabase
      .from('pathways')
      .select(`
        *,
        profiles:creator_id(full_name),
        milestones(
          *,
          courses(*),
          assessments(*)
        ),
        learning_outcomes(*)
      `)
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error fetching pathway:', error);
      toast.error('Failed to load pathway');
    } else {
      setPathway(data);
    }
    setLoading(false);
  };

  const checkEnrollment = async () => {
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user?.id)
      .eq('pathway_id', id)
      .maybeSingle();

    setIsEnrolled(!!data);
  };

  const handleEnroll = async () => {
    if (!user || !id) return;

    const { error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        pathway_id: id
      });

    if (error) {
      toast.error('Failed to enroll');
    } else {
      toast.success('Successfully enrolled!');
      setIsEnrolled(true);
      navigate('/');
    }
  };

  const toggleMilestone = (milestoneId: string) => {
    setExpandedMilestones(prev =>
      prev.includes(milestoneId)
        ? prev.filter(id => id !== milestoneId)
        : [...prev, milestoneId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pathway...</p>
        </div>
      </div>
    );
  }

  if (!pathway) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center p-8">
          <CardContent>
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Pathway not found</h3>
            <Button onClick={() => navigate('/browse')} className="mt-4">
              Browse Pathways
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDuration = pathway.milestones.reduce(
    (acc, m) => acc + (m.courses?.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) || 0),
    0
  );
  const totalModules = pathway.milestones.length;
  const totalCourses = pathway.milestones.reduce((acc, m) => acc + (m.courses?.length || 0), 0);
  const totalAssessments = pathway.milestones.reduce((acc, m) => acc + (m.assessments?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  Course
                </Badge>
                <span className="text-sm">Updated {new Date(pathway.updated_at).toLocaleDateString()}</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{pathway.title}</h1>
              <p className="text-lg mb-4">By {pathway.profiles?.full_name || 'Unknown'}</p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.3</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  <span>11.5K enrolled</span>
                </div>
                <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500">
                  Most enrolled
                </Badge>
              </div>
            </div>
            <div className="lg:col-span-1">
              {pathway.image_url && (
                <img 
                  src={pathway.image_url} 
                  alt={pathway.title}
                  className="rounded-lg shadow-xl w-full h-48 object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* AI Tutor Callout */}
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Get Started with AI Tutor</h3>
                    <p className="text-sm text-muted-foreground">
                      Get instant explanations, step-by-step learning guidance, and customised learning tailored just for you.
                    </p>
                  </div>
                  <Button variant="outline" className="flex-shrink-0">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Tutor
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About this pathway</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{pathway.description}</p>
                  </CardContent>
                </Card>

                {pathway.learning_outcomes && pathway.learning_outcomes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Learning Outcomes</CardTitle>
                      <CardDescription>What you'll learn in this pathway</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {pathway.learning_outcomes
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((outcome, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>{outcome.outcome_text}</span>
                            </li>
                          ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                {/* Pre-Assessment Section */}
                {pathway.milestones.length > 0 && pathway.milestones[0].assessments && pathway.milestones[0].assessments.length > 0 && (
                  <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                          <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-primary text-white hover:bg-primary/90">
                              Pre-Assessment
                            </Badge>
                            <Badge variant="outline">
                              {pathway.milestones[0].assessments[0].total_questions} Questions
                            </Badge>
                          </div>
                          <CardTitle className="text-xl mb-2">
                            {pathway.milestones[0].assessments[0].title}
                          </CardTitle>
                          <CardDescription className="text-base">
                            {pathway.milestones[0].assessments[0].description || 
                             `Test your knowledge before starting this learning pathway. Passing score: ${pathway.milestones[0].assessments[0].passing_score}%`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>~{pathway.milestones[0].assessments[0].total_questions * 2} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary" />
                            <span>Passing: {pathway.milestones[0].assessments[0].passing_score}%</span>
                          </div>
                        </div>
                        <Button size="lg" className="gap-2">
                          <FileText className="w-4 h-4" />
                          Start Pre-Assessment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Learning Modules */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Learning Modules</h3>
                    <Badge variant="secondary">{pathway.milestones.length} Modules</Badge>
                  </div>
                  {pathway.milestones
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((milestone, index) => {
                    const isExpanded = expandedMilestones.includes(milestone.id);
                    const isLocked = index > 0;
                    const totalDuration = milestone.courses?.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) || 0;
                    const itemCount = (milestone.courses?.length || 0) + (milestone.assessments?.length || 0);

                    return (
                      <Card key={milestone.id} className={isLocked ? 'border-muted' : 'border-primary/30'}>
                        <CardHeader 
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => toggleMilestone(milestone.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {isLocked ? (
                                <Lock className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <Unlock className="w-5 h-5 text-primary" />
                              )}
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {index + 1}. {milestone.title}
                                </CardTitle>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                                  </span>
                                  <span>• {itemCount} items</span>
                                </div>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent className="pt-0">
                            <Separator className="mb-4" />
                            <div className="space-y-3">
                              {milestone.courses
                                ?.sort((a, b) => a.order_index - b.order_index)
                                .map((course) => (
                                  <div key={course.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                                    <Video className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="font-medium">{course.title}</p>
                                      {course.description && (
                                        <p className="text-sm text-muted-foreground">{course.description}</p>
                                      )}
                                      {course.course_program_name && (
                                        <Badge variant="outline" className="mt-1">
                                          {course.course_program_name}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {course.duration_minutes}m
                                    </span>
                                  </div>
                                ))}
                              {milestone.assessments?.map((assessment) => (
                                <div key={assessment.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                                  <FileText className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-medium">{assessment.title}</p>
                                    {assessment.description && (
                                      <p className="text-sm text-muted-foreground">{assessment.description}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {assessment.total_questions} questions • {assessment.passing_score}% to pass
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="comments">
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Comments coming soon!</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEnrolled ? (
                  <>
                    <Progress value={0} className="h-2" />
                    <Button className="w-full" size="lg">
                      Resume
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" size="lg" onClick={handleEnroll}>
                    Enroll Now
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="font-semibold">Earn 15 Points</p>
                    <p className="text-sm text-muted-foreground">by completing this course</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <Clock className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <BookOpen className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <p className="text-sm text-muted-foreground">Modules</p>
                    <p className="font-semibold">{totalModules}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <Video className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <p className="text-sm text-muted-foreground">Courses</p>
                    <p className="font-semibold">{totalCourses}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <FileText className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <p className="text-sm text-muted-foreground">Tests</p>
                    <p className="font-semibold">{totalAssessments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                    {pathway.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold">{pathway.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">Creator</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathwayDetail;
