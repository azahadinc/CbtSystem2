import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminStudents() {
  const [studentsList, setStudentsList] = useState<{ id: string; name: string; studentId: string }[]>([]);

  const fetchStudents = async () => {
    try {
      const r = await fetch("/api/students");
      if (!r.ok) return;
      const data = await r.json();
      setStudentsList(data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground">
          Manage student data and enrollments
        </p>
      </div>

      {/* Students management (add / upload) */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add a student manually or upload a CSV with columns "name,studentId".
            </p>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input id="student-name" placeholder="Student name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Student ID</label>
                <Input id="student-id" placeholder="student-123" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  const nameEl = document.getElementById("student-name") as HTMLInputElement | null;
                  const idEl = document.getElementById("student-id") as HTMLInputElement | null;
                  const name = nameEl?.value?.trim();
                  const studentId = idEl?.value?.trim();
                  if (!name || !studentId) {
                    alert("Please provide both name and student id");
                    return;
                  }

                  try {
                    const resp = await fetch("/api/students", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name, studentId }),
                    });
                      if (!resp.ok) throw new Error("Failed to add student");
                      alert("Student added");
                      if (nameEl) nameEl.value = "";
                      if (idEl) idEl.value = "";
                      fetchStudents();
                  } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e);
                    alert("Failed to add student");
                  }
                }}
              >
                Add Student
              </Button>

              <input
                id="students-csv"
                type="file"
                accept="text/csv"
                className="hidden"
                onChange={async (e) => {
                  const input = e.currentTarget as HTMLInputElement;
                  const file = input.files && input.files[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
                    const rows: { name?: string; studentId?: string }[] = [];
                    for (let i = 0; i < lines.length; i++) {
                      const parts = lines[i].split(",").map((p) => p.trim());
                      if (parts.length < 2) continue;
                      // skip header if it looks like header
                      if (i === 0 && /name/i.test(parts[0]) && /student/i.test(parts[1])) continue;
                      rows.push({ name: parts[0], studentId: parts[1] });
                    }
                    if (rows.length === 0) {
                      alert("No valid rows found in CSV");
                      return;
                    }
                    const resp = await fetch("/api/students", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(rows),
                    });
                    if (!resp.ok) throw new Error("Upload failed");
                    alert("Uploaded " + rows.length + " students");
                    input.value = "";
                    fetchStudents();
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error(err);
                    alert("Failed to upload CSV");
                  }
                }}
              />

              <Button
                variant="outline"
                onClick={() => {
                  const el = document.getElementById("students-csv") as HTMLInputElement | null;
                  el?.click();
                }}
              >
                Upload CSV
              </Button>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">CSV format: one student per line, columns "name,studentId". Header row is optional.</p>
            </div>

            {/* Students table */}
            <div className="mt-4">
              <div className="overflow-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-2">Name</th>
                      <th className="p-2">Student ID</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-2">{s.name}</td>
                        <td className="p-2">{s.studentId}</td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const newName = prompt("Edit name", s.name) || s.name;
                              const newSid = prompt("Edit student id", s.studentId) || s.studentId;
                              try {
                                const resp = await fetch(`/api/students/${s.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ name: newName, studentId: newSid }),
                                });
                                if (!resp.ok) throw new Error("Update failed");
                                fetchStudents();
                              } catch (e) {
                                // eslint-disable-next-line no-console
                                console.error(e);
                                alert("Failed to update student");
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (!confirm(`Delete ${s.name}?`)) return;
                              try {
                                const resp = await fetch(`/api/students/${s.id}`, { method: "DELETE" });
                                if (!resp.ok && resp.status !== 204) throw new Error("Delete failed");
                                fetchStudents();
                              } catch (e) {
                                // eslint-disable-next-line no-console
                                console.error(e);
                                alert("Failed to delete student");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
