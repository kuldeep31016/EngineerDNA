import { z } from "zod";
import { interviewRoleSchema } from "./interview";

/**
 * Module 13 — Learning Roadmap. A personalized, visual learning path for a
 * target role: ordered stages of skill nodes (foundations → mastery), each with
 * why it matters, a project to build it, resources, and a time estimate. Node
 * status is derived from the developer's evidence, so progress auto-updates as
 * new evidence is collected — the LLM proposes the path, evidence marks it.
 */

export const roadmapStatusSchema = z.enum(["done", "learning", "todo"]);
export type RoadmapStatus = z.infer<typeof roadmapStatusSchema>;

export const roadmapNodeSchema = z.object({
  id: z.string(),
  skill: z.string(),
  category: z.string(),
  status: roadmapStatusSchema,
  why: z.string(),
  project: z.string(),
  resources: z.array(z.string()),
  estimate: z.string(),
});
export type RoadmapNode = z.infer<typeof roadmapNodeSchema>;

export const roadmapStageSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  nodes: z.array(roadmapNodeSchema),
});
export type RoadmapStage = z.infer<typeof roadmapStageSchema>;

export const learningRoadmapSchema = z.object({
  available: z.boolean(),
  goal: z.string(),
  summary: z.string(),
  progress: z.number(),
  totalSkills: z.number(),
  completedSkills: z.number(),
  stages: z.array(roadmapStageSchema),
  generatedAt: z.string(),
});
export type LearningRoadmap = z.infer<typeof learningRoadmapSchema>;

/** Request body to generate (or reuse) a roadmap for a role. */
export const generateRoadmapRequestSchema = z.object({
  role: interviewRoleSchema,
  regenerate: z.boolean().optional(),
});
export type GenerateRoadmapInput = z.infer<typeof generateRoadmapRequestSchema>;
