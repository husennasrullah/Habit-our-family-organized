// ─── Kids ────────────────────────────────────────────────────────────────────

export interface KidProfile {
  id: string;
  family_id: string;
  member_id: string | null;
  name: string;
  gender: string;
  birth_date: string;
  avatar_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface GrowthRecord {
  id: string;
  kid_id: string;
  date: string;
  height_cm: number | null;
  weight_kg: number | null;
  head_circumference_cm: number | null;
  notes: string;
  created_at: string;
}

export type VaccineStatus = "scheduled" | "given" | "overdue";

export interface VaccineRecord {
  id: string;
  kid_id: string;
  vaccine_name: string;
  scheduled_date: string;
  given_date: string | null;
  given_by: string;
  notes: string;
  status: VaccineStatus;
  created_at: string;
}

export interface Milestone {
  id: string;
  kid_id: string;
  title: string;
  category: string;
  achieved_at: string | null;
  notes: string;
  is_achieved: boolean;
  created_at: string;
}

export interface HealthRecord {
  id: string;
  kid_id: string;
  type: string;
  description: string;
  date: string;
  doctor: string;
  medication: string;
  notes: string;
  created_at: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  family_id: string;
  uploaded_by: string;
  title: string;
  type: string;
  object_key: string;
  file_size: number;
  is_encrypted: boolean;
  tags: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  message: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
}

// ─── Family ──────────────────────────────────────────────────────────────────

export type MemberRole = "admin" | "member" | "child" | "view_only";
export type AuthProvider = "email" | "google" | "both";

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar_url: string | null;
  color: string;
  birth_date: string | null;
  auth_provider: AuthProvider;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends FamilyMember {
  family: Family | null;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventType = "general" | "school" | "medical" | "birthday" | "vacation";

export interface CalendarEvent {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  type: EventType;
  color: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "in_progress" | "done";

export interface Task {
  id: string;
  family_id: string;
  assigned_to: string | null;
  created_by: string;
  title: string;
  description: string;
  points: number;
  status: TaskStatus;
  due_date: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Financial Goals ─────────────────────────────────────────────────────────

export interface FinancialGoal {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  notes: string;
  is_achieved: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Memories ────────────────────────────────────────────────────────────────

export interface MemoryPhoto {
  id: string;
  memory_id: string;
  object_key: string;
  caption: string;
  order: number;
  url: string; // presigned / public URL — diisi oleh backend
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  content: string;
  date: string;
  is_favorite: boolean;
  photos: MemoryPhoto[];
  created_at: string;
  updated_at: string;
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  family_id: string;
  created_by: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  receipt_url: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  family_id: string;
  category: string;
  amount: number;
  period: string;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  family_id: string;
  added_by: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  is_checked: boolean;
  checked_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

export interface MonthSummary {
  month: number;
  total: number;
}

export interface BudgetSummary {
  by_category: CategorySummary[];
  by_month: MonthSummary[];
  total: number;
}

// ─── WebSocket ───────────────────────────────────────────────────────────────

export interface WsMessage<T = unknown> {
  type: string;
  family_id: string;
  payload: T;
}

// ─── Meal Plan ────────────────────────────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "dinner";

export interface MealPlan {
  id: string;
  family_id: string;
  created_by: string;
  date: string;        // YYYY-MM-DD
  meal_type: MealType;
  name: string;
  notes: string;
  recipe_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMealPlanPayload {
  date: string;
  meal_type: MealType;
  name: string;
  notes?: string;
  recipe_url?: string;
}

export interface UpdateMealPlanPayload {
  name: string;
  notes?: string;
  recipe_url?: string;
}
