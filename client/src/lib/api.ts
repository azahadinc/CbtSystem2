import { z } from "zod";

const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  studentId: z.string(),
});

export type Student = z.infer<typeof studentSchema>;

export const getStudents = async (): Promise<Student[]> => {
  const r = await fetch("/api/students");
  if (!r.ok) {
    throw new Error("Failed to fetch students");
  }
  const data = await r.json();
  return z.array(studentSchema).parse(data);
};

export const addStudent = async (student: { name: string; studentId: string }): Promise<Student> => {
  const resp = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(student),
  });
  if (!resp.ok) {
    throw new Error("Failed to add student");
  }
  return studentSchema.parse(await resp.json());
};

export const uploadStudents = async (students: { name: string; studentId: string }[]): Promise<Student[]> => {
    const resp = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(students),
    });
    if (!resp.ok) {
        throw new Error("Upload failed");
    }
    return z.array(studentSchema).parse(await resp.json());
};


export const updateStudent = async (id: string, student: { name: string; studentId: string }): Promise<Student> => {
    const resp = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
    });
    if (!resp.ok) {
        throw new Error("Update failed");
    }
    return studentSchema.parse(await resp.json());
};

export const deleteStudent = async (id: string): Promise<void> => {
    const resp = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (!resp.ok && resp.status !== 204) {
        throw new Error("Delete failed");
    }
};
