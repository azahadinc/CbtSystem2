import {
  type Question,
  type InsertQuestion,
  type Exam,
  type InsertExam,
  type ExamSession,
  type InsertExamSession,
  type Result,
  type InsertResult,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;

  // Exams
  getExams(): Promise<Exam[]>;
  getExam(id: string): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: string, data: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: string): Promise<void>;

  // Exam Sessions
  getExamSession(id: string): Promise<ExamSession | undefined>;
  createExamSession(session: InsertExamSession): Promise<ExamSession>;
  updateExamSession(
    id: string,
    data: Partial<ExamSession>
  ): Promise<ExamSession | undefined>;

  // Results
  getResults(): Promise<Result[]>;
  getResult(id: string): Promise<Result | undefined>;
  getResultBySessionId(sessionId: string): Promise<Result | undefined>;
  createResult(result: InsertResult): Promise<Result>;
}

export class MemStorage implements IStorage {
  private questions: Map<string, Question>;
  private exams: Map<string, Exam>;
  private examSessions: Map<string, ExamSession>;
  private results: Map<string, Result>;

  constructor() {
    this.questions = new Map();
    this.exams = new Map();
    this.examSessions = new Map();
    this.results = new Map();
  }

  // Questions
  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    this.questions.delete(id);
  }

  // Exams
  async getExams(): Promise<Exam[]> {
    return Array.from(this.exams.values());
  }

  async getExam(id: string): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const id = randomUUID();
    
    // Calculate total points from questions
    let totalPoints = 0;
    for (const questionId of insertExam.questionIds) {
      const question = await this.getQuestion(questionId);
      if (question) {
        totalPoints += question.points;
      }
    }

    const exam: Exam = {
      ...insertExam,
      id,
      totalPoints,
      isActive: true,
      createdAt: new Date(),
    };
    this.exams.set(id, exam);
    return exam;
  }

  async updateExam(
    id: string,
    data: Partial<Exam>
  ): Promise<Exam | undefined> {
    const exam = this.exams.get(id);
    if (!exam) return undefined;

    const updatedExam = { ...exam, ...data };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id: string): Promise<void> {
    this.exams.delete(id);
  }

  // Exam Sessions
  async getExamSession(id: string): Promise<ExamSession | undefined> {
    return this.examSessions.get(id);
  }

  async createExamSession(
    insertSession: InsertExamSession
  ): Promise<ExamSession> {
    const id = randomUUID();
    const session: ExamSession = {
      ...insertSession,
      id,
      startedAt: new Date(),
      endedAt: null,
      answers: insertSession.answers || {},
      currentQuestionIndex: insertSession.currentQuestionIndex || 0,
      isCompleted: false,
      timeRemaining: null,
    };
    this.examSessions.set(id, session);
    return session;
  }

  async updateExamSession(
    id: string,
    data: Partial<ExamSession>
  ): Promise<ExamSession | undefined> {
    const session = this.examSessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...data };
    this.examSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Results
  async getResults(): Promise<Result[]> {
    return Array.from(this.results.values());
  }

  async getResult(id: string): Promise<Result | undefined> {
    return this.results.get(id);
  }

  async getResultBySessionId(sessionId: string): Promise<Result | undefined> {
    return Array.from(this.results.values()).find(
      (result) => result.sessionId === sessionId
    );
  }

  async createResult(insertResult: InsertResult): Promise<Result> {
    const id = randomUUID();
    const result: Result = {
      ...insertResult,
      id,
      completedAt: new Date(),
    };
    this.results.set(id, result);
    return result;
  }
}

export const storage = new MemStorage();
