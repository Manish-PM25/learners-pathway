import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, ChevronUp, ChevronDown, Lock, Edit2, GripVertical } from 'lucide-react';
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
  course_program_name: string;
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
  isEditing?: boolean;
}

interface PreAssessment {
  title: string;
  description: string;
  total_questions: number;
  passing_score: number;
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

  const [preAssessment, setPreAssessment] = useState<PreAssessment>({
    title: '',
    description: '',
    total_questions: 5,
    passing_score: 70
  });

  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      title: '',
      description: '',
      days_to_complete: 7,
      courses: [{ id: '1', title: '', description: '', duration_minutes: 30, course_program_name: '' }],
      assessment: { title: '', description: '', total_questions: 5, passing_score: 70 },
      isEditing: false
    },
    {
      id: '2',
      title: '',
      description: '',
      days_to_complete: 7,
      courses: [{ id: '1', title: '', description: '', duration_minutes: 30, course_program_name: '' }],
      assessment: { title: '', description: '', total_questions: 5, passing_score: 70 },
      isEditing: false
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
      courses: [{ id: '1', title: '', description: '', duration_minutes: 30, course_program_name: '' }],
      assessment: { title: '', description: '', total_questions: 5, passing_score: 70 },
      isEditing: false
    }]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 2) {
      toast({
        title: 'Minimum milestones required',
        description: 'You must have at least 2 milestones',
        variant: 'destructive',
      });
      return;
    }
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const moveMilestoneUp = (index: number) => {
    if (index === 0) return;
    const newMilestones = [...milestones];
    [newMilestones[index - 1], newMilestones[index]] = [newMilestones[index], newMilestones[index - 1]];
    setMilestones(newMilestones);
  };

  const moveMilestoneDown = (index: number) => {
    if (index === milestones.length - 1) return;
    const newMilestones = [...milestones];
    [newMilestones[index], newMilestones[index + 1]] = [newMilestones[index + 1], newMilestones[index]];
    setMilestones(newMilestones);
  };

  const toggleMilestoneEdit = (id: string) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, isEditing: !m.isEditing } : m));
  };

  const updateMilestone = (id: string, field: string, value: any) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addCourse = (milestoneId: string) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, courses: [...m.courses, { id: Date.now().toString(), title: '', description: '', duration_minutes: 30, course_program_name: '' }] }
        : m
    ));
  };

  const moveCourseUp = (milestoneId: string, courseIndex: number) => {
    if (courseIndex === 0) return;
    setMilestones(milestones.map(m => {
      if (m.id === milestoneId) {
        const newCourses = [...m.courses];
        [newCourses[courseIndex - 1], newCourses[courseIndex]] = [newCourses[courseIndex], newCourses[courseIndex - 1]];
        return { ...m, courses: newCourses };
      }
      return m;
    }));
  };

  const moveCourseDown = (milestoneId: string, courseIndex: number) => {
    setMilestones(milestones.map(m => {
      if (m.id === milestoneId) {
        if (courseIndex === m.courses.length - 1) return m;
        const newCourses = [...m.courses];
        [newCourses[courseIndex], newCourses[courseIndex + 1]] = [newCourses[courseIndex + 1], newCourses[courseIndex]];
        return { ...m, courses: newCourses };
      }
      return m;
    }));
  };

  const getAllUsedCourseNames = () => {
    const allCourses: string[] = [];
    milestones.forEach(m => {
      m.courses.forEach(c => {
        if (c.course_program_name.trim()) {
          allCourses.push(c.course_program_name.trim().toLowerCase());
        }
      });
    });
    return allCourses;
  };

  const isCourseNameUsed = (courseName: string, currentMilestoneId: string, currentCourseId: string) => {
    if (!courseName.trim()) return false;
    const lowerCourseName = courseName.trim().toLowerCase();
    
    for (const milestone of milestones) {
      for (const course of milestone.courses) {
        if (milestone.id === currentMilestoneId && course.id === currentCourseId) continue;
        if (course.course_program_name.trim().toLowerCase() === lowerCourseName) {
          return true;
        }
      }
    }
    return false;
  };

  const removeCourse = (milestoneId: string, courseId: string) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, courses: m.courses.filter(c => c.id !== courseId) }
        : m
    ));
  };

  const updateCourse = (milestoneId: string, courseId: string, field: string, value: any) => {
    if (field === 'course_program_name' && value.trim()) {
      if (isCourseNameUsed(value, milestoneId, courseId)) {
        toast({
          title: 'Duplicate course',
          description: 'This course/program is already added to another milestone',
          variant: 'destructive',
        });
        return;
      }
    }
    
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

  const updatePreAssessment = (field: string, value: any) => {
    setPreAssessment({ ...preAssessment, [field]: value });
  };

  const handleSubmit = async (isPublished: boolean) => {
    if (!user) return;

    if (milestones.length < 2) {
      toast({
        title: 'Minimum milestones required',
        description: 'You must create at least 2 milestones',
        variant: 'destructive',
      });
      return;
    }

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
              content_url: course.course_program_name,
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

      {/* Pre-Assessment */}
      <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Pre-Assessment</CardTitle>
              <CardDescription>Initial assessment before starting the pathway</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pre-assessment-title">Assessment Title</Label>
            <Input
              id="pre-assessment-title"
              value={preAssessment.title}
              onChange={(e) => updatePreAssessment('title', e.target.value)}
              placeholder="e.g., Baseline Knowledge Assessment"
            />
          </div>
          <div>
            <Label htmlFor="pre-assessment-description">Description</Label>
            <Textarea
              id="pre-assessment-description"
              value={preAssessment.description}
              onChange={(e) => updatePreAssessment('description', e.target.value)}
              placeholder="Describe what this assessment evaluates..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pre-total-questions">Total Questions</Label>
              <Input
                id="pre-total-questions"
                type="number"
                value={preAssessment.total_questions}
                onChange={(e) => updatePreAssessment('total_questions', parseInt(e.target.value) || 5)}
                min={1}
              />
            </div>
            <div>
              <Label htmlFor="pre-passing-score">Passing Score (%)</Label>
              <Input
                id="pre-passing-score"
                type="number"
                value={preAssessment.passing_score}
                onChange={(e) => updatePreAssessment('passing_score', parseInt(e.target.value) || 70)}
                min={0}
                max={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Learning Milestones</h2>
            <p className="text-sm text-muted-foreground">Minimum 2 milestones required</p>
          </div>
        </div>
        
        {milestones.map((milestone, milestoneIndex) => (
          <Card key={milestone.id} className="relative overflow-hidden border-2 hover:border-primary/30 transition-colors">
            {/* Lock indicator for progression */}
            {milestoneIndex > 0 && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                <span>Unlocks after Milestone {milestoneIndex}</span>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex flex-col gap-1 mt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveMilestoneUp(milestoneIndex)}
                      disabled={milestoneIndex === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveMilestoneDown(milestoneIndex)}
                      disabled={milestoneIndex === milestones.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {milestoneIndex + 1}
                      </div>
                      <CardTitle className="text-xl">Milestone {milestoneIndex + 1}</CardTitle>
                    </div>
                    <CardDescription>Configure courses and assessment for this milestone</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMilestoneEdit(milestone.id)}
                    title="Edit milestone"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {milestones.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMilestone(milestone.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Milestone Basic Info */}
              {milestone.isEditing && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border-2 border-dashed">
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
              )}

              {!milestone.isEditing && milestone.title && (
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold mb-1">{milestone.title}</h4>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Duration: {milestone.days_to_complete} days</p>
                </div>
              )}

              {/* Courses */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  Courses / Programs
                </h4>
                <div className="space-y-3">
                  {milestone.courses.map((course, courseIndex) => (
                    <Card key={course.id} className="bg-gradient-to-br from-card to-muted/30 border-2 hover:border-primary/20 transition-colors">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1 pt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveCourseUp(milestone.id, courseIndex)}
                              disabled={courseIndex === 0}
                              title="Move up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveCourseDown(milestone.id, courseIndex)}
                              disabled={courseIndex === milestone.courses.length - 1}
                              title="Move down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-primary">Course {courseIndex + 1}</span>
                              {milestone.courses.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCourse(milestone.id, course.id)}
                                  className="text-destructive hover:text-destructive h-7"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                            
                            <div>
                              <Label className="text-xs">Course/Program Name *</Label>
                              <Input
                                value={course.course_program_name}
                                onChange={(e) => updateCourse(milestone.id, course.id, 'course_program_name', e.target.value)}
                                placeholder="e.g., Introduction to React"
                                className={isCourseNameUsed(course.course_program_name, milestone.id, course.id) ? 'border-destructive' : ''}
                              />
                              {isCourseNameUsed(course.course_program_name, milestone.id, course.id) && (
                                <p className="text-xs text-destructive mt-1">This course is already used in another milestone</p>
                              )}
                            </div>

                            <div>
                              <Label className="text-xs">Title</Label>
                              <Input
                                value={course.title}
                                onChange={(e) => updateCourse(milestone.id, course.id, 'title', e.target.value)}
                                placeholder="Display title for this course"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Textarea
                                value={course.description}
                                onChange={(e) => updateCourse(milestone.id, course.id, 'description', e.target.value)}
                                placeholder="What will learners gain from this course?"
                                rows={2}
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={course.duration_minutes}
                                onChange={(e) => updateCourse(milestone.id, course.id, 'duration_minutes', parseInt(e.target.value) || 0)}
                                placeholder="30"
                                min={1}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    onClick={() => addCourse(milestone.id)}
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course/Program
                  </Button>
                </div>
              </div>

              {/* Assessment */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Lock className="w-4 h-4 text-secondary" />
                  </div>
                  <h4 className="font-semibold">Milestone Assessment</h4>
                </div>
                <div className="space-y-3 p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                  <div>
                    <Label className="text-xs">Assessment Title</Label>
                    <Input
                      value={milestone.assessment.title}
                      onChange={(e) => updateAssessment(milestone.id, 'title', e.target.value)}
                      placeholder="e.g., Milestone 1 Knowledge Check"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={milestone.assessment.description}
                      onChange={(e) => updateAssessment(milestone.id, 'description', e.target.value)}
                      placeholder="What does this assessment test?"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    <span>Learners must pass this to unlock {milestoneIndex < milestones.length - 1 ? 'the next milestone' : 'pathway completion'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={addMilestone} variant="outline" className="w-full border-dashed border-2 h-12 hover:border-primary hover:bg-primary/5">
          <Plus className="w-5 h-5 mr-2" />
          Add Another Milestone
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end sticky bottom-4 bg-background/95 backdrop-blur-sm p-6 border-2 rounded-xl shadow-lg">
        <Button
          variant="outline"
          onClick={() => navigate('/creator')}
          disabled={loading}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 px-8 shadow-lg"
        >
          Publish Pathway
        </Button>
      </div>
    </div>
  );
};

export default CreatePathway;
