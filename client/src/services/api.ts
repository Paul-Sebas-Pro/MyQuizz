import { axiosInstance } from './axios';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface UserDTO {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: 'member' | 'author' | 'admin';
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface TagDTO {
  id: number;
  name: string;
}

export interface QuizDTO {
  id: number;
  title: string;
  description: string | null;
  published_at: string | null;
  author: Pick<UserDTO, 'id' | 'firstname' | 'lastname'>;
  tags: { tag: TagDTO }[];
}

export interface LevelDTO {
  id: number;
  name: string;
}

export interface AnswerDTO {
  id: number;
  description: string;
  is_valid: boolean;
}

export interface QuestionDTO {
  id: number;
  statement: string;
  anecdote: string | null;
  link: string | null;
  level: LevelDTO;
  answers: AnswerDTO[];
}

export interface AttemptDTO {
  id: number;
  score: number;
  score_max: number;
  created_at: string;
  quiz: Pick<QuizDTO, 'id' | 'title'>;
}

export interface AttemptResult {
  id: number;
  score: number;
  score_max: number;
  details: {
    question_id: number;
    answer_id: number;
    correct_answer_id: number | null;
    is_correct: boolean;
  }[];
}

export interface UserProfileDTO extends UserDTO {
  nb_quiz_played: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const api = {
  // AUTH
  async signup(data: { firstname: string; lastname: string; email: string; password: string; confirm: string }) {
    return (await axiosInstance.post<UserDTO>('/auth/signup', data)).data;
  },
  async login(email: string, password: string): Promise<LoginResponse> {
    return (await axiosInstance.post<LoginResponse>('/auth/login', { email, password })).data;
  },
  async getMe(): Promise<UserDTO> {
    return (await axiosInstance.get<UserDTO>('/auth/me')).data;
  },
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return (await axiosInstance.post<LoginResponse>('/auth/refresh', { refreshToken })).data;
  },
  async logout() {
    await axiosInstance.post('/auth/logout');
  },

  // USERS
  async getUsers(): Promise<UserDTO[]> {
    return (await axiosInstance.get<UserDTO[]>('/users')).data;
  },
  async getUserProfile(id: number): Promise<UserProfileDTO> {
    return (await axiosInstance.get<UserProfileDTO>(`/users/${id}/profile`)).data;
  },
  async getUserAttempts(id: number): Promise<AttemptDTO[]> {
    return (await axiosInstance.get<AttemptDTO[]>(`/users/${id}/attempts`)).data;
  },

  // LEVELS
  async getLevels(): Promise<LevelDTO[]> {
    return (await axiosInstance.get<LevelDTO[]>('/levels')).data;
  },

  // TAGS
  async getTags(): Promise<(TagDTO & { quizzes: { quiz: Pick<QuizDTO, 'id' | 'title'> }[] })[]> {
    return (await axiosInstance.get('/tags')).data;
  },

  // QUIZ
  async getQuizzes(): Promise<QuizDTO[]> {
    return (await axiosInstance.get<QuizDTO[]>('/quizzes')).data;
  },
  async getRecentQuizzes(): Promise<QuizDTO[]> {
    return (await axiosInstance.get<QuizDTO[]>('/quizzes/recent')).data;
  },
  async getQuiz(id: number): Promise<QuizDTO> {
    return (await axiosInstance.get<QuizDTO>(`/quizzes/${id}`)).data;
  },
  async getQuizQuestions(id: number): Promise<QuestionDTO[]> {
    return (await axiosInstance.get<QuestionDTO[]>(`/quizzes/${id}/questions`)).data;
  },
  async createQuiz(data: { title: string; description?: string }): Promise<QuizDTO> {
    return (await axiosInstance.post<QuizDTO>('/quizzes', data)).data;
  },
  async updateQuiz(id: number, data: { title?: string; description?: string }): Promise<QuizDTO> {
    return (await axiosInstance.patch<QuizDTO>(`/quizzes/${id}`, data)).data;
  },

  // ATTEMPTS
  async submitAttempt(
    quizId: number,
    answers: { question_id: number; answer_id: number }[],
  ): Promise<AttemptResult> {
    return (await axiosInstance.post<AttemptResult>(`/quizzes/${quizId}/attempts`, answers)).data;
  },
};
