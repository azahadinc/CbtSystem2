import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, Eye, CheckCircle, XCircle } from "lucide-react";
import type { Result, Exam } from "@shared/schema";

export default function AdminResults() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: results, isLoading: resultsLoading } = useQuery<Result[]>({
    queryKey: ["/api/results"],
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  const filteredResults = results?.filter(
    (result) =>
      result.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getExamTitle = (examId: string) => {
    return exams?.find((e) => e.id === examId)?.title || "Unknown Exam";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Results</h1>
        <p className="text-muted-foreground">
          View and analyze student exam results
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by student name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-results"
        />
      </div>

      {resultsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredResults && filteredResults.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                <TableHead className="text-right">Print</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults
                .sort(
                  (a, b) =>
                    new Date(b.completedAt).getTime() -
                    new Date(a.completedAt).getTime()
                )
                .map((result) => (
                  <TableRow key={result.id} data-testid={`row-result-${result.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.studentId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getExamTitle(result.examId)}</TableCell>
                    <TableCell>
                      {result.score}/{result.totalPoints}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-lg font-semibold ${
                          result.passed ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {result.percentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {result.passed ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Passed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(result.completedAt).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">
                          {new Date(result.completedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/results/${result.id}`}>
                        <Button variant="ghost" size="icon" data-testid={`button-view-${result.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const printContent = `Student: ${result.studentName}\nID: ${result.studentId}\nExam: ${getExamTitle(result.examId)}\nScore: ${result.score}/${result.totalPoints}\nPercentage: ${result.percentage}%\nStatus: ${result.passed ? "Passed" : "Failed"}\nCompleted: ${new Date(result.completedAt).toLocaleString()}`;
                          const win = window.open('', '', 'width=600,height=400');
                          win.document.write(`<pre>${printContent}</pre>`);
                          win.print();
                          win.close();
                        }}
                        data-testid={`button-print-${result.id}`}
                      >
                        Print
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
            <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {searchQuery ? "No Results Found" : "No Results Yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Results will appear here once students complete exams"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
