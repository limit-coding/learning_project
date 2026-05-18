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
