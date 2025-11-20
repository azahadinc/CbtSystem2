import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function AdminPrintout() {
  const { data: students } = useQuery<any[]>({ queryKey: ["/api/students"] });
  const { data: results } = useQuery<any[]>({ queryKey: ["/api/results"] });

  // Map studentId to result for quick lookup
  const resultMap = results?.reduce((acc, r) => {
    acc[r.studentId] = r;
    return acc;
  }, {} as Record<string, any>) || {};

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Student Printout</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Score (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students?.map((student) => {
                const result = resultMap[student.studentId];
                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.class || "-"}</TableCell>
                    <TableCell>{result?.examTitle || "-"}</TableCell>
                    <TableCell>{result ? `${result.percentage}%` : "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              window.print();
            }}
          >
            Print All
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
