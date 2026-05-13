/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Hash, LayoutGrid, Calendar, GraduationCap, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { studentService } from './services/studentService';
import { Student } from './types';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            أ
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">نظام استعلام الاختبارات الذكي</h1>
            <p className="text-sm text-slate-500">بوابة الطالب الموحدة - العام الدراسي 2023/2024</p>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
            النظام متاح حالياً
          </span>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "استعلام عن النتيجة"}
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

          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-indigo-800 font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> تنبيهات هامة:
            </h3>
            <ul className="text-indigo-700 text-sm space-y-2 list-disc list-inside leading-relaxed pr-2">
              <li>يرجى الحضور قبل موعد الاختبار بـ 15 دقيقة.</li>
              <li>إبراز بطاقة الهوية الجامعية عند الدخول.</li>
              <li>يمنع دخول الهواتف الذكية للقاعة.</li>
            </ul>
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
                    <p className="text-xs text-slate-500 mb-1">رقم العمود</p>
                    <p className="text-2xl font-black text-slate-800">{result.column}</p>
                  </div>
                </div>

                {/* Detailed Schedule Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center whitespace-nowrap overflow-hidden">
                    <h3 className="font-bold text-slate-800 truncate">جدول الاختبارات الخاص بـ {result.name}</h3>
                    <span className="text-xs text-slate-500 hidden sm:inline">تحديث: اليوم الساعة 08:30 ص</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[500px]">
                      <thead>
                        <tr className="text-slate-500 text-xs uppercase bg-slate-50/50">
                          <th className="px-6 py-4 font-semibold">المادة الدراسية</th>
                          <th className="px-6 py-4 font-semibold text-center">التاريخ</th>
                          <th className="px-6 py-4 font-semibold text-center">الوقت</th>
                          <th className="px-6 py-4 font-semibold text-left">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.exams.map((exam, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{exam.subject}</td>
                            <td className="px-6 py-4 text-center text-slate-600">{exam.date}</td>
                            <td className="px-6 py-4 text-center text-slate-600 font-mono text-sm">{exam.time}</td>
                            <td className="px-6 py-4 text-left">
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">مجدول</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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

      <footer className="bg-white border-t border-slate-200 px-8 py-4 text-center mt-auto">
        <p className="text-slate-400 text-xs text-center mx-auto">
          يتم تحديث هذه البيانات مباشرة من قاعدة بيانات شئون الطلاب. لأي استفسار يرجى التوجه لمكتب الدعم الفني.
        </p>
      </footer>
    </div>
  );
}
