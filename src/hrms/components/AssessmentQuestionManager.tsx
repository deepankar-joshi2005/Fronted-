import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Search,
  Edit
} from "lucide-react";
import { questionBankService, type Question } from "@/api/questionBankService";
import { assessmentService, type AssessmentQuestion } from "@/api/assessmentService";
import { toast } from "sonner";

interface AssessmentQuestionManagerProps {
  assessmentId: string;
  currentQuestions: AssessmentQuestion[];
  onQuestionsUpdate: (questions: AssessmentQuestion[]) => void;
  grade: string;
  subject: string;
  modules: string[];
  disabled?: boolean;
}

export default function AssessmentQuestionManager({
  assessmentId,
  currentQuestions,
  onQuestionsUpdate,
  grade,
  subject,
  modules,
  disabled = false
}: AssessmentQuestionManagerProps) {
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [answerTypeFilter, setAnswerTypeFilter] = useState<string>("all");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [showAddQuestions, setShowAddQuestions] = useState(false);

  // Load available questions
  useEffect(() => {
    loadAvailableQuestions();
  }, [grade, subject, modules]);

  // Filter questions based on search and filters
  useEffect(() => {
    let filtered = availableQuestions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by difficulty
    if (difficultyFilter && difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    // Filter by answer type
    if (answerTypeFilter && answerTypeFilter !== 'all') {
      filtered = filtered.filter(q => q.answerType === answerTypeFilter);
    }

    // Exclude already selected questions
    const currentQuestionIds = currentQuestions.map(q => 
      typeof q.questionId === 'string' ? q.questionId : q.questionId._id
    );
    filtered = filtered.filter(q => !currentQuestionIds.includes(q._id));

    setFilteredQuestions(filtered);
  }, [availableQuestions, searchTerm, difficultyFilter, answerTypeFilter, currentQuestions]);

  const loadAvailableQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionBankService.getQuestions({
        grade,
        subject,
        module: modules[0], // Use first module for now
        page: 1,
        limit: 100 // Load more questions for selection
      });
      setAvailableQuestions(response.data.questions);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load available questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestions = () => {
    if (selectedQuestions.size === 0) {
      toast.error("Please select at least one question");
      return;
    }

    const newQuestions: AssessmentQuestion[] = Array.from(selectedQuestions).map((questionId, index) => {
      return {
        questionId: questionId,
        order: currentQuestions.length + index + 1,
        marks: 1 // Default marks
      };
    });

    const updatedQuestions = [...currentQuestions, ...newQuestions];
    onQuestionsUpdate(updatedQuestions);
    setSelectedQuestions(new Set());
    setShowAddQuestions(false);
    toast.success(`${newQuestions.length} question(s) added successfully`);
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = currentQuestions.filter((_, i) => i !== index);
    // Reorder remaining questions
    const reorderedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      order: i + 1
    }));
    onQuestionsUpdate(reorderedQuestions);
    toast.success("Question removed successfully");
  };

  const handleUpdateMarks = (index: number, marks: number) => {
    const updatedQuestions = currentQuestions.map((q, i) => 
      i === index ? { ...q, marks } : q
    );
    onQuestionsUpdate(updatedQuestions);
  };

  // const handleReorderQuestions = (fromIndex: number, toIndex: number) => {
  //   const updatedQuestions = [...currentQuestions];
  //   const [movedQuestion] = updatedQuestions.splice(fromIndex, 1);
  //   updatedQuestions.splice(toIndex, 0, movedQuestion);
    
  //   // Reorder all questions
  //   const reorderedQuestions = updatedQuestions.map((q, i) => ({
  //     ...q,
  //     order: i + 1
  //   }));
    
  //   onQuestionsUpdate(reorderedQuestions);
  // };

  const handleSaveQuestions = async () => {
    try {
      setSaving(true);
      await assessmentService.updateAssessmentQuestions(assessmentId, currentQuestions);
      toast.success("Questions updated successfully");
    } catch (error) {
      console.error("Error saving questions:", error);
      toast.error("Failed to update questions");
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const getQuestionText = (question: AssessmentQuestion) => {
    if (typeof question.questionId === 'string') {
      const foundQuestion = availableQuestions.find(q => q._id === question.questionId);
      return foundQuestion?.questionText || "Question not found";
    }
    return question.questionId.questionText;
  };

  return (
    <div className="space-y-6">
      {/* Current Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              Assessment Questions ({currentQuestions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddQuestions(!showAddQuestions)}
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Questions
              </Button>
              <Button
                onClick={handleSaveQuestions}
                disabled={saving || disabled}
                size="sm"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No questions added yet. Click "Add Questions" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestions.map((question, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <Badge variant="outline">Q{question.order}</Badge>
                        <Badge variant="secondary">{question.marks} mark{question.marks !== 1 ? 's' : ''}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {getQuestionText(question)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="flex items-center gap-1">
                        <Label htmlFor={`marks-${index}`} className="text-xs">Marks:</Label>
                        <Input
                          id={`marks-${index}`}
                          type="number"
                          min="1"
                          max="10"
                          value={question.marks}
                          onChange={(e) => handleUpdateMarks(index, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-xs"
                          disabled={disabled}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveQuestion(index)}
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Questions Panel */}
      {showAddQuestions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Add Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <Label htmlFor="search">Search Questions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search question text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="min-w-32">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Tough">Tough</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-32">
                <Label htmlFor="answerType">Answer Type</Label>
                <Select value={answerTypeFilter} onValueChange={setAnswerTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="radio">Single right answer</SelectItem>
                    <SelectItem value="checkbox">Multiple right answers</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Available Questions */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading questions...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions found matching your criteria.</p>
                  </div>
                ) : (
                  filteredQuestions.map((question) => (
                    <div
                      key={question._id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedQuestions.has(question._id)}
                          onCheckedChange={() => toggleQuestionSelection(question._id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {question.difficulty}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {question.answerType}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {question.questionText}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {selectedQuestions.size} question(s) selected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddQuestions(false);
                    setSelectedQuestions(new Set());
                    setSearchTerm("");
                    setDifficultyFilter("");
                    setAnswerTypeFilter("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddQuestions}
                  disabled={selectedQuestions.size === 0}
                >
                  Add Selected Questions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
