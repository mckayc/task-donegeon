export enum AITutorStyle {
    EncouragingCoach = 'Encouraging Coach',
    SocraticQuestioner = 'Socratic Questioner',
    DirectTeacher = 'Direct Teacher',
    Custom = 'Custom',
}

export interface AITutor {
    id: string;
    name: string;
    icon: string;
    subject: string;
    targetAgeGroup: string;
    sessionMinutes: number;
    style: AITutorStyle;
    customPersona?: string;
    sampleQuestions: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface TranscriptEntry {
    type: 'question' | 'answer' | 'feedback' | 'summary' | 'info';
    author: 'ai' | 'user' | 'system';
    text: string;
    timestamp: string; // ISO string
    isCorrect?: boolean;
}

export interface AITutorSessionLog {
    id: string;
    completionId: string;
    questId: string;
    userId: string;
    tutorId: string;
    startedAt: string; // ISO string
    endedAt: string; // ISO string
    durationSeconds: number;
    transcript: TranscriptEntry[];
    finalScore?: number;
    totalQuestions?: number;
    createdAt?: string;
    updatedAt?: string;
}
