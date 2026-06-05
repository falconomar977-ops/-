/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Hash, LayoutGrid, Calendar, GraduationCap, AlertCircle, 
  Loader2, ArrowRight, Image, ZoomIn, Download, Settings, Link, 
  UploadCloud, X, ExternalLink, FileText, Check 
} from 'lucide-react';
import { studentService } from './services/studentService';
import { Student } from './types';

const getGoogleDrivePreviewUrl = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();

  // Try to find if it has any google drive or docs.google.com part
  if (!trimmed.includes("drive.google.com") && !trimmed.includes("docs.google.com")) {
    return null;
  }

  // 1. Match docs.google.com/uc?export=view&id=FILE_ID or similar id=
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }
  
  // 2. Match drive.google.com/file/d/FILE_ID
  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/file/d/${fileDMatch[1]}/preview`;
  }
  
  // 3. Match drive.google.com/d/FILE_ID
  const dMatch = trimmed.match(/drive\.google\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return `https://drive.google.com/file/d/${dMatch[1]}/preview`;
  }
  
  return null;
};

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [grades, setGrades] = useState<string[]>([]);
  const [gradeImages, setGradeImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('grade_schedule_images');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [selectedGeneralGrade, setSelectedGeneralGrade] = useState<string>('');
  const [sheetGradeImage, setSheetGradeImage] = useState<string>('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState('');
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');

  // Load all unique grades from the student service database
  useEffect(() => {
    studentService.getGrades().then(data => {
      setGrades(data);
    });
  }, [result]);

  // Load grade's image URL dynamically from Google Sheet when grade selection changes
  useEffect(() => {
    if (selectedGeneralGrade) {
      studentService.getScheduleImageForGrade(selectedGeneralGrade).then(url => {
        setSheetGradeImage(url);
      });
    } else {
      setSheetGradeImage('');
    }
  }, [selectedGeneralGrade, result]);

  const handleUpdateGradeImage = (grade: string, url: string) => {
    const updated = { ...gradeImages, [grade]: url };
    setGradeImages(updated);
    localStorage.setItem('grade_schedule_images', JSON.stringify(updated));
    setEditingGrade(null);
    setInputUrl('');
  };

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSuggestions([]);

    try {
      const resp = await studentService.searchByName(query);
      if ('error' in resp) {
        setError(resp.error);
        if (resp.suggestions) setSuggestions(resp.suggestions);
      } else {
        setResult(resp);
      }
    } catch (err) {
      setError("حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const useSuggestion = (name: string) => {
    setQuery(name);
    setLoading(true);
    setError(null);
    setResult(null);
    setSuggestions([]);
    
    studentService.searchByName(name).then(resp => {
      if ('error' in resp) {
        setError(resp.error);
      } else {
        setResult(resp);
      }
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            {/* Staircase Digital Graphic Logo precisely matching the image */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left low step */}
                <rect x="10" y="45" width="24" height="16" rx="1.5" fill="#17386c" />
                
                {/* Connecting block */}
                <rect x="34" y="29" width="24" height="16" rx="1.5" fill="#17386c" />
                
                {/* Bright blue square at the top cascade */}
                <rect x="82" y="13" width="16" height="16" rx="2" fill="#2272b4" />
                
                {/* Large dark blue right step */}
                <rect x="82" y="29" width="28" height="24" rx="2" fill="#1e3163" />
                
                {/* White hollow square accent in the center */}
                <rect x="62" y="29" width="16" height="16" rx="2" fill="#ffffff" />
                <rect x="62" y="29" width="16" height="16" rx="1.5" stroke="#17386c" strokeWidth="4.5" fill="none" />
                
                {/* Deep bottom right accent square */}
                <rect x="70" y="53" width="12" height="12" rx="1.5" fill="#1a1c3d" />
              </svg>
            </div>
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-black text-[#1e293b] leading-tight">مدارس أطياب الأهلية</h1>
              <p className="text-xs md:text-sm text-blue-600 font-semibold">إحدى مدارس شركة قيم للتعليم</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center sm:items-end gap-1 text-center sm:text-left">
          <span className="text-sm font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            نظام استعلام الاختبارات الذكي
          </span>
          <span className="text-xs text-indigo-600 font-extrabold font-mono">العام الدراسي 1447 هـ</span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Search & Instructions Panel */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">البحث عن بيانات الطالب</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">أدخل الاسم الثلاثي</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="أحمد محمد علي..."
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "استعلام عن طالب"}
              </button>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="font-semibold">{error}</p>
                      {suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => useSuggestion(s)}
                              className="px-2 py-1 bg-white border border-rose-200 rounded text-[10px] hover:bg-rose-100 transition-colors flex items-center gap-1"
                            >
                              {s} <ArrowRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Browse General Class Schedules Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 animate-pulse" />
              تصفح جدول الاختبارات العام
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              يمكنك استعراض صورة الجدول المعتمد للصف الدراسي مباشرة بدون الحاجة للاستعلام بالاسم.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اختر الصف الدراسي</label>
                <select 
                  value={selectedGeneralGrade} 
                  onChange={async (e) => {
                    const selectedGradeName = e.target.value;
                    setSelectedGeneralGrade(selectedGradeName);
                    // Fetch directly from sheet or fallback
                    const sheetImg = await studentService.getScheduleImageForGrade(selectedGradeName);
                    const fallbackImg = gradeImages[selectedGradeName] || "";
                    const activeImg = sheetImg || fallbackImg;
                    if (activeImg) {
                      setLightboxUrl(activeImg);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 outline-none font-semibold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- اختر صف للبدء --</option>
                  {grades.map((g, idx) => (
                    <option key={idx} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {selectedGeneralGrade && (() => {
                const imgUrl = sheetGradeImage || gradeImages[selectedGeneralGrade];
                return (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-extrabold text-indigo-700 mb-2 flex items-center justify-between">
                      <span>جدول صف: {selectedGeneralGrade}</span>
                      {imgUrl && (
                        <button 
                          onClick={() => {
                            setLightboxUrl(imgUrl);
                            setShowLightbox(true);
                          }}
                          className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1"
                        >
                          <ZoomIn className="w-3 h-3" /> تكبير الصورة
                        </button>
                      )}
                    </p>
                    
                    {imgUrl ? (() => {
                      const drivePreview = getGoogleDrivePreviewUrl(imgUrl);
                      return (
                        <div className="rounded-xl overflow-hidden border border-slate-300 shadow-md bg-white p-1 flex flex-col items-center">
                          {drivePreview ? (
                            <div className="w-full h-[450px] relative">
                              <iframe 
                                src={drivePreview} 
                                className="w-full h-full border-0 rounded-lg"
                                allow="autoplay"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <img 
                              src={imgUrl} 
                              alt={`جدول اختبارات ${selectedGeneralGrade}`} 
                              className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in transition-transform duration-200 hover:scale-[1.01]"
                              onClick={() => {
                                setLightboxUrl(imgUrl);
                                setShowLightbox(true);
                              }}
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <p className="text-[10px] text-slate-400 mt-3 font-medium">
                            {drivePreview ? "يمكنك التفاعل مع الجدول والتحكم به مباشرة" : "انقر على الجدول للفتح في وضع ملء الشاشة"}
                          </p>
                        </div>
                      );
                    })() : (
                      <div className="p-4 border border-dashed border-slate-350 rounded-lg text-center bg-white">
                        <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-bold mb-3">لا توجد صورة جدول مضافة لهذا الصف بعد</p>
                        
                        {editingGrade === selectedGeneralGrade ? (
                          <div className="space-y-2">
                            <input 
                              type="url" 
                              placeholder="أدخل رابط صورة الجدول المباشر هنا..."
                              value={inputUrl}
                              onChange={(e) => setInputUrl(e.target.value)}
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-left"
                              dir="ltr"
                            />
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => handleUpdateGradeImage(selectedGeneralGrade, inputUrl)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold"
                              >
                                حفظ الرابط
                              </button>
                              <button 
                                onClick={() => setEditingGrade(null)}
                                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditingGrade(selectedGeneralGrade);
                              setInputUrl("");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm inline-flex items-center gap-1.5"
                          >
                            <Link className="w-3.5 h-3.5" /> إدراج رابط صورة الجدول
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            {/* Styled "تعليمات هامة" banner badge exactly matching the design */}
            <div className="flex justify-start mb-5">
              <span className="bg-[#1a365d] text-white px-5 py-2 rounded-xl text-sm font-extrabold shadow-sm">
                تعليمات هامة
              </span>
            </div>

            <div className="space-y-4">
              {/* Group A */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-3.5 h-3.5 bg-[#5bc0be] rounded-full shrink-0 mt-1 shadow-sm opacity-90" />
                  <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                    الاستعانة بالله والاستعداد الجيد لأداء الاختبار.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-3.5 h-3.5 bg-[#5bc0be] rounded-full shrink-0 mt-1 shadow-sm opacity-90" />
                  <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                    حضور الطلاب للمدرسة الساعة 6:15.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-3.5 h-3.5 bg-[#5bc0be] rounded-full shrink-0 mt-1 shadow-sm opacity-90" />
                  <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                    يبدأ دخول الطلاب الى لجان الاختبار الساعة 6:45.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-3.5 h-3.5 bg-[#5bc0be] rounded-full shrink-0 mt-1 shadow-sm opacity-90" />
                  <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                    يمنع دخول الطالب من دخول لجنة الاختبار بعد مضي نصف الوقت.
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 my-3 pt-3 space-y-3">
                {/* Group B */}
                <div className="flex items-start gap-3">
                  <span className="w-3.5 h-3.5 bg-[#5bc0be] rounded-full shrink-0 mt-1 shadow-sm opacity-90" />
                  <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                    يسمح للطالب بالخروج من الاختبار بعد مضي نصف الوقت.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-3.5 h-3.5 bg-[#5bc0be] rounded-full shrink-0 mt-1 shadow-sm opacity-90" />
                  <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                    الكتابة بالقلم الأزرق الجاف.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-3.5 h-3.5 bg-[#5bc0be] rounded-full shrink-0 mt-1 shadow-sm opacity-90" />
                  <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                    استخدام الآلة الحاسبة للصف الثالث المتوسط.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-3.5 h-3.5 bg-rose-400 rounded-full shrink-0 mt-1 shadow-sm opacity-90 animate-pulse" />
                  <span className="text-rose-600 text-sm font-black leading-relaxed">
                    يمنع احضار الجوالات والساعات الذكية.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Display Area */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key={result.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Top Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border-b-4 border-indigo-500 shadow-sm transition-transform hover:-translate-y-1">
                    <p className="text-xs text-slate-500 mb-1">رقم الجلوس</p>
                    <p className="text-2xl font-black text-slate-800">{result.seatNumber}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border-b-4 border-emerald-500 shadow-sm transition-transform hover:-translate-y-1">
                    <p className="text-xs text-slate-500 mb-1">القاعة</p>
                    <p className="text-lg font-bold text-slate-800 line-clamp-1">{result.hall}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border-b-4 border-cyan-500 shadow-sm transition-transform hover:-translate-y-1">
                    <p className="text-xs text-slate-500 mb-1">اللجنة</p>
                    <p className="text-lg font-bold text-slate-800 line-clamp-1">{result.committee}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border-b-4 border-amber-500 shadow-sm transition-transform hover:-translate-y-1">
                    <p className="text-xs text-slate-500 mb-1">{result.grade ? "الصف" : "رقم العمود"}</p>
                    <p className="text-lg font-bold text-slate-800 line-clamp-1">{result.grade || result.column}</p>
                  </div>
                </div>

                {/* Certified Exam Schedule Image Card for student */}
                {(() => {
                  const studentGrade = result.grade?.trim() || "";
                  const sheetImage = result.scheduleImageUrl?.trim();
                  const savedImage = gradeImages[studentGrade];
                  const finalImgUrl = sheetImage || savedImage;

                  return (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-2">
                        <div>
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Image className="w-5 h-5 text-indigo-600" />
                            صورة جدول الاختبارات لصفك ({studentGrade || "الصف غير محدد"})
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            الجدول الرسمي للاختبارات الصادر من إدارة المدرسة للصف الدراسي الحالي.
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          {finalImgUrl && (
                            <button
                              onClick={() => {
                                setLightboxUrl(finalImgUrl);
                                setShowLightbox(true);
                              }}
                              className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold flex items-center gap-1"
                            >
                              <ZoomIn className="w-3.5 h-3.5" /> تكبير الجدول
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setEditingGrade(studentGrade);
                              setInputUrl(savedImage || "");
                            }}
                            className="bg-slate-50 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold flex items-center gap-1"
                          >
                            <Settings className="w-3.5 h-3.5" /> {finalImgUrl ? "تحديث الرابط" : "إضافة الرابط"}
                          </button>
                        </div>
                      </div>

                      {editingGrade === studentGrade ? (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-xl mx-auto space-y-3">
                          <p className="text-xs font-bold text-slate-705">تحديث رابط صورة الجدول لصف {studentGrade}:</p>
                          <input 
                            type="url" 
                            placeholder="أدخل رابط صورة الجدول المباشر هنا..."
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-left"
                            dir="ltr"
                          />
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            💡 يمكنك نسخ رابط الصورة من جوجل درايف (مع تفعيل المشاركة العامة للجميع) أو أي مستضيف آخر ثم لصقه هنا.
                          </p>
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleUpdateGradeImage(studentGrade, inputUrl)}
                              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold"
                            >
                              حفظ التغييرات
                            </button>
                            <button 
                              onClick={() => setEditingGrade(null)}
                              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : finalImgUrl ? (() => {
                        const drivePreview = getGoogleDrivePreviewUrl(finalImgUrl);
                        return (
                          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white p-2 flex flex-col items-center max-w-4xl mx-auto text-center">
                            {drivePreview ? (
                              <div className="w-full h-[500px] sm:h-[600px] relative">
                                <iframe 
                                  src={drivePreview} 
                                  className="w-full h-full border-0 rounded-xl bg-slate-50"
                                  allow="autoplay"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <img 
                                src={finalImgUrl} 
                                alt={`جدول الصف ${studentGrade}`} 
                                className="w-full h-auto max-h-[700px] object-contain cursor-zoom-in transition-transform duration-300 hover:scale-[1.01]"
                                onClick={() => {
                                  setLightboxUrl(finalImgUrl);
                                  setShowLightbox(true);
                                }}
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <p className="text-xs text-slate-400 mt-3 font-medium pb-1">
                              {drivePreview ? "يمكنك التفاعل مع الجدول والتمرير داخله مباشرة" : "انقر على الصورة لمعاينتها بالحجم الكامل وملء الشاشة"}
                            </p>
                          </div>
                        );
                      })() : (
                        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl max-w-xl mx-auto">
                          <Image className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <h4 className="font-bold text-slate-600 text-sm">صورة جدول الصف المعتمد غير متوفرة بعد</h4>
                          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed px-4">
                            يمكنك إضافة رابط صورة الجدول الدراسي المعتمد للصف <b>({studentGrade})</b> لتظهر هنا لجميع زملائك، أو إضافة عمود في ملف Excel المربوط باسم <b>"صورة الجدول"</b> للربط المباشر!
                          </p>
                          <button
                            onClick={() => {
                              setEditingGrade(studentGrade);
                              setInputUrl("");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm inline-flex items-center gap-1.5"
                          >
                            <UploadCloud className="w-4 h-4" /> إضافة رابط صورة الجدول الآن
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20 bg-white rounded-2xl border border-dashed border-slate-200"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-lg">يرجى كتابة الاسم للبدء في الاستعلام</p>
                <p className="text-sm mt-2">ستظهر بيانات لجنتك وجدولك هنا فوراً</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-8 py-6 text-center mt-auto space-y-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-indigo-100 hover:bg-slate-50 transition-all duration-200">
            <span className="text-xs text-indigo-600 font-extrabold mb-1.5 bg-indigo-50/50 px-2.5 py-1 rounded-md">إعداد مشرف الجودة والتطوير</span>
            <span className="text-sm font-black text-slate-800">أ / أحمد السيد</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-indigo-100 hover:bg-slate-50 transition-all duration-200">
            <span className="text-xs text-indigo-600 font-extrabold mb-1.5 bg-indigo-50/50 px-2.5 py-1 rounded-md">وكيل المدرسة</span>
            <span className="text-sm font-black text-slate-800">أ / نصر حسني</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-indigo-100 hover:bg-slate-50 transition-all duration-200">
            <span className="text-xs text-indigo-600 font-extrabold mb-1.5 bg-indigo-50/50 px-2.5 py-1 rounded-md">مدير المدرسة</span>
            <span className="text-sm font-black text-slate-800">أ / ماجد الدهام</span>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p className="font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">العام الدراسي 1447 هـ</p>
          <p className="text-slate-400">يتم تحديث هذه البيانات مباشرة من قاعدة بيانات شئون الطلاب. لأي استفسار يرجى التوجه لمكتب الدعم الفني.</p>
        </div>
      </footer>

      {/* Fullscreen Lightbox Overlay */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-4 transition-all cursor-zoom-out"
            onClick={() => setShowLightbox(false)}
          >
            <button 
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10 focus:outline-none"
              aria-label="إغلاق المعاينة"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="absolute top-4 right-4 flex items-center gap-3">
              <a 
                href={lightboxUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" /> فتح الصورة المباشرة ↗
              </a>
            </div>

            <div 
              className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center p-2 bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden mt-12 md:mt-0 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const drivePreview = getGoogleDrivePreviewUrl(lightboxUrl);
                return drivePreview ? (
                  <iframe 
                    src={drivePreview} 
                    className="w-full h-[75vh] border-0 rounded-xl"
                    allow="autoplay"
                  />
                ) : (
                  <img 
                    src={lightboxUrl} 
                    alt="جدول الاختبارات بالحجم الكامل" 
                    className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-lg select-none"
                    referrerPolicy="no-referrer"
                  />
                );
              })()}
            </div>
            
            <p className="text-white/60 text-xs mt-4 text-center select-none">
              اضغط في أي مكان خارج الصورة أو على زر (✕) للإغلاق.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
