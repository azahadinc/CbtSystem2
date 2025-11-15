import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen, CheckCircle } from "lucide-react";
import type { Exam } from "@shared/schema";

export default function StudentPortal() {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    enabled: isLoggedIn,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim() && studentId.trim()) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Student Login</CardTitle>
                <CardDescription>
                  Enter your details to access available exams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Full Name</Label>
                    <Input
                      id="studentName"
                      type="text"
                      placeholder="Enter your full name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      data-testid="input-student-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="Enter your student ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      data-testid="input-student-id"
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="button-login">
                    Continue to Exams
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {studentName}</h1>
            <p className="text-muted-foreground">Student ID: {studentId}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsLoggedIn(false)}
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-semibold">Available Exams</h2>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : exams && exams.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {exams
                .filter((exam) => exam.isActive)
                .map((exam) => (
                  <Card
                    key={exam.id}
                    className="hover-elevate"
                    data-testid={`card-exam-${exam.id}`}
                  >
                    <CardHeader>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <CardTitle className="text-xl">{exam.title}</CardTitle>
                        <Badge variant="secondary" data-testid={`badge-subject-${exam.id}`}>
                          {exam.subject}
                        </Badge>
                      </div>
                      {exam.description && (
                        <CardDescription>{exam.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{exam.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{exam.questionIds.length} questions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Passing: {exam.passingScore}%
                        </span>
                      </div>
                      <Link href={`/exam/${exam.id}/start?studentName=${encodeURIComponent(studentName)}&studentId=${encodeURIComponent(studentId)}`}>
                        <Button className="w-full" data-testid={`button-start-exam-${exam.id}`}>
                          Start Exam
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No Exams Available</h3>
                <p className="text-sm text-muted-foreground">
                  There are currently no active exams. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
