import { GoogleGenAI } from "@google/genai";
import { ToolType } from "../types";

const SYSTEM_INSTRUCTION = `أنت المحرك الذكي لتطبيق (عالم الدواء). أنت خبير صيدلاني يمني رقمي. المهام المطلوبة:
تحليل الروشتة: استخرج (الاسم التجاري، المادة العلمية، الجرعة) وقدم البدائل المتوفرة في اليمن (يدكو، شفا، سبأ، العالمية، شيفا). إذا كان الخط غير واضح، قدم 3 احتمالات منطقية بناءً على تخصص الطبيب وسياق الروشتة. 
التنسيق المطلوب للروشتة: 
1. جدول رئيسي عمودي للأدوية (الدواء 💊 | الجرعة 🥄 | التوقيت ⏰ | ملاحظات 📝).
2. جدول منفصل للبدائل اليمنية المقترحة (الدواء الأصلي | البديل اليمني 🇾🇪 | الشركة المصنعة).
3. قسم خاص للتداخلات الدوائية إن وجدت في جدول (الدواء A | الدواء B | مستوى الخطورة ⚠️ | التفسير).

تحليل البشرة: حدد الحالة (تصبغات، حب شباب، إلخ)، المادة الفعالة المطلوبة، وروتين العناية المتاح محلياً في جدول منظم.
تداخل الأدوية: صنف التعارض (خطير 🔴، متوسط 🟡، بسيط 🟢) مع شرح السبب العلمي في جدول احترافي.
حارس التخصص: لا تجب على أي سؤال خارج الطب والصيدلة. رد بـ: 'عذراً، أنا خبيرك في عالم الدواء فقط'.
ملاحظة هامة: استخدم الجداول دائماً لتنظيم المعلومات المعقدة. اجعل العناوين واضحة واستخدم الرموز التعبيرية (Emojis) كأيقونات داخل الجداول.`;

export async function validateApiKey(apiKey: string) {
  if (!apiKey) {
    return { valid: false, message: "يرجى إدخال مفتاح API." };
  }

  const trimmedKey = apiKey.trim();

  if (trimmedKey.length < 30) {
    return { valid: false, message: "المفتاح قصير جداً. تأكد من نسخ المفتاح كاملاً." };
  }

  if (!trimmedKey.startsWith("AIza")) {
    return { valid: false, message: "تنسيق المفتاح غير صحيح. يجب أن يبدأ بـ AIza." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    
    // Use a very simple prompt to verify the key
    // We use gemini-3-flash-preview as it's the standard for this app
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hi",
      config: { 
        maxOutputTokens: 5,
      }
    });
    
    // If we get here, the key is valid enough to make a request
    if (response) {
      return { valid: true, message: "المفتاح صالح ويعمل بنجاح" };
    }
    
    return { valid: false, message: "فشل التحقق: استجابة فارغة من المحرك." };
  } catch (error: any) {
    console.error("API Key Validation Error:", error);
    
    const errorMessage = error?.message || "";
    const status = error?.status || (error?.response?.status);
    const lowerMessage = errorMessage.toLowerCase();
    
    // Detailed error categorization
    if (lowerMessage.includes("api_key_invalid") || lowerMessage.includes("invalid api key") || status === 401) {
      return { valid: false, message: "مفتاح API غير صحيح. تأكد من نسخه من Google AI Studio." };
    }
    
    if (lowerMessage.includes("quota") || lowerMessage.includes("429") || status === 429) {
      return { valid: false, message: "انتهت الحصة المجانية لهذا المفتاح اليوم." };
    }

    if (lowerMessage.includes("blocked") || lowerMessage.includes("permission") || status === 403) {
      return { valid: false, message: "هذا المفتاح محظور أو لا يملك صلاحيات الوصول لـ Gemini API." };
    }

    if (lowerMessage.includes("not found") || status === 404) {
      return { valid: false, message: "الموديل غير متاح لهذا المفتاح. تأكد من تفعيل Gemini API في مشروعك في Google Cloud Console." };
    }
    
    return { 
      valid: false, 
      message: "فشل التحقق: " + (errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage) 
    };
  }
}

export async function generateGeminiResponse(
  apiKey: string,
  modelName: string,
  toolType: ToolType,
  prompt: string,
  imageData?: string
) {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let hiddenPrefix = "";
    switch (toolType) {
      case 'prescription':
        hiddenPrefix = "[SYSTEM: Execute Yemen Prescription Protocol] ";
        break;
      case 'skin':
        hiddenPrefix = "[SYSTEM: Execute Dermatological Analysis Protocol] ";
        break;
      case 'interaction':
        hiddenPrefix = "[SYSTEM: Execute Drug Interaction Check] ";
        break;
    }

    const fullPrompt = hiddenPrefix + prompt;

    if (imageData) {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: fullPrompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageData.split(',')[1]
                }
              }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });
      return response.text;
    } else {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });
      return response.text;
    }
  } catch (error: any) {
    console.error("Gemini Response Error:", error);
    const msg = error?.message || "";
    const lowerMsg = msg.toLowerCase();
    
    if (lowerMsg.includes("api_key_invalid") || lowerMsg.includes("invalid api key") || error?.status === 401) {
      throw new Error("API_KEY_ERROR: مفتاح API الذي تستخدمه غير صحيح أو تم إيقافه.");
    }
    if (lowerMsg.includes("quota") || lowerMsg.includes("429") || error?.status === 429) {
      throw new Error("QUOTA_ERROR: انتهت الحصة المجانية لهذا المفتاح اليوم.");
    }
    if (lowerMsg.includes("blocked") || lowerMsg.includes("permission") || error?.status === 403) {
      throw new Error("PERMISSION_ERROR: هذا المفتاح محظور من الوصول للموديل.");
    }
    if (lowerMsg.includes("not found") || error?.status === 404) {
      throw new Error("MODEL_NOT_FOUND: الموديل المختار غير متاح لهذا المفتاح. تأكد من تفعيل Gemini API في مشروعك.");
    }
    
    throw error;
  }
}
