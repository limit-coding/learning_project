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
  description?: string;
  difficulty_level: string;
  estimated_hours?: number;
  programming_languages: string[];
  topics: string[];
  prerequisites: string[];
  domain: string;
  url?: string;
  platform?: string;
  rating?: number;
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
