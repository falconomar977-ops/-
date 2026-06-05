/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Student, Exam } from "../types";
import Papa from "papaparse";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFd3exiUJcYQBvpF7qSx75aDCXFm27mXeL90irBLsklrA254ZIbLYBiebrUMsjaAmH1cgPvNpyhQ8g/pub?output=csv";

export class StudentService {
  private ai: GoogleGenAI | null = null;
  private cachedData: Student[] = [];

  private getAI() {
    if (this.ai) return this.ai;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return null;
    }
    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  private cleanImageUrl(url: string): string {
    if (!url) return "";
    const trimmed = url.trim();
    
    // Google Drive File viewer link: https://drive.google.com/file/d/FILE_ID/view...
    const driveFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = trimmed.match(driveFileRegex);
    if (match && match[1]) {
      return `https://docs.google.com/uc?export=view&id=${match[1]}`;
    }

    // Google Drive open link: https://drive.google.com/open?id=FILE_ID
    const driveOpenRegex = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
    const matchOpen = trimmed.match(driveOpenRegex);
    if (matchOpen && matchOpen[1]) {
      return `https://docs.google.com/uc?export=view&id=${matchOpen[1]}`;
    }
    
    // Google Drive direct sharing folder/d/
    const driveDRegex = /drive\.google\.com\/d\/([a-zA-Z0-9_-]+)/;
    const matchD = trimmed.match(driveDRegex);
    if (matchD && matchD[1]) {
      return `https://docs.google.com/uc?export=view&id=${matchD[1]}`;
    }

    // Standard Google Sheet publish links or general image links
    return trimmed;
  }

  private async fetchData(): Promise<Student[]> {
    try {
      // Append a cache-buster timestamp to prevent browser and CDNs caching the published CSV
      const cacheBustUrl = `${SHEET_CSV_URL}&t=${Date.now()}`;
      const response = await fetch(cacheBustUrl);
      const csvText = await response.text();
      
      return new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const students: Student[] = results.data.map((row: any, index: number) => {
              const rawImgUrl = row["صورة الجدول"] || row["جدول الصف"] || row["رابط الجدول"] || row["schedule_image"] || row["Image"] || "";
              // Map CSV columns based on expected headers in Arabic or English
              return {
                id: String(index),
                name: row["الاسم"] || row["name"] || row["Name"] || "",
                seatNumber: row["رقم الجلوس"] || row["seat"] || row["Seat"] || "",
                hall: row["القاعة"] || row["hall"] || row["Hall"] || "",
                committee: row["اللجنة"] || row["committee"] || row["Committee"] || "",
                column: row["العمود"] || row["column"] || row["Column"] || "",
                grade: row["الصف"] || row["grade"] || row["Grade"] || "",
                scheduleImageUrl: this.cleanImageUrl(rawImgUrl),
                exams: this.parseExams(row["الجدول"] || row["exams"] || "")
              };
            });
            this.cachedData = students;
            resolve(students);
          }
        });
      });
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      // Fallback to cached data if network request fails
      return this.cachedData;
    }
  }

  async getGrades(): Promise<string[]> {
    const students = await this.fetchData();
    const grades = students.map(s => s.grade?.trim()).filter(Boolean) as string[];
    return Array.from(new Set(grades));
  }

  async getScheduleImageForGrade(gradeName: string): Promise<string> {
    if (!gradeName) return "";
    const students = await this.fetchData();
    const studentWithImg = students.find(s => s.grade?.trim() === gradeName.trim() && s.scheduleImageUrl);
    return studentWithImg?.scheduleImageUrl || "";
  }

  private parseExams(examStr: string): Exam[] {
    if (!examStr) return [];
    try {
      if (examStr.startsWith("[")) return JSON.parse(examStr);
      
      return examStr.split(",").map(part => {
        const [subject, date] = part.split(":");
        return { 
          subject: subject?.trim() || "مادة غير محددة", 
          date: date?.trim() || "تاريخ غير محدد", 
          time: "09:00 ص" 
        };
      });
    } catch (e) {
      return [];
    }
  }

  async searchByName(name: string): Promise<Student | { error: string; suggestions?: string[] }> {
    const trimmedName = name.trim();
    if (!trimmedName) return { error: "يرجى إدخال اسم الطالب" };

    const students = await this.fetchData();
    if (students.length === 0) return { error: "فشل في سحب البيانات. تأكد من نشر ملف جوجل بصيغة CSV." };

    // Exact match
    const exactMatch = students.find(s => s.name === trimmedName);
    if (exactMatch) return exactMatch;

    // Partial match
    const partialMatches = students.filter(s => s.name.includes(trimmedName));
    if (partialMatches.length === 1) return partialMatches[0];
    if (partialMatches.length > 1) {
      return { 
        error: "تم العثور على أكثر من طالب بهذا الاسم، يرجى كتابة الاسم كاملاً", 
        suggestions: partialMatches.map(s => s.name).slice(0, 5) 
      };
    }

    // AI Smart Match
    const aiClient = this.getAI();
    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-1.5-flash",
          contents: `المستخدم بحث عن: "${trimmedName}"`,
          config: {
            systemInstruction: `أنت مساعد ذكي لنظام استعلام طلابي. 
            قائمة الطلاب المتاحة هي: ${students.map(s => s.name).slice(0, 50).join(", ")}.
            إذا كان الاسم الذي أدخله المستخدم قريباً من أحد الأسماء في القائمة (بسبب خطأ إملائي مثلاً)، اقترح الاسم الصحيح.
            أجب فقط بصيغة JSON: {"suggestion": "الاسم المقترح"} أو {"suggestion": null} إذا لم يكن هناك تشابه واضح.`,
            responseMimeType: "application/json"
          }
        });

        const result = JSON.parse(response.text || "{}");
        if (result.suggestion) {
          return { 
            error: `لم يتم العثور على الاسم بدقة. هل تقصد: ${result.suggestion}؟`, 
            suggestions: [result.suggestion] 
          };
        }
      } catch (e) {
        console.error("AI Search Error:", e);
      }
    }

    return { error: "الاسم غير موجود في السجلات. يرجى التأكد من كتابة الاسم ثلاثياً بشكل صحيح." };
  }
}

export const studentService = new StudentService();
