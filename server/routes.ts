import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertQuestionSchema,
  insertExamSchema,
  insertExamSessionSchema,
  type Question,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin auth routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body as { username?: string; password?: string };
      if (!username || !password) {
        return res.status(400).json({ error: "username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // store minimal session info
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).session = (req as any).session || {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).session.userId = user.id;
      } catch (e) {
        // ignore session set failure
      }

      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = (req as any).session;
      if (s && typeof s.destroy === "function") {
        s.destroy(() => {
          res.json({ ok: true });
        });
      } else {
        // clear userId if possible
        if (s) s.userId = undefined;
        res.json({ ok: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  app.get("/api/admin/me", async (req, res) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = (req as any).session;
      const uid = s && s.userId;
      if (!uid) return res.status(401).json({ error: "Not authenticated" });
      const user = await storage.getUserByUsername((await storage.getUserByUsername("Admin"))?.username || "");
      // return minimal info
      res.json({ id: uid, username: user?.username || "Admin" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  // Questions API
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Exams API
  app.get("/api/exams", async (req, res) => {
    try {
      const exams = await storage.getExams();
      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) {
        return res.status(404).json({ error: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exam" });
    }
  });

  app.get("/api/exams/:id/questions", async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) {
        return res.status(404).json({ error: "Exam not found" });
      }

      const questions: Question[] = [];
      for (const questionId of exam.questionIds) {
        const question = await storage.getQuestion(questionId);
        if (question) {
          questions.push(question);
        }
      }

      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exam questions" });
    }
  });

  app.post("/api/exams", async (req, res) => {
    try {
      const validatedData = insertExamSchema.parse(req.body);
      const exam = await storage.createExam(validatedData);
      res.status(201).json(exam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create exam" });
    }
  });

  app.patch("/api/exams/:id", async (req, res) => {
    try {
      const exam = await storage.updateExam(req.params.id, req.body);
      if (!exam) {
        return res.status(404).json({ error: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ error: "Failed to update exam" });
    }
  });

  app.delete("/api/exams/:id", async (req, res) => {
    try {
      await storage.deleteExam(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete exam" });
    }
  });

  // Exam Sessions API
  app.get("/api/exam-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getExamSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Exam session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exam session" });
    }
  });

  app.post("/api/exam-sessions", async (req, res) => {
    try {
      const validatedData = insertExamSessionSchema.parse(req.body);
      const session = await storage.createExamSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create exam session" });
    }
  });

  app.patch("/api/exam-sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateExamSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Exam session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update exam session" });
    }
  });

  app.post("/api/exam-sessions/:id/submit", async (req, res) => {
    try {
      const session = await storage.getExamSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Exam session not found" });
      }

      if (session.isCompleted) {
        const existingResult = await storage.getResultBySessionId(session.id);
        if (existingResult) {
          return res.json(existingResult);
        }
      }

      const exam = await storage.getExam(session.examId);
      if (!exam) {
        return res.status(404).json({ error: "Exam not found" });
      }

      // Get all questions for this exam
      const questions: Question[] = [];
      for (const questionId of exam.questionIds) {
        const question = await storage.getQuestion(questionId);
        if (question) {
          questions.push(question);
        }
      }

      // Grade the exam
      const answers = req.body.answers || session.answers || {};
      const correctAnswers: Record<string, boolean> = {};
      let score = 0;

      for (const question of questions) {
        const studentAnswer = answers[question.id];
        const isCorrect =
          studentAnswer &&
          studentAnswer.trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase();
        correctAnswers[question.id] = isCorrect;
        if (isCorrect) {
          score += question.points;
        }
      }

      const percentage = Math.round((score / exam.totalPoints) * 100);
      const passed = percentage >= exam.passingScore;

      // Mark session as completed
      await storage.updateExamSession(session.id, {
        isCompleted: true,
        endedAt: new Date(),
        answers,
      });

      // Create result
      const result = await storage.createResult({
        sessionId: session.id,
        examId: exam.id,
        studentName: session.studentName,
        studentId: session.studentId,
        score,
        totalPoints: exam.totalPoints,
        percentage,
        passed,
        answers,
        correctAnswers,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit exam" });
    }
  });

  // Results API
  app.get("/api/results", async (req, res) => {
    try {
      const results = await storage.getResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  app.get("/api/results/:id", async (req, res) => {
    try {
      const result = await storage.getResult(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Result not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch result" });
    }
  });

  // Students API - simple in-memory student management
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const payload = req.body;

      if (Array.isArray(payload)) {
        // array of {name, studentId}
        const rows = payload as { name?: string; studentId?: string }[];
        const toCreate = rows
          .filter((r) => r && r.name && r.studentId)
          .map((r) => ({ name: r.name as string, studentId: r.studentId as string }));
        const created = await storage.createStudents(toCreate);
        return res.status(201).json(created);
      }

      if (payload && typeof payload === "object") {
        const { name, studentId } = payload as { name?: string; studentId?: string };
        if (!name || !studentId) {
          return res.status(400).json({ error: "name and studentId required" });
        }
        const created = await storage.createStudent({ name, studentId });
        return res.status(201).json(created);
      }

      res.status(400).json({ error: "Invalid payload" });
    } catch (error) {
      res.status(500).json({ error: "Failed to create students" });
    }
  });

  app.patch("/api/students/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body as { name?: string; studentId?: string };
      const updated = await storage.updateStudent(id, data as any);
      if (!updated) return res.status(404).json({ error: "Student not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteStudent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
