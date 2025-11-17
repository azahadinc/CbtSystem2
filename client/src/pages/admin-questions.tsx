import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Question, InsertQuestion } from "@shared/schema";
import { useRef } from "react";
import { useEffect } from "react";

export default function AdminQuestions() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("");

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ uploaded: number; total: number } | null>(null);

  // wire file input change
  useEffect(() => {
    const el = document.getElementById("questions-csv") as HTMLInputElement | null;
    if (!el) return;
    const onChange = async (e: Event) => {
      const input = e.currentTarget as HTMLInputElement;
      const file = input.files && input.files[0];
      if (!file) return;
      const text = await file.text();
      const rows: any[] = [];
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        alert("Empty CSV file");
        return;
      }
      // detect header
      const headerParts = lines[0].split(",").map((p) => p.trim());
      const hasHeader = headerParts.some((h) => /question/i.test(h) || /questionText/i.test(h) || /question_text/i.test(h));
      const startIndex = hasHeader ? 1 : 0;
      const cols = hasHeader ? headerParts : ["questionText","questionType","subject","difficulty","options","correctAnswer","points"];
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length === 0) continue;
        const obj: any = {};
        for (let c = 0; c < cols.length; c++) {
          obj[cols[c]] = parts[c] ?? "";
        }
        // normalize options
        if (obj.options && typeof obj.options === "string") {
          const v = obj.options;
          try { obj.options = JSON.parse(v); } catch { obj.options = v.split("|").map((s: string) => s.trim()).filter(Boolean); }
        }
        // coerce points
        if (obj.points) obj.points = Number(obj.points) || 1;
        rows.push(obj);
      }
      setPreviewRows(rows);
      input.value = "";
    };
    el.addEventListener("change", onChange as any);
    return () => el.removeEventListener("change", onChange as any);
  }, []);

  const uploadPreview = async (opts?: { chunkSize?: number }) => {
    const rows = previewRows;
    if (!rows || rows.length === 0) {
      alert("No rows to upload");
      return;
    }
    const chunkSize = opts?.chunkSize ?? 100;
    let uploaded = 0;
    setUploadProgress({ uploaded, total: rows.length });
    const errors: any[] = [];
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const resp = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        errors.push({ chunkIndex: i / chunkSize, error: txt });
        continue;
      }
      const body = await resp.json();
      uploaded += body.insertedCount || 0;
      if (body.errors && body.errors.length) errors.push(...body.errors);
      setUploadProgress({ uploaded, total: rows.length });
    }
    setUploadProgress(null);
    if (errors.length) {
      alert(`Upload completed with errors: ${errors.length} issues. Check console.`);
      // eslint-disable-next-line no-console
      console.error(errors);
    } else {
      alert(`Uploaded ${uploaded} questions`);
    }
    queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    setPreviewRows([]);
  };

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) =>
      apiRequest("DELETE", `/api/questions/${questionId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Question deleted",
        description: "The question has been successfully deleted.",
      });
    },
  });

  const subjects = questions
    ? Array.from(new Set(questions.map((q) => q.subject)))
    : [];

  const filteredQuestions = questions?.filter((q) =>
    filterSubject && filterSubject !== "__all__" ? q.subject === filterSubject : true
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">
            Manage your collection of exam questions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input id="questions-csv" type="file" accept="text/csv" className="hidden" />
          <Button
            variant="outline"
            onClick={() => {
              const el = document.getElementById("questions-csv") as HTMLInputElement | null;
              el?.click();
            }}
          >
            Upload CSV
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-question">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <QuestionForm
              onSuccess={() => {
                setIsCreateOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
              }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Preview rows and upload controls */}
      {previewRows && previewRows.length > 0 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">CSV Preview ({previewRows.length} rows)</h3>
                <p className="text-sm text-muted-foreground">Review parsed rows below before uploading. Invalid rows will be reported by the server.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setPreviewRows([])}>
                  Clear
                </Button>
                <Button onClick={() => uploadPreview({ chunkSize: 100 })}>
                  Upload All
                </Button>
              </div>
            </div>
            <div className="mt-4 overflow-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="p-2">Question</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Subject</th>
                    <th className="p-2">Difficulty</th>
                    <th className="p-2">Points</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 200).map((r, idx) => {
                    const validateRow = (row: any) => {
                      const errors: string[] = [];
                      if (!row.questionText || String(row.questionText).trim() === "") errors.push("questionText required");
                      const types = ["multiple-choice", "true-false", "short-answer"];
                      if (!types.includes(row.questionType)) errors.push("questionType invalid");
                      if (!row.subject || String(row.subject).trim() === "") errors.push("subject required");
                      const diffs = ["easy", "medium", "hard"];
                      if (!diffs.includes(row.difficulty)) errors.push("difficulty invalid");
                      if (!row.correctAnswer && row.correctAnswer !== 0) errors.push("correctAnswer required");
                      if (row.questionType === "multiple-choice") {
                        if (!Array.isArray(row.options) || row.options.length < 2) errors.push("options must be an array with >=2 items");
                      }
                      if (row.points && !(Number(row.points) > 0)) errors.push("points must be a positive number");
                      return { valid: errors.length === 0, errors };
                    };

                    const { valid, errors } = validateRow(r);

                    return (
                      <tr key={idx} className={`border-t ${!valid ? 'bg-yellow-50' : ''}`}>
                        <td className="p-2">
                          <input className="w-full rounded border px-2 py-1" value={r.questionText || ''} onChange={(e) => { const copy = [...previewRows]; copy[idx] = { ...copy[idx], questionText: e.target.value }; setPreviewRows(copy); }} />
                          {!valid && errors.length > 0 && <div className="text-xs text-destructive mt-1">{errors.join(', ')}</div>}
                        </td>
                        <td className="p-2">
                          <select className="rounded border px-2 py-1" value={r.questionType || 'multiple-choice'} onChange={(e) => { const copy = [...previewRows]; copy[idx] = { ...copy[idx], questionType: e.target.value }; setPreviewRows(copy); }}>
                            <option value="multiple-choice">multiple-choice</option>
                            <option value="true-false">true-false</option>
                            <option value="short-answer">short-answer</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input className="w-full rounded border px-2 py-1" value={r.subject || ''} onChange={(e) => { const copy = [...previewRows]; copy[idx] = { ...copy[idx], subject: e.target.value }; setPreviewRows(copy); }} />
                        </td>
                        <td className="p-2">
                          <select className="rounded border px-2 py-1" value={r.difficulty || 'medium'} onChange={(e) => { const copy = [...previewRows]; copy[idx] = { ...copy[idx], difficulty: e.target.value }; setPreviewRows(copy); }}>
                            <option value="easy">easy</option>
                            <option value="medium">medium</option>
                            <option value="hard">hard</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input type="number" min={1} className="w-24 rounded border px-2 py-1" value={r.points || 1} onChange={(e) => { const copy = [...previewRows]; copy[idx] = { ...copy[idx], points: Number(e.target.value) || 1 }; setPreviewRows(copy); }} />
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { const copy = [...previewRows]; copy.splice(idx, 1); setPreviewRows(copy); }}>Remove</Button>
                            {!valid && <Button size="sm" variant="default" onClick={() => { /* focus or no-op, user edits inline */ }}>Fix</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {previewRows.length > 200 && <p className="text-xs text-muted-foreground mt-2">Showing first 200 rows</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-4">
          <Label>Filter by Subject:</Label>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-48" data-testid="select-subject-filter">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterSubject && filterSubject !== "__all__" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterSubject("__all__")}
              data-testid="button-clear-filter"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredQuestions && filteredQuestions.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question) => (
                <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                  <TableCell className="font-medium">
                    {question.questionText}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{question.questionType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{question.subject}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        question.difficulty === "easy"
                          ? "default"
                          : question.difficulty === "medium"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {question.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{question.points}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteQuestionMutation.mutate(question.id)}
                      data-testid={`button-delete-${question.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Plus className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {filterSubject ? "No Questions Found" : "No Questions Yet"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {filterSubject
                ? `No questions found for ${filterSubject}`
                : "Get started by adding your first question."}
            </p>
            {!filterSubject && (
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-question">
                <Plus className="mr-2 h-4 w-4" />
                Add First Question
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuestionForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InsertQuestion>({
    questionText: "",
    questionType: "multiple-choice",
    subject: "",
    difficulty: "medium",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1,
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: InsertQuestion) => apiRequest("POST", "/api/questions", data),
    onSuccess: () => {
      toast({
        title: "Question added",
        description: "The question has been successfully added to the bank.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = { ...formData };
    if (formData.questionType === "true-false") {
      submitData.options = undefined;
    } else if (formData.questionType === "short-answer") {
      submitData.options = undefined;
    } else {
      submitData.options = formData.options?.filter((o) => o.trim());
      if (!submitData.options || submitData.options.length < 2) {
        toast({
          title: "Invalid options",
          description: "Please provide at least 2 options for multiple choice questions.",
          variant: "destructive",
        });
        return;
      }
    }
    
    createQuestionMutation.mutate(submitData);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...(formData.options || []), ""],
    });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options?.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add New Question</DialogTitle>
        <DialogDescription>
          Create a new question for your question bank
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 py-6">
        <div className="space-y-2">
          <Label htmlFor="questionText">Question Text *</Label>
          <Textarea
            id="questionText"
            placeholder="Enter your question here"
            value={formData.questionText}
            onChange={(e) =>
              setFormData({ ...formData, questionText: e.target.value })
            }
            required
            data-testid="textarea-question-text"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="questionType">Question Type *</Label>
            <Select
              value={formData.questionType}
              onValueChange={(value: any) =>
                setFormData({ ...formData, questionType: value })
              }
            >
              <SelectTrigger data-testid="select-question-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="true-false">True/False</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="e.g., Mathematics"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
              data-testid="input-question-subject"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: any) =>
                setFormData({ ...formData, difficulty: value })
              }
            >
              <SelectTrigger data-testid="select-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Points *</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={formData.points}
              onChange={(e) =>
                setFormData({ ...formData, points: parseInt(e.target.value) })
              }
              required
              data-testid="input-points"
            />
          </div>
        </div>

        {formData.questionType === "multiple-choice" && (
          <div className="space-y-2">
            <Label>Answer Options *</Label>
            <div className="space-y-2">
              {formData.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    data-testid={`input-option-${index}`}
                  />
                  {formData.options && formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      data-testid={`button-remove-option-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              data-testid="button-add-option"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="correctAnswer">Correct Answer *</Label>
          {formData.questionType === "true-false" ? (
            <Select
              value={formData.correctAnswer}
              onValueChange={(value) =>
                setFormData({ ...formData, correctAnswer: value })
              }
            >
              <SelectTrigger data-testid="select-correct-answer">
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="True">True</SelectItem>
                <SelectItem value="False">False</SelectItem>
              </SelectContent>
            </Select>
          ) : formData.questionType === "multiple-choice" ? (
            <Select
              value={formData.correctAnswer}
              onValueChange={(value) =>
                setFormData({ ...formData, correctAnswer: value })
              }
            >
              <SelectTrigger data-testid="select-correct-answer">
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                {formData.options
                  ?.filter((o) => o && o.trim().length > 0)
                  .map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  )) || []}
                {(!formData.options || formData.options.filter((o) => o && o.trim().length > 0).length === 0) && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No options added yet
                  </div>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="correctAnswer"
              placeholder="Enter the correct answer"
              value={formData.correctAnswer}
              onChange={(e) =>
                setFormData({ ...formData, correctAnswer: e.target.value })
              }
              required
              data-testid="input-correct-answer"
            />
          )}
        </div>
      </div>
      <DialogFooter>
        <Button
          type="submit"
          disabled={createQuestionMutation.isPending}
          data-testid="button-submit-question"
        >
          {createQuestionMutation.isPending ? "Adding..." : "Add Question"}
        </Button>
      </DialogFooter>
    </form>
  );
}
