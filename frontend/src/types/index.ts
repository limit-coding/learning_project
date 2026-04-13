export interface CurrentKnowledge {
  programming_languages: string[];
  completed_courses: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningGoals {
  target_skills: string[];
  specific_topics: string[];
}

export interface CareerDirection {
  target_role: string;
  preferred_language: string;
  industry: string;
}

export interface UserProfile {
  id?: number;
  current_knowledge: CurrentKnowledge;
  learning_goals: LearningGoals;
  career_direction: CareerDirection;
}

export interface Course {
  id: number;
  course_code: string;
  title: string;
  institution: string;
  description: string;
  difficulty_level: string;
  estimated_hours: number;
  programming_languages: string[];
  topics: string[];
  prerequisites: string[];
  domain: string;
  url: string;
  platform: string;
  rating: number;
}

export interface ScoreBreakdown {
  language_match: number;
  difficulty_match: number;
  domain_relevance: number;
  prerequisite_fit: number;
}

export interface Recommendation {
  course: Course;
  match_score: number;
  recommendation_reason: string;
  score_breakdown: ScoreBreakdown;
}

export interface RoadmapNode {
  slug: string;
  title: string;
  summary?: string | null;
  difficulty?: string | null;
  is_mastered: boolean;
}

export interface RoadmapEdge {
  source: string;
  target: string;
  relation_type: string;
}

export interface RoadmapResponse {
  id: number;
  user_goal: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  created_at: string;
}

export interface CourseNode {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  difficulty?: string | null;
  category?: string | null;
  is_active: number;
}

export interface ResourceBrief {
  id: number;
  title: string;
  url?: string | null;
  resource_type?: string | null;
}

export interface CourseNodeDetail extends CourseNode {
  resources: ResourceBrief[];
  prerequisites: CourseNode[];
  dependents: CourseNode[];
}

export interface Resource {
  id: number;
  title: string;
  url?: string | null;
  resource_type?: string | null;
  source?: string | null;
  summary?: string | null;
  difficulty?: string | null;
  status: string;
  submitted_by?: string | null;
  created_at: string;
  course_node_ids: number[];
}

export interface SearchResult {
  chunk_id: number;
  resource_id: number;
  resource_title: string;
  content: string;
  score: number;
}

export interface ChatRetrieveResponse {
  answer: string;
  sources: SearchResult[];
  has_enough_context: boolean;
}
