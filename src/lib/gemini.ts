import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GradingResult {
  status: "graded" | "missing_answer_key" | "image_unreadable";
  totalScore: number;
  maxTotalScore: number;
  scoreByQuestion: {
    question: string;
    score: number;
    maxScore: number;
    feedback: string;
    mistakes?: string;
    suggestions?: string;
    earnedPoints?: string[];
    lostPoints?: string[];
  }[];
  generalFeedback: string;
  mistakes: string;
  suggestions: string;
  needTeacherReview: boolean;
}

export async function gradeSubmission(
  imagesBase64: string[],
  examTitle: string,
  examContent: string,
  rubric: string,
  answerPdfUrl?: string,
  aiInstruction?: string,
  studentName?: string,
  studentClass?: string
): Promise<GradingResult> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Bạn là một chuyên gia giáo dục Toán học tại Việt Nam, chuyên chấm bài tự luận theo đáp án và thang điểm.
    Nhiệm vụ của bạn là chấm điểm bài làm của học sinh dựa trên ảnh chụp, linh hoạt và công bằng.
    
    NGUYÊN TẮC CHẤM ĐIỂM (BẮT BUỘC):
    1. Đọc đề thi và đáp án/thang điểm được cung cấp.
    2. CHẤM THEO TỪNG BƯỚC: Học sinh làm đúng đến đâu thì cho điểm đến đó.
    3. KHÔNG CHẤM 0 ĐIỂM TOÀN CÂU nếu học sinh có phần làm đúng (công thức, lập luận, hoặc các bước trung gian).
    4. Nếu kết quả cuối cùng sai nhưng phương pháp, công thức, lập luận đúng một phần thì vẫn cho điểm tương ứng.
    5. Nếu học sinh làm cách khác nhưng đúng bản chất toán học thì vẫn cho điểm.
    6. Nếu chỉ có đáp án mà không có lời giải, chỉ cho điểm đáp án theo rubric.
    7. Nếu ảnh mờ, thiếu trang hoặc không đọc được, hãy trả về status "image_unreadable".
    
    DỮ LIỆU:
    - Tiêu đề đề thi: ${examTitle}
    - Nội dung đề bài: ${examContent || "Xem trong ảnh/file đáp án"}
    - Thang điểm/Rubric: ${rubric || "Xem trong file đáp án"}
    - Ghi chú giáo viên: ${aiInstruction || "Không có"}
    - Học sinh: ${studentName || "Ẩn danh"}
    - Lớp: ${studentClass || "N/A"}
    
    YÊU CẦU ĐẶC BIỆT:
    - Nếu có answerPdfUrl, bạn PHẢI ưu tiên sử dụng thông tin từ đó để chấm.
    - Kết quả trả về PHẢI là JSON theo schema yêu cầu.
  `;

  const prompt = `
    Dựa trên dữ liệu được cung cấp:
    - Nếu có link đáp án PDF: {{${answerPdfUrl}}}
    - Hãy chấm bài làm trong các ảnh đính kèm. 
    - Trả về kết quả đúng định dạng JSON.
  `;

  const imageParts = imagesBase64.map(base64 => {
    const mimeMatch = base64.match(/^data:(image\/[a-z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const data = base64.split(",")[1] || base64;
    return {
      inlineData: {
        mimeType,
        data
      }
    };
  });

  // If answerPdfUrl exists and is accessible, we could potentially fetch it and convert to base64 or pass its content if possible.
  // However, normally Gemini can access URLs if instructed, or we should fetch it here.
  // For simplicity in this environment, we will assume AI can use information if we provide the link or if we fetch it.
  // Let's try to fetch it if it's on our server.

  const parts: any[] = [...imageParts, { text: prompt }];

  if (answerPdfUrl) {
    try {
      const response = await fetch(answerPdfUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: base64.split(",")[1]
        }
      });
    } catch (err) {
      console.error("Failed to fetch answer PDF:", err);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: "user", parts: parts }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["graded", "missing_answer_key", "image_unreadable"] },
            totalScore: { type: Type.NUMBER },
            maxTotalScore: { type: Type.NUMBER },
            scoreByQuestion: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  maxScore: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  mistakes: { type: Type.STRING },
                  suggestions: { type: Type.STRING },
                  earnedPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  lostPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["question", "score", "maxScore", "feedback"]
              }
            },
            generalFeedback: { type: Type.STRING },
            mistakes: { type: Type.STRING },
            suggestions: { type: Type.STRING },
            needTeacherReview: { type: Type.BOOLEAN }
          },
          required: ["status", "totalScore", "maxTotalScore", "scoreByQuestion", "generalFeedback", "needTeacherReview"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI trả về kết quả rỗng.");
    }

    return JSON.parse(text) as GradingResult;
  } catch (error) {
    console.error("AI Grading Error Details:", error);
    if (error instanceof Error) {
      if (error.message.includes("candidate")) {
        throw new Error("AI không thể chấm bài này (có thể do ảnh quá mờ hoặc nội dung nhạy cảm).");
      }
      if (error.message.includes("quota")) {
        throw new Error("Hệ thống AI đang quá tải. Vui lòng thử lại sau vài phút.");
      }
    }
    throw new Error("Lỗi kết nối với AI. Vui lòng kiểm tra lại ảnh chụp hoặc thử lại sau.");
  }
}
