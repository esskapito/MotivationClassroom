// Path: types.ts

export interface ScoreRecord {
    date: string;
    score: number;
}

export interface Student {
    id: string;
    name: string | null;
    score: number;
    accessCode: string;
    scoreHistory: ScoreRecord[];
}

export interface Classroom {
    id: string;
    name: string | null;
    students: Student[];
    announcement?: string | null;
    secretQuestion?: string;
}

export enum View {
    Login = 'login',
    Teacher = 'teacher',
    Student = 'student',
    SetUsername = 'set_username',
}