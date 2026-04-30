import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { signInWithGoogle, logout } from "./lib/firebase";
import { 
  PlusCircle, 
  LogOut, 
  BookOpen, 
  GraduationCap, 
  ClipboardCheck, 
  BarChart3, 
  FileText,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MoreVertical,
  Eye,
  X,
  FileDown,
  User as UserIcon,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./lib/firebase";
import { useDropzone } from "react-dropzone";
import { gradeSubmission, GradingResult } from "./lib/gemini";
import Markdown from "react-markdown";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// --- UI COMPONENTS ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
      secondary: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
      outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
      ghost: "text-gray-600 hover:bg-gray-100",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm"
    };
    return (
      <button
        ref={ref}
        className={cn(
          "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white border border-gray-100 rounded-2xl shadow-sm p-6", className)}>
    {children}
  </div>
);

// --- PAGES ---

function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-2">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-100">
            <ClipboardCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight font-sans">MathAI Grader</h1>
          <p className="text-lg text-gray-500 italic font-serif">Chấm bài Toán tự luận bằng trí tuệ nhân tạo</p>
        </div>
        
        <Card className="p-10 space-y-6">
          <p className="text-gray-600">Đăng nhập để bắt đầu hành trình học tập và giảng dạy thông minh hơn.</p>
          <Button onClick={signInWithGoogle} className="w-full py-4 text-lg">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 mr-1" alt="Google" />
            Đăng nhập bằng Google
          </Button>
        </Card>

        <p className="text-sm text-gray-400">© 2024 MathAI Grader. Dành cho giáo dục THCS.</p>
      </motion.div>
    </div>
  );
}

function RoleSelection() {
  const { profile, setRole } = useAuth();
  const [view, setView] = useState<'select' | 'teacher' | 'student'>('select');
  const [formData, setFormData] = useState({ fullName: profile?.displayName || "", className: "" });

  const handleSelectRole = async (role: "teacher" | "student") => {
    if (role === 'teacher') {
      await setRole('teacher', { fullName: formData.fullName });
    } else {
      setView('student');
    }
  };

  const handleStudentFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    await setRole('student', { fullName: formData.fullName, className: formData.className });
  };

  if (view === 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] p-4 font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Thông tin học sinh</h2>
              <p className="text-gray-500">Cập nhật thông tin để giáo viên ghi nhận điểm</p>
            </div>
            <form onSubmit={handleStudentFinish} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: 9A1"
                  value={formData.className} 
                  onChange={e => setFormData({...formData, className: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setView('select')} className="flex-1">Quay lại</Button>
                <Button type="submit" className="flex-[2]">Hoàn thành</Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] p-4 font-sans">
      <div className="max-w-2xl w-full space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Mừng bạn đến với MathAI</h2>
          <p className="text-gray-500">Bạn sử dụng ứng dụng với vai trò nào?</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <motion.button 
            whileHover={{ y: -5 }}
            onClick={() => handleSelectRole('teacher')}
            className="group p-8 bg-white border border-gray-200 rounded-3xl text-left space-y-4 hover:border-indigo-600 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Tôi là Giáo viên</h3>
              <p className="text-gray-500 text-sm">Giao đề, quản lý lớp học và xem thống kê điểm số AI chấm.</p>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ y: -5 }}
            onClick={() => handleSelectRole('student')}
            className="group p-8 bg-white border border-gray-200 rounded-3xl text-left space-y-4 hover:border-amber-500 hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Tôi là Học sinh</h3>
              <p className="text-gray-500 text-sm">Xem đề, nộp bài bằng hình ảnh và nhận kết quả chi tiết từ AI.</p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// --- TEACHER VIEWS ---

function CreateExamModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    examCode: "",
    content: "",
    rubric: "",
    pdfUrl: "",
    pdfFileName: "",
    answerPdfUrl: "",
    answerPdfFileName: "",
    rubricText: "",
    aiInstruction: "",
    fileMime: "",
    fileHtml: ""
  });
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Dung lượng file quá lớn (>10MB).");
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    setIsParsing(true);
    try {
      // 1. Upload file to server
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm
      });
      if (!uploadRes.ok) throw new Error("Upload thất bại");
      const uploadData = await uploadRes.json();
      const serverUrl = uploadData.url;

      // 2. Extract text for AI
      const arrayBuffer = await file.arrayBuffer();
      
      let extractedText = "";
      let htmlContent = "";

      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === 'docx') {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        extractedText = result.value || "";
        htmlContent = htmlResult.value || "";
      } else if (file.type === "application/pdf" || extension === 'pdf') {
        try {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            extractedText += pageText + "\n";
          }
        } catch (pdfErr) {
          console.warn("Could not extract text from PDF, will use as visual only", pdfErr);
        }
      }

      setFormData(prev => ({ 
        ...prev, 
        content: extractedText,
        fileHtml: htmlContent,
        pdfUrl: serverUrl,
        pdfFileName: file.name,
        fileMime: file.type
      }));
    } catch (err: any) {
      console.error("Parse error detailed:", err);
      alert(`Lỗi khi xử lý file: ${err.message || "Vui lòng thử lại."}`);
    } finally {
      setIsParsing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const colRef = collection(db, "exams");
      await addDoc(colRef, {
        ...formData,
        teacherId: profile.uid,
        createdAt: new Date().toISOString()
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo đề: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
          <h2 className="text-xl font-bold text-indigo-900">Tạo đề thi mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Tên đề thi</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Kiểm tra 15p - Chương 1" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Mã đề (Ví dụ: T9-01)</label>
              <input required value={formData.examCode} onChange={e => setFormData({...formData, examCode: e.target.value})} placeholder="TOAN9-LAN1" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700">Tải file ĐÁP ÁN & THANG ĐIỂM (Không bắt buộc)</label>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                id="answer-key-upload" 
                accept=".pdf" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLoading(true);
                  try {
                    const uploadForm = new FormData();
                    uploadForm.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: uploadForm });
                    const data = await res.json();
                    setFormData(prev => ({ ...prev, answerPdfUrl: data.url, answerPdfFileName: file.name }));
                  } catch (err) {
                    alert("Lỗi tải file đáp án.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="hidden" 
              />
              <label 
                htmlFor="answer-key-upload" 
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-4 cursor-pointer border-2 border-dashed rounded-2xl transition-all",
                  formData.answerPdfUrl ? "border-green-300 bg-green-50/30 text-green-700" : "border-gray-200 bg-gray-50/50 text-gray-500 hover:border-indigo-300"
                )}
              >
                {formData.answerPdfUrl ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                <span className="text-sm font-bold truncate max-w-[200px]">{formData.answerPdfFileName || "TẢI PDF ĐÁP ÁN"}</span>
              </label>
              {formData.answerPdfUrl && (
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, answerPdfUrl: "", answerPdfFileName: "" }))} className="p-4 text-red-500 hover:bg-red-50 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700">Tải file đề thi (Bắt buộc: Word/PDF)</label>
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group",
                isDragActive ? "border-indigo-500 bg-indigo-50" : (formData.content ? "border-green-300 bg-green-50/30" : "border-gray-200 hover:border-indigo-300 bg-gray-50/50")
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  "w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center transition-all group-hover:scale-110",
                  formData.content ? "bg-green-500 text-white" : "bg-white text-indigo-500"
                )}>
                  {formData.content ? <CheckCircle2 className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">
                    {formData.content ? "Đã nhận file đề thi" : "Kéo thả file đề hoặc nhấn để chọn"}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Hỗ trợ định dạng .docx và .pdf</p>
                </div>
              </div>
            </div>

            {isParsing && (
              <div className="text-xs text-indigo-600 flex items-center justify-center gap-2 animate-pulse bg-indigo-50 py-2 rounded-lg">
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Đang đọc nội dung đề bài...
              </div>
            )}

            {formData.content && !isParsing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-bold text-green-600 flex items-center gap-1 uppercase">
                    <CheckCircle2 className="w-3 h-3" /> Nội dung văn bản (Dùng để AI chấm)
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, content: ""})}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Xóa và tải lại
                  </button>
                </div>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 leading-relaxed font-mono focus:border-indigo-300 outline-none"
                  placeholder="Kiểm tra lại nội dung văn bản trích xuất tại đây..."
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Thang điểm / Rubric (Nhập dạng văn bản nếu cần)</label>
            <textarea rows={3} value={formData.rubricText} onChange={e => setFormData({...formData, rubricText: e.target.value})} placeholder="Mô tả chi tiết thang điểm nếu không có file PDF đáp án..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors text-sm" />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Ghi chú cho AI mẫu chấm</label>
            <textarea rows={2} value={formData.aiInstruction} onChange={e => setFormData({...formData, aiInstruction: e.target.value})} placeholder="Ví dụ: Chấm thoáng phần lời giải, ưu tiên đáp số..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors text-sm" />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" disabled={loading || isParsing} className="flex-[2]">
              {loading ? "Đang tạo..." : "Lưu đề thi"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditExamModal({ exam, onClose, onUpdated }: { exam: any, onClose: () => void, onUpdated: () => void }) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: exam.title || "",
    examCode: exam.examCode || "",
    content: exam.content || "",
    pdfUrl: exam.pdfUrl || "",
    pdfFileName: exam.pdfFileName || "",
    answerPdfUrl: exam.answerPdfUrl || "",
    answerPdfFileName: exam.answerPdfFileName || "",
    rubricText: exam.rubricText || "",
    aiInstruction: exam.aiInstruction || "",
    fileMime: exam.fileMime || "",
    fileHtml: exam.fileHtml || ""
  });
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const data = await res.json();
      
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = "";
      let htmlContent = "";

      if (file.type.includes("word") || file.name.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        extractedText = result.value;
        htmlContent = htmlResult.value;
      } else if (file.type === "application/pdf") {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
        }
      }

      setFormData(prev => ({ 
        ...prev, 
        content: extractedText,
        fileHtml: htmlContent,
        pdfUrl: data.url,
        pdfFileName: file.name,
        fileMime: file.type
      }));
    } catch (err) {
      alert("Lỗi khi đọc file.");
    } finally {
      setIsParsing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (exam.teacherId !== profile.uid) {
      alert("Bạn không có quyền chỉnh sửa mã đề này.");
      return;
    }
    
    const oldCode = exam.examCode;
    const newCode = formData.examCode.trim().toUpperCase();
    const validCodeRegex = /^[A-Z0-9_-]+$/;

    if (!newCode) {
      alert("Vui lòng nhập mã đề mới.");
      return;
    }
    if (!validCodeRegex.test(newCode)) {
      alert("Mã đề chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch dưới.");
      return;
    }

    setLoading(true);
    try {
      if (newCode !== oldCode) {
        const q = query(collection(db, "exams"), where("examCode", "==", newCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          alert("Mã đề mới đã tồn tại. Vui lòng chọn mã khác.");
          setLoading(false);
          return;
        }

        const subCountQ = query(collection(db, "submissions"), where("examId", "==", exam.id));
        const subSnap = await getDocs(subCountQ);
        const subCount = subSnap.size;

        let warning = `Bạn có chắc chắn muốn đổi mã đề từ "${oldCode}" sang "${newCode}" không? \n\nHọc sinh sẽ phải dùng mã mới để nộp bài.`;
        if (subCount > 0) {
          warning = `Đề này đã có ${subCount} bài nộp của học sinh. Hệ thống sẽ cập nhật mã đề mới cho toàn bộ bài nộp cũ để giáo viên vẫn xem được thống kê. Bạn có muốn tiếp tục không?`;
        }

        if (!window.confirm(warning)) {
          setLoading(false);
          return;
        }

        for (const subDoc of subSnap.docs) {
          await updateDoc(doc(db, "submissions", subDoc.id), {
            examCode: newCode,
            updatedAt: new Date().toISOString()
          });
        }

        await addDoc(collection(db, "examCodeChangeLogs"), {
          examId: exam.id,
          teacherId: profile.uid,
          teacherEmail: profile.email,
          oldExamCode: oldCode,
          newExamCode: newCode,
          changedAt: new Date().toISOString()
        });
      }

      await updateDoc(doc(db, "exams", exam.id), {
        ...formData,
        examCode: newCode,
        updatedAt: new Date().toISOString()
      });

      alert("Cập nhật đề thi thành công.");
      onUpdated();
      onClose();
    } catch (err) {
      alert("Lỗi khi cập nhật.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50/50">
          <h2 className="text-xl font-bold text-amber-900">Chỉnh sửa đề thi</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Tên đề thi</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Tên đề thi" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Mã đề</label>
              <input required value={formData.examCode} onChange={e => setFormData({...formData, examCode: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700">File ĐÁP ÁN & THANG ĐIỂM (PDF)</label>
            <div className="flex items-center gap-3">
              <input type="file" id="edit-answer-pdf" accept=".pdf" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setLoading(true);
                try {
                  const uploadForm = new FormData();
                  uploadForm.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: uploadForm });
                  const data = await res.json();
                  setFormData(prev => ({ ...prev, answerPdfUrl: data.url, answerPdfFileName: file.name }));
                } catch (err) { alert("Lỗi upload."); } finally { setLoading(false); }
              }} />
              <label htmlFor="edit-answer-pdf" className={cn("flex-1 p-4 border-2 border-dashed rounded-2xl cursor-pointer text-sm font-bold text-center", formData.answerPdfUrl ? "border-green-300 bg-green-50/30 text-green-700" : "border-gray-200 bg-gray-50/50")}>
                {formData.answerPdfFileName || "THAY PDF ĐÁP ÁN"}
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700">File đề thi (Word/PDF)</label>
            <div {...getRootProps()} className={cn("border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer", isDragActive ? "border-indigo-500" : "border-gray-200 bg-gray-50/50")}>
              <input {...getInputProps()} />
              <p className="text-sm font-bold text-gray-700">{formData.pdfFileName || "Kéo thả hoặc nhấn để thay file đề"}</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Thang điểm / Rubric</label>
            <textarea rows={3} value={formData.rubricText} onChange={e => setFormData({...formData, rubricText: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Ghi chú cho AI</label>
            <textarea rows={2} value={formData.aiInstruction} onChange={e => setFormData({...formData, aiInstruction: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" disabled={loading || isParsing} className="flex-[2] bg-amber-500 hover:bg-amber-600">
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ fullName });
      onClose();
    } catch (err) {
      alert("Lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Cài đặt tài khoản</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <img src={profile?.photoURL} className="w-20 h-20 rounded-full border-4 border-indigo-50 shadow-sm" alt="" />
            <div className="text-center">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email liên kết</div>
              <div className="text-sm text-gray-600">{profile?.email}</div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Họ và Tên Giáo viên</label>
            <input 
              required 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors" 
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Đóng</Button>
            <Button type="submit" disabled={loading} className="flex-[2]">
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function SubmissionDetailModal({ submission, onClose }: { submission: any, onClose: () => void }) {
  const { profile } = useAuth();
  const [exam, setExam] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const docRef = doc(db, "exams", submission.examId);
        const snap = await getDoc(docRef);
        if (snap.exists()) setExam(snap.data());
      } catch (err) {
        console.error("Error fetching exam:", err);
      }
    };
    fetchExam();
  }, [submission.examId]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-[#FDFCFB] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết bài làm</h2>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
              Học sinh: {submission.studentName} • Lớp: {submission.studentClass}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column: Student Work & Exam */}
            <div className="p-8 space-y-10 border-r border-gray-100 bg-gray-50/30">
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                  <Upload className="w-5 h-5 text-indigo-500" /> Ảnh bài làm gốc
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {submission.uploadedImageUrls?.map((url: string, idx: number) => (
                    <div 
                      key={idx} 
                      className="aspect-square relative rounded-2xl overflow-hidden border border-gray-100 group cursor-zoom-in shadow-sm"
                      onClick={() => setActiveImage(url)}
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <PlusCircle className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                  <BookOpen className="w-5 h-5 text-amber-500" /> Đề thi (PDF)
                </h3>
                {exam?.pdfUrl ? (
                  <iframe 
                    src={exam.pdfUrl}
                    width="100%" 
                    height="400px"
                    style={{ border: "1px solid #eee", borderRadius: "1rem", backgroundColor: "white" }}
                    title="Đề thi"
                  />
                ) : (
                  <div className="p-10 bg-white border border-dashed rounded-2xl text-center text-gray-400 italic">
                    Không tìm thấy file PDF đề thi
                  </div>
                )}
              </div>

              {profile?.role === 'teacher' && exam?.answerPdfUrl && (
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-green-600 border-b pb-2">
                    <CheckCircle2 className="w-5 h-5" /> Đáp án & Thang điểm (PDF) 
                    <span className="text-[10px] text-gray-400 uppercase ml-auto tracking-widest">Chỉ giáo viên thấy</span>
                  </h3>
                  <iframe 
                    src={exam.answerPdfUrl}
                    width="100%" 
                    height="400px"
                    style={{ border: "1px solid #eee", borderRadius: "1rem", backgroundColor: "white" }}
                    title="Đáp án"
                  />
                </div>
              )}
            </div>

            {/* Right Column: AI Results */}
            <div className="p-8 space-y-8 bg-white">
              <div className="bg-indigo-600 rounded-3xl p-6 text-white text-center shadow-lg shadow-indigo-100">
                <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Tổng điểm AI chấm</div>
                <div className="text-6xl font-black">{submission.aiTotalScore}<span className="text-2xl font-normal opacity-50">/{submission.aiMaxTotalScore || 10}</span></div>
              </div>

              <div className="space-y-6 text-sm">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide text-xs text-indigo-600">
                    <ClipboardCheck className="w-4 h-4" /> Nhận xét tổng quát
                  </h4>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl text-gray-700 italic border-l-4 border-indigo-400">
                    "{submission.aiDetailedFeedback}"
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide text-xs text-red-600">
                    <AlertCircle className="w-4 h-4" /> Lỗi sai tiêu biểu
                  </h4>
                  <div className="p-4 bg-red-50/50 rounded-2xl text-red-800 border-l-4 border-red-400">
                    <Markdown>{submission.aiMistakes}</Markdown>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide text-xs text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> Chi tiết từng câu
                  </h4>
                  <div className="space-y-4">
                    {submission.aiScoreByQuestion?.map((q: any, i: number) => (
                      <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-gray-800 text-base">{q.question}</div>
                          <div className="bg-white px-3 py-1 rounded-lg text-xs font-black text-indigo-600 border border-indigo-100 shadow-sm">{q.score}/{q.maxScore} đ</div>
                        </div>
                        
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{q.feedback}</p>

                        {(q.earnedPoints?.length > 0 || q.lostPoints?.length > 0) && (
                          <div className="grid grid-cols-1 gap-3 pt-2">
                            {q.earnedPoints?.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Điểm đạt được
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.earnedPoints.map((item: string, idx: number) => (
                                    <div key={idx} className="text-[11px] text-green-700 bg-white border border-green-100 px-2 py-1.5 rounded-lg flex items-start gap-2 shadow-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0" />
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {q.lostPoints?.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Điểm bị trừ/mất
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.lostPoints.map((item: string, idx: number) => (
                                    <div key={idx} className="text-[11px] text-red-700 bg-white border border-red-100 px-2 py-1.5 rounded-lg flex items-start gap-2 shadow-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide text-xs text-amber-600">
                    <LogOut className="w-4 h-4 rotate-180" /> Gợi ý sửa bài & Ôn tập
                  </h4>
                  <div className="p-4 bg-amber-50/50 rounded-2xl text-amber-900 border-l-4 border-amber-400 prose prose-xs">
                    <Markdown>{submission.aiSuggestions}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white flex justify-between gap-3">
          <Button variant="ghost" onClick={onClose} className="px-8">Đóng</Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                submission.uploadedImageUrls?.forEach((url: string, idx: number) => {
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `bai_lam_${submission.studentName}_${idx + 1}.jpg`;
                  link.click();
                });
              }} 
              className="bg-white"
            >
              <Upload className="w-4 h-4 rotate-180" /> Tải toàn bộ ảnh
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="bg-white">
              <FileDown className="w-4 h-4" /> In nhận xét
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Image Viewer Overlay */}
      {activeImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-8 transition-opacity"
          onClick={() => setActiveImage(null)}
        >
          <button className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
            <X className="w-8 h-8" />
          </button>
          <img src={activeImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" alt="Full size" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
             <a href={activeImage} target="_blank" rel="noreferrer" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700">Mở trong tab mới</a>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherView() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions' | 'trash'>('exams');
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filterCode, setFilterCode] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [editingExam, setEditingExam] = useState<any>(null);

  const fetchData = async () => {
    if (!profile) return;
    
    try {
      const examsQ = query(collection(db, "exams"), where("teacherId", "==", profile.uid));
      const examsSnap = await getDocs(examsQ);
      setExams(examsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const subQ = query(collection(db, "submissions"), where("teacherId", "==", profile.uid));
      const subSnap = await getDocs(subQ);
      setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fetch data error:", err);
    }
  };

  useEffect(() => { fetchData(); }, [profile]);

  const filteredSubmissions = submissions.filter(s => {
    const matchSearch = s.examCode.toLowerCase().includes(filterCode.toLowerCase()) ||
                       s.studentName.toLowerCase().includes(filterCode.toLowerCase()) ||
                       s.studentEmail.toLowerCase().includes(filterCode.toLowerCase());
    const matchClass = filterClass === "" || (s.studentClass && s.studentClass.toLowerCase().includes(filterClass.toLowerCase()));
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchClass && matchStatus;
  }).sort((a, b) => {
    return sortOrder === 'desc' ? b.aiTotalScore - a.aiTotalScore : a.aiTotalScore - b.aiTotalScore;
  });

  const exportCSV = () => {
    const headers = ["Học tên", "Email", "Lớp", "Mã đề", "Điểm", "Thời gian"];
    const rows = filteredSubmissions.map(s => [
      s.studentName,
      s.studentEmail,
      s.studentClass || "",
      s.examCode,
      s.aiTotalScore,
      new Date(s.submittedAt).toLocaleString('vi-VN')
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `diem_hoc_sinh_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const deleteExam = async (exam: any) => {
    if (exam.teacherId !== profile?.uid) {
      alert("Bạn không có quyền xóa đề thi này.");
      return;
    }
    const { id, title, examCode, pdfUrl } = exam;
    
    if (exam.isDeleted) {
      if (window.confirm(`XÁC NHẬN XÓA VĨNH VIỄN: Đề thi "${title}" và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn?`)) {
        setLoading(true);
        try {
          // 1. Get all submissions (including deleted ones)
          const subQ = query(collection(db, "submissions"), where("examCode", "==", examCode));
          const subSnap = await getDocs(subQ);
          
          // 2. Delete student images from storage
          for (const subDoc of subSnap.docs) {
            const subData = subDoc.data();
            if (subData.uploadedImageUrls) {
              for (const url of subData.uploadedImageUrls) {
                if (url.includes('/uploads/')) {
                  const filename = url.split('/').pop();
                  if (filename) await fetch(`/api/upload/${filename}`, { method: 'DELETE' });
                }
              }
            }
            // 3. Delete submission record
            await deleteDoc(doc(db, "submissions", subDoc.id));
          }

          // 4. Delete PDF file
          if (pdfUrl && pdfUrl.includes('/uploads/')) {
            const filename = pdfUrl.split('/').pop();
            if (filename) await fetch(`/api/upload/${filename}`, { method: 'DELETE' });
          }

          // 5. Delete exam record
          await deleteDoc(doc(db, "exams", id));

          // 6. Audit Log
          await addDoc(collection(db, "logs"), {
            action: "permanent_delete_exam",
            examCode,
            examTitle: title,
            teacherEmail: profile?.email,
            timestamp: new Date().toISOString(),
            deletedSubmissionsCount: subSnap.size
          });

          alert("Đã xóa vĩnh viễn đề thi và toàn bộ dữ liệu thành công.");
          fetchData();
        } catch (err) {
          console.error("Permanent delete error:", err);
          alert("Lỗi khi xóa vĩnh viễn.");
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    // Soft delete logic
    const subQ = query(collection(db, "submissions"), where("examCode", "==", examCode));
    const subSnap = await getDocs(subQ);
    const subCount = subSnap.size;

    let warning = `Bạn có muốn chuyển đề thi "${title}" vào Thùng rác? Bạn có thể khôi phục lại sau.`;
    if (subCount > 0) {
      warning = `Đề thi này đã có ${subCount} bài nộp của học sinh. Chuyển đề vào Thùng rác sẽ tạm ẩn bài làm và đề khỏi học sinh. Bạn đồng ý?`;
    }

    if (window.confirm(warning)) {
      setLoading(true);
      try {
        const timestamp = new Date().toISOString();
        // Soft delete exam
        await updateDoc(doc(db, "exams", id), { isDeleted: true, deletedAt: timestamp });
        
        // Soft delete submissions (optional, but good for consistency)
        for (const subDoc of subSnap.docs) {
          await updateDoc(doc(db, "submissions", subDoc.id), { isDeleted: true, deletedAt: timestamp });
        }

        fetchData();
      } catch (err) {
        console.error("Soft delete error:", err);
        alert("Lỗi khi chuyển vào thùng rác.");
      } finally {
        setLoading(false);
      }
    }
  };

  const restoreExam = async (exam: any) => {
    if (exam.teacherId !== profile?.uid) {
      alert("Bạn không có quyền khôi phục đề thi này.");
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, "exams", exam.id), { isDeleted: false, deletedAt: null });
      
      const subQ = query(collection(db, "submissions"), where("examCode", "==", exam.examCode));
      const subSnap = await getDocs(subQ);
      for (const subDoc of subSnap.docs) {
        await updateDoc(doc(db, "submissions", subDoc.id), { isDeleted: false, deletedAt: null });
      }

      alert("Đã khôi phục đề thi.");
      fetchData();
    } catch (err) {
      alert("Lỗi khi khôi phục.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLockExam = async (exam: any) => {
    if (exam.teacherId !== profile?.uid) {
      alert("Bạn không có quyền khóa/mở đề thi này.");
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, "exams", exam.id), { isLocked: !exam.isLocked });
      fetchData();
    } catch (err) {
      alert("Lỗi khi thay đổi trạng thái khóa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl font-sans">M</div>
            <h1 className="text-xl font-extrabold text-indigo-950 uppercase tracking-wider">Teacher Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm"
            >
              <img src={profile?.photoURL} className="w-7 h-7 rounded-full" alt="" />
              <span className="text-sm font-semibold text-indigo-800">{profile?.fullName || profile?.displayName}</span>
            </button>
            <button onClick={logout} className="p-2.5 hover:bg-red-50 text-red-500 rounded-xl border border-transparent hover:border-red-100 transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('exams')}
                className={cn("px-6 py-2.5 rounded-xl text-sm font-semibold transition-all", 
                  activeTab === 'exams' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-gray-500 hover:bg-gray-50")}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Quản lý đề
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('submissions')}
                className={cn("px-6 py-2.5 rounded-xl text-sm font-semibold transition-all", 
                  activeTab === 'submissions' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-gray-500 hover:bg-gray-50")}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Bài làm học sinh
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('trash')}
                className={cn("px-6 py-2.5 rounded-xl text-sm font-semibold transition-all", 
                  activeTab === 'trash' ? "bg-red-600 text-white shadow-lg shadow-red-200" : "text-gray-500 hover:bg-gray-50")}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Thùng rác
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'exams' ? (
                <Button onClick={() => setShowModal(true)}>
                  <PlusCircle className="w-5 h-5" /> Tạo đề thi mới
                </Button>
              ) : (
                <Button onClick={exportCSV} variant="outline" className="bg-white">
                  <FileDown className="w-5 h-5" /> Xuất bảng điểm
                </Button>
              )}
            </div>
          </div>

          {activeTab === 'submissions' && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tìm học sinh/Mã đề</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Tên, email, mã đề..."
                    value={filterCode}
                    onChange={e => setFilterCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5 w-[150px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Lớp</label>
                <input 
                  type="text" 
                  placeholder="Lọc lớp..."
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm"
                />
              </div>
              <div className="space-y-1.5 w-[150px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Trạng thái</label>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm appearance-none"
                >
                  <option value="all">Tất cả</option>
                  <option value="Đã chấm">Đã chấm</option>
                  <option value="Chưa chấm">Chưa chấm</option>
                  <option value="Lỗi ảnh">Lỗi ảnh</option>
                </select>
              </div>
              <div className="space-y-1.5 w-[150px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Sắp xếp điểm</label>
                <select 
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm appearance-none"
                >
                  <option value="desc">Cao nhất</option>
                  <option value="asc">Thấp nhất</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {(activeTab === 'exams' || activeTab === 'trash') ? (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeTab === 'exams' && (
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-indigo-100/50 hover:border-indigo-300 transition-all group min-h-[220px]"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-indigo-900">Tạo đề thi mới</p>
                    <p className="text-xs text-indigo-400 font-medium">Lên kế hoạch cho buổi học tiếp theo</p>
                  </div>
                </button>
              )}
              
              {exams.filter(e => activeTab === 'trash' ? e.isDeleted : !e.isDeleted).length === 0 ? (
                activeTab === 'trash' ? (
                  <Card className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 space-y-4 bg-gray-50/50 border-dashed border-2">
                    <Trash2 className="w-16 h-16 opacity-10" />
                    <p className="text-lg">Thùng rác đang trống.</p>
                  </Card>
                ) : (
                  exams.length === 0 && (
                    <Card className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
                      <BookOpen className="w-16 h-16 opacity-20" />
                      <p className="text-lg">Bạn chưa tạo đề thi nào.</p>
                      <Button onClick={() => setShowModal(true)} variant="outline">Tạo đề ngay</Button>
                    </Card>
                  )
                )
              ) : exams.filter(e => activeTab === 'trash' ? e.isDeleted : !e.isDeleted).map((exam) => (
                <Card key={exam.id} className="hover:shadow-lg transition-all group relative border-gray-100 p-0 overflow-hidden flex flex-col shadow-sm">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">{exam.examCode}</span>
                      <div className="text-[10px] text-gray-400 font-medium">{new Date(exam.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{exam.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {exam.pdfUrl ? (
                         <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-bold uppercase transition-colors">
                           <FileText className="w-3 h-3" /> Đề PDF
                         </span>
                      ) : (
                         <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">Chưa có đề</span>
                      )}
                      {exam.answerPdfUrl ? (
                        <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold uppercase transition-colors border border-green-100">
                          <CheckCircle2 className="w-3 h-3" /> Đáp án PDF
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold uppercase transition-colors border border-red-100">
                          <AlertCircle className="w-3 h-3" /> Thiếu đáp án PDF
                        </span>
                      )}
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                        exam.isLocked ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                      )}>
                        {exam.isLocked ? "Đã khóa" : "Đang mở"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/50 p-2 grid grid-cols-5 gap-1 border-t border-gray-100">
                    {activeTab === 'exams' ? (
                      <>
                        <button 
                          onClick={() => window.open(exam.pdfUrl, '_blank')}
                          className="flex flex-col items-center justify-center gap-1 py-2 bg-white text-indigo-600 text-[10px] font-bold rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
                          title="Xem đề PDF"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Đề</span>
                        </button>
                        <button 
                          onClick={() => exam.answerPdfUrl ? window.open(exam.answerPdfUrl, '_blank') : alert('Chưa tải file đáp án.')}
                          className={cn("flex flex-col items-center justify-center gap-1 py-2 bg-white text-[10px] font-bold rounded-xl border transition-all shadow-sm",
                            exam.answerPdfUrl ? "text-green-600 border-green-100 hover:bg-green-50" : "text-gray-300 border-gray-100 cursor-not-allowed opacity-50"
                          )}
                          title="Xem đáp án PDF"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Đ.án</span>
                        </button>
                        <button 
                          onClick={() => setEditingExam(exam)}
                          className="flex items-center justify-center gap-2 py-2 bg-white text-gray-600 text-xs font-bold rounded-xl border border-gray-100 hover:border-amber-400 hover:text-amber-600 transition-all shadow-sm"
                          title="Sửa đề"
                        >
                          <PlusCircle className="w-4 h-4 rotate-45 text-amber-500" />
                        </button>
                        <button 
                          onClick={() => toggleLockExam(exam)}
                          className={cn("flex items-center justify-center gap-2 py-2 bg-white text-xs font-bold rounded-xl border border-gray-100 transition-all shadow-sm",
                            exam.isLocked ? "hover:border-green-400 hover:text-green-600" : "hover:border-amber-400 hover:text-amber-600"
                          )}
                          title={exam.isLocked ? "Mở khóa" : "Khóa đề"}
                        >
                          {exam.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => deleteExam(exam)}
                          className="flex items-center justify-center gap-2 py-2 bg-white text-red-400 text-xs font-bold rounded-xl border border-gray-100 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" shrink-0 />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => restoreExam(exam)}
                          className="col-span-2 flex items-center justify-center gap-2 py-2 bg-white text-green-600 text-xs font-bold rounded-xl border border-gray-100 hover:bg-green-50 transition-all shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
                        </button>
                        <button 
                          onClick={() => deleteExam(exam)}
                          className="col-span-2 flex items-center justify-center gap-2 py-2 bg-white text-red-500 text-xs font-bold rounded-xl border border-gray-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa vĩnh viễn
                        </button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </motion.div>
          ) : (
            <motion.div 
               key="submissions"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
            >
              <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAFBFC] border-b border-gray-100 uppercase text-[11px] font-bold text-gray-500 tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Học sinh</th>
                        <th className="px-6 py-4">Mã đề / Lớp</th>
                        <th className="px-6 py-4">Điểm / Trạng thái</th>
                        <th className="px-6 py-4">Thời gian nộp</th>
                        <th className="px-6 py-4 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-gray-400">Không tìm thấy bài nộp nào phù hợp.</td>
                        </tr>
                      ) : filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-indigo-50/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                                {sub.studentName?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{sub.studentName}</div>
                                <div className="text-[10px] text-gray-400">{sub.studentEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-700">{sub.examCode}</div>
                            <div className="text-[11px] text-gray-500 italic">Lớp {sub.studentClass}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className={cn("inline-flex items-center gap-1.5 font-bold text-lg", 
                                sub.aiTotalScore >= 8 ? "text-green-600" : sub.aiTotalScore >= 5 ? "text-amber-500" : "text-red-500"
                              )}>
                                {sub.aiTotalScore}
                                <span className="text-xs text-gray-300 font-normal">/ 10</span>
                              </div>
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded w-fit uppercase", 
                                sub.status === 'Đã chấm' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                              )}>{sub.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(sub.submittedAt).toLocaleString('vi-VN', { 
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <Button onClick={() => setSelectedSubmission(sub)} variant="ghost" className="h-9 px-4 text-xs bg-white border border-gray-100 hover:border-indigo-200">Xem chi tiết</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showModal && <CreateExamModal onClose={() => setShowModal(false)} onCreated={fetchData} />}
      {editingExam && <EditExamModal exam={editingExam} onClose={() => setEditingExam(null)} onUpdated={fetchData} />}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {selectedSubmission && (
        <SubmissionDetailModal 
          submission={selectedSubmission} 
          onClose={() => setSelectedSubmission(null)} 
        />
      )}
    </div>
  );
}

// --- STUDENT VIEWS ---

function StudentView() {
  const { profile } = useAuth();
  const [step, setStep] = useState<'code' | 'exam' | 'result'>('code');
  const [examCode, setExamCode] = useState("");
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);

  const checkCode = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "exams"), where("examCode", "==", examCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("Mã đề không tồn tại.");
      } else {
        const examData = snap.docs[0].data();
        if (examData.isDeleted) {
          alert("Đề thi này đã bị xóa hoặc ngừng hoạt động.");
          return;
        }
        if (examData.isLocked) {
          alert("Đề thi này hiện đang bị khóa. Vui lòng liên hệ giáo viên.");
          return;
        }
        if (!examData.pdfUrl) {
          alert("Đề thi chưa có file PDF.");
          return;
        }

        // Restriction: Only keep non-sensitive fields for student frontend usage
        const studentExam = {
          id: snap.docs[0].id,
          examCode: examData.examCode,
          title: examData.title,
          pdfUrl: examData.pdfUrl,
          content: examData.content, // Needed for AI logic if no PDF
          // used only for AI grading call internally
          answerPdfUrl: examData.answerPdfUrl,
          rubricText: examData.rubricText,
          rubric: examData.rubric,
          aiInstruction: examData.aiInstruction,
          teacherId: examData.teacherId
        };
        
        setCurrentExam(studentExam);
        setStep('exam');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    setFiles([...files, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: true 
  });

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const submitWork = async () => {
    if (files.length === 0) return;
    
    // Check if both rubric and answer key are missing
    if (!currentExam.answerPdfUrl && !currentExam.rubricText && !currentExam.rubric) {
      alert("Giáo viên chưa cung cấp đáp án hoặc thang điểm, AI chưa thể chấm bài.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload images to server
      const imageUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (!res.ok) throw new Error("Upload ảnh thất bại");
        const data = await res.json();
        imageUrls.push(data.url);
      }

      // 2. Convert files to base64 ONLY for AI processing (not for storage)
      const base64Promises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      const base64Images = await Promise.all(base64Promises);

      // 3. Call AI to grade
      const result = await gradeSubmission(
        base64Images,
        currentExam.title,
        currentExam.content,
        currentExam.rubricText || currentExam.rubric || "",
        currentExam.answerPdfUrl,
        currentExam.aiInstruction,
        profile?.fullName || profile?.displayName,
        profile?.className
      );

      if (result.status === 'missing_answer_key') {
        alert("Giáo viên chưa cung cấp đáp án hoặc thang điểm chi tiết, AI chưa thể chấm bài.");
        setLoading(false);
        return;
      }

      if (result.status === 'image_unreadable') {
        alert("Ảnh bài làm chưa rõ hoặc thiếu trang, vui lòng chụp lại và nộp lại bài.");
        setLoading(false);
        return;
      }

      // 4. Save submission
      const subColRef = collection(db, "submissions");
      await addDoc(subColRef, {
        examId: currentExam.id,
        examCode: currentExam.examCode,
        examTitle: currentExam.title,
        teacherId: currentExam.teacherId,
        studentId: profile?.uid,
        studentName: profile?.fullName || profile?.displayName,
        studentClass: profile?.className,
        studentEmail: profile?.email,
        uploadedImageUrls: imageUrls,
        usedAnswerPdfUrl: currentExam.answerPdfUrl || null,
        aiStatus: result.status,
        aiTotalScore: result.totalScore,
        aiMaxTotalScore: result.maxTotalScore,
        aiScoreByQuestion: result.scoreByQuestion,
        aiGeneralFeedback: result.generalFeedback,
        aiMistakes: result.mistakes,
        aiSuggestions: result.suggestions,
        needTeacherReview: result.needTeacherReview,
        submittedAt: new Date().toISOString(),
        status: result.status === 'graded' ? "Đã chấm" : "Lỗi",
        isDeleted: false
      });

      setGradingResult(result);
      setStep('result');
    } catch (err) {
      console.error(err);
      alert("Lỗi khi chấm bài: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-amber-500 w-6 h-6" />
            <span className="font-bold text-gray-900 tracking-tight">MathAI Student</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-gray-900">{profile?.fullName}</div>
              <div className="text-[10px] text-gray-400">Lớp {profile?.className}</div>
            </div>
            <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {step === 'code' && (
            <motion.div key="code" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl mx-auto flex items-center justify-center">
                  <Search className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold">Vào thi ngay thôi!</h2>
                <p className="text-gray-500">Nhập mã đề giáo viên đã cung cấp để xem nội dung.</p>
              </div>
              <Card className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mã đề thi</label>
                  <input 
                    type="text" 
                    value={examCode}
                    onChange={e => setExamCode(e.target.value)}
                    placeholder="VÍ DỤ: TOAN9-HOCKY1"
                    className="w-full text-2xl font-bold tracking-widest text-center py-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 outline-none transition-all placeholder:text-indigo-200"
                  />
                </div>
                <Button onClick={checkCode} disabled={!examCode || loading} className="w-full py-4 text-lg bg-indigo-600">
                  {loading ? "Đang kiểm tra..." : "Bắt đầu làm bài"}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 'exam' && (
            <motion.div key="exam" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{currentExam.title}</h2>
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full inline-block uppercase tracking-widest border border-indigo-100">
                  Mã đề: {currentExam.examCode}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl relative min-h-[400px] flex flex-col">
                  {currentExam.pdfUrl ? (
                    <>
                      <div className="flex-1 relative">
                        <iframe 
                          src={currentExam.pdfUrl}
                          width="100%" 
                          height="750px"
                          style={{ border: "none", backgroundColor: "white" }}
                          title="Đề thi PDF"
                          onLoad={() => setLoading(false)}
                        />
                      </div>
                      <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col items-center gap-3">
                        <p className="text-sm text-gray-500">Không hiển thị được PDF? Hãy bấm nút bên dưới.</p>
                        <a 
                          href={currentExam.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors bg-white px-8 py-4 rounded-2xl shadow-md border border-indigo-100 active:scale-95"
                        >
                          <FileText className="w-5 h-5" /> Mở đề thi PDF trong tab mới
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="p-20 bg-amber-50 text-amber-800 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                      <p className="font-bold text-lg">Đề thi chưa có file PDF.</p>
                    </div>
                  )}
                </div>

                <Card className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Họ và Tên Học sinh</label>
                      <input 
                        type="text" 
                        value={profile?.fullName || ""} 
                        readOnly
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-bold outline-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lớp / Nhóm</label>
                      <input 
                        type="text" 
                        value={profile?.className || ""} 
                        readOnly
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-bold outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-50">
                    <h3 className="font-bold flex items-center gap-2 text-gray-900">
                      <Upload className="w-5 h-5 text-amber-500" /> Tải ảnh bài làm (Chụp ảnh hoặc chọn file)
                    </h3>
                    <div 
                      {...getRootProps()} 
                      className={cn(
                        "border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer group",
                        isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 bg-gray-50/30"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white shadow-sm text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <PlusCircle className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-700">Nhấn để chụp ảnh hoặc kéo ảnh vào đây</p>
                          <p className="text-xs text-gray-400 mt-1">AI có thể đọc chữ viết tay. Hãy chụp ảnh thật rõ nét!</p>
                        </div>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                        {files.map((file, idx) => (
                          <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden border border-gray-200 group shadow-sm">
                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button 
                      onClick={submitWork} 
                      disabled={files.length === 0 || loading} 
                      className={cn("w-full py-5 text-xl mt-8 shadow-2xl transition-all", loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]")}
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          AI đang phân tích và chấm bài...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Nộp bài cho AI chấm <ChevronRight className="w-6 h-6" />
                        </div>
                      )}
                    </Button>
                    <div className="text-center">
                       <button onClick={() => setStep('code')} className="text-sm font-medium text-gray-400 hover:text-indigo-600 transition-colors">Quay lại</button>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 'result' && gradingResult && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full mx-auto flex items-center justify-center border-4 border-green-100">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold">Chấm bài thành công!</h2>
                <p className="text-gray-500">Xem phản hồi chi tiết từ AI bên dưới.</p>
              </div>

              <Card className="overflow-hidden border-none shadow-xl">
                 <div className="bg-indigo-600 p-8 text-white text-center space-y-1">
                   <div className="text-sm font-medium text-indigo-200 uppercase tracking-widest">TỔNG ĐIỂM AI CHẤM</div>
                   <div className="text-7xl font-black">{gradingResult.totalScore}<span className="text-3xl opacity-40 font-normal ml-1">/{gradingResult.maxTotalScore || 10}</span></div>
                 </div>
                 <div className="p-8 space-y-10">
                   <div className="space-y-4">
                     <h3 className="font-bold text-gray-900 flex items-center gap-2 uppercase text-xs tracking-wider">
                       <ClipboardCheck className="w-5 h-5 text-indigo-500" /> Nhận xét tổng quát
                     </h3>
                     <div className="p-5 bg-indigo-50/50 rounded-2xl text-gray-700 leading-relaxed italic border-l-4 border-indigo-400">
                       "{gradingResult.generalFeedback}"
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h3 className="font-bold text-gray-900 flex items-center gap-2 uppercase text-xs tracking-wider">
                       <AlertCircle className="w-4 h-4 text-amber-500" /> Chi tiết từng câu
                     </h3>
                     <div className="space-y-4">
                       {gradingResult.scoreByQuestion.map((q, i) => (
                         <div key={i} className="p-5 border border-gray-100 rounded-3xl space-y-4 bg-white shadow-sm">
                           <div className="flex justify-between items-center">
                             <div className="font-bold text-gray-800 text-base">{q.question}</div>
                             <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-black border border-indigo-100">{q.score}/{q.maxScore} đ</div>
                           </div>
                           
                           <p className="text-sm text-gray-600 font-medium leading-relaxed">{q.feedback}</p>

                           {(q.earnedPoints?.length > 0 || q.lostPoints?.length > 0) && (
                             <div className="grid grid-cols-1 gap-4 pt-2">
                               {q.earnedPoints?.length > 0 && (
                                 <div className="space-y-2">
                                   <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                                     <CheckCircle2 className="w-3 h-3" /> Điểm đạt được
                                   </div>
                                   <div className="grid grid-cols-1 gap-2">
                                     {q.earnedPoints.map((item, idx) => (
                                       <div key={idx} className="text-[11px] text-green-700 bg-green-50/50 border border-green-100 px-3 py-2 rounded-xl flex items-start gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                         {item}
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )}
                               {q.lostPoints?.length > 0 && (
                                 <div className="space-y-2">
                                   <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
                                     <AlertCircle className="w-3 h-3" /> Điểm bị trừ/mất
                                   </div>
                                   <div className="grid grid-cols-1 gap-2">
                                     {q.lostPoints.map((item, idx) => (
                                       <div key={idx} className="text-[11px] text-red-700 bg-red-50/50 border border-red-100 px-3 py-2 rounded-xl flex items-start gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                         {item}
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )}
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h3 className="font-bold text-gray-900 flex items-center gap-2">
                       <Search className="w-5 h-5 text-green-500" /> Gợi ý học tập
                     </h3>
                     <div className="prose prose-sm prose-green">
                        <Markdown>{gradingResult.suggestions}</Markdown>
                     </div>
                   </div>

                   <Button onClick={() => setStep('code')} variant="outline" className="w-full py-4 rounded-2xl">
                     Hoàn thành & Về trang chủ
                   </Button>
                 </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- MAIN APP ---

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <LoginPage />;
  if (!profile?.role) return <RoleSelection />;

  return profile.role === 'teacher' ? <TeacherView /> : <StudentView />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
