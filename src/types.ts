/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Exam {
  subject: string;
  date: string;
  time: string;
}

export interface Student {
  id: string;
  name: string;
  seatNumber: string;
  hall: string;
  committee: string;
  column: string;
  grade?: string;
  scheduleImageUrl?: string;
  exams: Exam[];
}

export interface SearchResult {
  student?: Student;
  error?: string;
  suggestions?: string[];
}
