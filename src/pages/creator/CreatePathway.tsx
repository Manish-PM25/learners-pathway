import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LearningOutcome {
  id: string;
  text: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  xp_points: number;
  content_url: string;
}

interface Assessment {
  title: string;
  description: string;
  total_questions: number;
  passing_score: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  days_to_complete: number;
  courses: Course[];
  assessment: Assessment;
}

const CreatePathway = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [pathwayData, setPathwayData] = useState({
    title: '',
    description: '',
    image_url: '',
  });

  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([
    { id: '1', text: '' }
  ]);

  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      title: '',
      description: '',
      days_to_complete: 7,
      courses: [{ id: '1', title: '', description: '', duration_minutes: 30, xp_points: 100, content_url: '' }],
      assessment: { title: '', description: '', total_questions: 5, passing_score: 70 }
    }
  ]);

  const addLearningOutcome = () => {
    setLearningOutcomes([...learningOutcomes, { id: Date.now().toString(), text: '' }]);
  };

  const removeLearningOutcome = (id: string) => {
    setLearningOutcomes(learningOutcomes.filter(lo => lo.id !== id));
  };

  const updateLearningOutcome = (id: string, text: string) => {
    setLearningOutcomes(learningOutcomes.map(lo => lo.id === id ? { ...lo, text } : lo));
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      id: Date.now().toString(),
      title: '',
      description: '',
      days_to_complete: 7,
      courses: [{ id: '1', title: '', description: '', duration_minutes: 30, xp_points: 100, content_url: '' }],
      assessment: { title: '', description: '', total_questions: 5, passing_score: 70 }
    }]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: string, value: any) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addCourse = (milestoneId: string) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, courses: [...m.courses, { id: Date.now().toString(), title: '', description: '', duration_minutes: 30, xp_points: 100, content_url: '' }] }
        : m
    ));
  };

  const removeCourse = (milestoneId: string, courseId: string) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, courses: m.courses.filter(c => c.id !== courseId) }
        : m
    ));
  };

  const updateCourse = (milestoneId: string, courseId: string, field: string, value: any) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, courses: m.courses.map(c => c.id === courseId ? { ...c, [field]: value } : c) }
        : m
    ));
  };

  const updateAssessment = (milestoneId: string, field: string, value: any) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, assessment: { ...m.assessment, [field]: value } }
        : m
    ));
  };

  const handleSubmit = async (isPublished: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      // Insert pathway
      const { data: pathway, error: pathwayError } = await supabase
        .from('pathways')
        .insert({
          title: pathwayData.title,
          description: pathwayData.description,
          image_url: pathwayData.image_url,
          creator_id: user.id,
          is_published: isPublished
        })
        .select()
        .single();

      if (pathwayError) throw pathwayError;

      // Insert learning outcomes
      if (learningOutcomes.some(lo => lo.text.trim())) {
        const outcomesData = learningOutcomes
          .filter(lo => lo.text.trim())
          .map((lo, index) => ({
            pathway_id: pathway.id,
            outcome_text: lo.text,
            order_index: index
          }));

        const { error: outcomesError } = await supabase
          .from('learning_outcomes')
          .insert(outcomesData);

        if (outcomesError) throw outcomesError;
      }

      // Insert milestones, courses, and assessments
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];

        const { data: milestoneData, error: milestoneError } = await supabase
          .from('milestones')
          .insert({
            pathway_id: pathway.id,
            title: milestone.title,
            description: milestone.description,
            days_to_complete: milestone.days_to_complete,
            order_index: i
          })
          .select()
          .single();

        if (milestoneError) throw milestoneError;

        // Insert courses for this milestone
        if (milestone.courses.some(c => c.title.trim())) {
          const coursesData = milestone.courses
            .filter(c => c.title.trim())
            .map((course, index) => ({
              milestone_id: milestoneData.id,
              title: course.title,
              description: course.description,
              duration_minutes: course.duration_minutes,
              xp_points: course.xp_points,
              content_url: course.content_url,
              order_index: index
            }));

          const { error: coursesError } = await supabase
            .from('courses')
            .insert(coursesData);

          if (coursesError) throw coursesError;
        }

        // Insert assessment for this milestone
        if (milestone.assessment.title.trim()) {
          const { error: assessmentError } = await supabase
            .from('assessments')
            .insert({
              milestone_id: milestoneData.id,
              title: milestone.assessment.title,
              description: milestone.assessment.description,
              total_questions: milestone.assessment.total_questions,
              passing_score: milestone.assessment.passing_score
            });

          if (assessmentError) throw assessmentError;
        }
      }

      toast({
        title: 'Success!',
        description: `Pathway ${isPublished ? 'published' : 'saved as draft'} successfully`,
      });

      navigate('/creator');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create Learning Pathway</h1>
        <p className="text-muted-foreground">Design a comprehensive learning experience with milestones, courses, and assessments</p>
      </div>

      {/* Pathway Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pathway Details</CardTitle>
          <CardDescription>Basic information about your learning pathway</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Pathway Title *</Label>
            <Input
              id="title"
              value={pathwayData.title}
              onChange={(e) => setPathwayData({ ...pathwayData, title: e.target.value })}
              placeholder="e.g., Full Stack Web Development"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={pathwayData.description}
              onChange={(e) => setPathwayData({ ...pathwayData, description: e.target.value })}
              placeholder="Describe what learners will achieve..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="image_url">Cover Image URL</Label>
            <Input
              id="image_url"
              value={pathwayData.image_url}
              onChange={(e) => setPathwayData({ ...pathwayData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
          <CardDescription>What will learners be able to do after completing this pathway?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {learningOutcomes.map((outcome, index) => (
            <div key={outcome.id} className="flex gap-2">
              <Input
                value={outcome.text}
                onChange={(e) => updateLearningOutcome(outcome.id, e.target.value)}
                placeholder={`Learning outcome ${index + 1}`}
              />
              {learningOutcomes.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLearningOutcome(outcome.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button onClick={addLearningOutcome} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Learning Outcome
          </Button>
        </CardContent>
      </Card>

      {/* Milestones */}
      <div className="space-y-6 mb-8">
        {milestones.map((milestone, milestoneIndex) => (
          <Card key={milestone.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Milestone {milestoneIndex + 1}</CardTitle>
                  <CardDescription>Define a learning milestone with courses and assessment</CardDescription>
                </div>
                {milestones.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMilestone(milestone.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Milestone Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>Milestone Title *</Label>
                  <Input
                    value={milestone.title}
                    onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                    placeholder="e.g., Frontend Fundamentals"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={milestone.description}
                    onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                    placeholder="Describe this milestone..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Days to Complete</Label>
                  <Input
                    type="number"
                    value={milestone.days_to_complete}
                    onChange={(e) => updateMilestone(milestone.id, 'days_to_complete', parseInt(e.target.value) || 7)}
                    min={1}
                  />
                </div>
              </div>

              {/* Courses */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Courses / Modules</h4>
                <div className="space-y-4">
                  {milestone.courses.map((course, courseIndex) => (
                    <Card key={course.id} className="bg-muted/50">
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Course {courseIndex + 1}</span>
                          {milestone.courses.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCourse(milestone.id, course.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={course.title}
                          onChange={(e) => updateCourse(milestone.id, course.id, 'title', e.target.value)}
                          placeholder="Course title"
                        />
                        <Textarea
                          value={course.description}
                          onChange={(e) => updateCourse(milestone.id, course.id, 'description', e.target.value)}
                          placeholder="Course description"
                          rows={2}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Duration (min)</Label>
                            <Input
                              type="number"
                              value={course.duration_minutes}
                              onChange={(e) => updateCourse(milestone.id, course.id, 'duration_minutes', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">XP Points</Label>
                            <Input
                              type="number"
                              value={course.xp_points}
                              onChange={(e) => updateCourse(milestone.id, course.id, 'xp_points', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Content URL</Label>
                            <Input
                              value={course.content_url}
                              onChange={(e) => updateCourse(milestone.id, course.id, 'content_url', e.target.value)}
                              placeholder="URL"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    onClick={() => addCourse(milestone.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </div>
              </div>

              {/* Assessment */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Milestone Assessment</h4>
                <div className="space-y-3">
                  <Input
                    value={milestone.assessment.title}
                    onChange={(e) => updateAssessment(milestone.id, 'title', e.target.value)}
                    placeholder="Assessment title"
                  />
                  <Textarea
                    value={milestone.assessment.description}
                    onChange={(e) => updateAssessment(milestone.id, 'description', e.target.value)}
                    placeholder="Assessment description"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Total Questions</Label>
                      <Input
                        type="number"
                        value={milestone.assessment.total_questions}
                        onChange={(e) => updateAssessment(milestone.id, 'total_questions', parseInt(e.target.value) || 5)}
                        min={1}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Passing Score (%)</Label>
                      <Input
                        type="number"
                        value={milestone.assessment.passing_score}
                        onChange={(e) => updateAssessment(milestone.id, 'passing_score', parseInt(e.target.value) || 70)}
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={addMilestone} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end sticky bottom-4 bg-background/95 backdrop-blur p-4 border rounded-lg">
        <Button
          variant="outline"
          onClick={() => navigate('/creator')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit(false)}
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          Publish Pathway
        </Button>
      </div>
    </div>
  );
};

export default CreatePathway;
