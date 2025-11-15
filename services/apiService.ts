// Path: services/apiService.ts

import { Classroom, Student } from '../types';

const API_BASE_URL = '/dashboard/api';

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
};

// --- Public / Student Actions ---
export const getClassroomAPI = async (classCode: string): Promise<Classroom> => {
    const cacheBuster = `&t=${Date.now()}`;
    const response = await fetch(`${API_BASE_URL}/class.php?action=get&code=${classCode}${cacheBuster}`);
    return handleResponse(response);
};

export const joinClassroomAPI = async (classCode: string, studentCode: string): Promise<{ classroom: Classroom, student: Student }> => {
    const response = await fetch(`${API_BASE_URL}/join.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, studentCode }),
    });
    return handleResponse(response);
};

export const setStudentNameAPI = async (classCode: string, accessCode: string, name: string): Promise<Student> => {
    const response = await fetch(`${API_BASE_URL}/student/set_name.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, accessCode, name }),
    });
    return handleResponse(response);
};


// --- Teacher Authentication Actions ---
export const createClassroomAPI = async (password: string, className: string, secretQuestion: string, secretAnswer: string): Promise<{ classroom: Classroom, teacherToken: string }> => {
    const response = await fetch(`${API_BASE_URL}/teacher.php?action=create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, className, secretQuestion, secretAnswer }),
    });
    return handleResponse(response);
};

export const loginTeacherAPI = async (classCode: string, password: string): Promise<{ classroom: Classroom, teacherToken: string }> => {
    const response = await fetch(`${API_BASE_URL}/teacher.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, password }),
    });
    return handleResponse(response);
};

export const getSecretQuestionAPI = async (classCode: string): Promise<{ secretQuestion: string }> => {
    const response = await fetch(`${API_BASE_URL}/teacher/reset.php?action=get_question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode }),
    });
    return handleResponse(response);
};

export const resetPasswordAPI = async (classCode: string, secretAnswer: string, newPassword: string): Promise<{ message: string }> => {
     const response = await fetch(`${API_BASE_URL}/teacher/reset.php?action=reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, secretAnswer, newPassword }),
    });
    return handleResponse(response);
};


// --- Protected Teacher Actions ---
export const addStudentAPI = async (classCode: string, teacherToken: string): Promise<{ newStudent: Student, updatedClassroom: Classroom }> => {
    const response = await fetch(`${API_BASE_URL}/teacher/student.php?action=add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, teacherToken }),
    });
    return handleResponse(response);
};

export const updateScoreAPI = async (classCode: string, studentId: string, score: number, teacherToken: string): Promise<Classroom> => {
    const response = await fetch(`${API_BASE_URL}/teacher/student.php?action=update_score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, studentId, score, teacherToken }),
    });
    return handleResponse(response);
};

export const resetScoresAPI = async (classCode: string, teacherToken: string): Promise<Classroom> => {
    const response = await fetch(`${API_BASE_URL}/teacher/classroom.php?action=reset_scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, teacherToken }),
    });
    return handleResponse(response);
};

export const removeStudentAPI = async (classCode: string, studentId: string, teacherToken: string): Promise<Classroom> => {
    const response = await fetch(`${API_BASE_URL}/teacher/student.php?action=remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, studentId, teacherToken }),
    });
    return handleResponse(response);
};

export const deleteClassroomAPI = async (classCode: string, teacherToken: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/teacher/classroom.php?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, teacherToken }),
    });
    return handleResponse(response);
};

export const updateAnnouncementAPI = async (classCode: string, announcement: string, teacherToken: string): Promise<Classroom> => {
    const response = await fetch(`${API_BASE_URL}/teacher/classroom.php?action=update_announcement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, announcement, teacherToken }),
    });
    return handleResponse(response);
};