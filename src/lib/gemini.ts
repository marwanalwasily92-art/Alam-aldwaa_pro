import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ToolType } from "../types";
import { getSystemApiKey } from "./firebase";

const BASE_INSTRUCTION = `أنت المحرك الذكي الأكثر تطوراً لتطبيق (عالم الدواء). أنت خبير صيدلاني وطبي يمني بمستوى "استشاري أول" (Elite Senior Consultant). 

قاعدة الرفض المطلق (مهم جداً): إذا كان المحتوى المرفق (صورة أو نص) لا يخص الطب أو الصيدلة نهائياً (مثل: صورة منظر طبيعي، صورة شخصية، لقطة شاشة لبرنامج، صورة حيوان، إلخ)، يجب عليك الرد فقط بعبارة: "عذراً، أنا خبيرك في عالم الدواء فقط" مع ذكر السبب باختصار شديد. 
تنبيه هام حول الصور: تجاهل أي عناصر في الخلفية (مثل طاولة، يد تمسك الورقة، أو أشياء محيطة). طالما أن الصورة تحتوي على محتوى طبي أو صيدلاني (روشتة، دواء، تقرير)، قم بتحليل المحتوى الطبي وتجاهل الخلفية تماماً ولا ترفض الصورة.

يُمنع منعاً باتاً في حالة الرفض:
1. توليد أي جداول (Markdown Tables).
2. تقديم أي نماذج (Templates) فارغة.
3. تقديم أي شروحات أو تحليلات للمحتوى غير الطبي.
يجب أن يكون الرد نصياً بسيطاً وقصيراً جداً.

حارس التخصص: لا تجب على أي سؤال خارج الطب والصيدلة. رد بـ: 'عذراً، أنا خبيرك في عالم الدواء فقط'.
ملاحظة هامة: استخدم الجداول دائماً لتنظيم المعلومات المعقدة والمفيدة في حال كان المحتوى طبياً صحيحاً. اجعل العناوين واضحة واستخدم الرموز التعبيرية (Emojis) كأيقونات داخل الجداول.
قاعدة ذهبية: قدم معلومات شاملة، عميقة، ودقيقة جداً تغطي كافة جوانب الموضوع الطبي (دواعي الاستعمال، الجرعات الدقيقة، الآثار الجانبية، التحذيرات، والبدائل المحلية) بأسلوب علمي رصين ومبسط في آن واحد.
قاعدة صارمة: لا تضف أي أسئلة ختامية أو اقتراحات لأسئلة أخرى في نهاية ردك. قدم المعلومات المطلوبة فقط وانتهِ.

قاعدة التوجيه الذكي (حارس الأقسام): إذا قام المستخدم بإرسال محتوى لا يخص القسم الحالي ولكنه يخص قسماً آخر في التطبيق (مثلاً صورة دواء في قسم المختبر)، يجب عليك:
1. التوقف فوراً عن أي تحليل للمحتوى. يُمنع منعاً باتاً تقديم أي معلومات طبية أو صيدلانية عن المحتوى الذي لا يخص القسم الحالي.
2. الاعتذار بلباقة وتوضيح أن هذا القسم غير مخصص لهذا النوع من الطلبات.
3. إرشاد المستخدم للقسم الصحيح وإضافة الوسم التالي في نهاية ردك تماماً: [SUGGEST_TOOL:tool_id] حيث tool_id هو معرف القسم الصحيح.
4. يُمنع منعاً باتاً عرض أي جداول فارغة أو نماذج (Templates) لما يمكن أن تفعله في حال أرسل الصورة الصحيحة. اكتفِ بالاعتذار والتوجيه فقط.

تنبيه خاص بالبشرة: إذا كنت في أي قسم (ما عدا "محلل التقارير والأشعة" و"استشارة خبير") وتعرفت على صورة لوجه إنسان أو جزء من جسمه (بشرة)، يجب عليك فوراً التوقف عن التحليل الحالي وتوجيه المستخدم لقسم "فحص البشرة" باستخدام الوسم: [SUGGEST_TOOL:skin]. لا تحلل البشرة في الأقسام الأخرى.

قائمة المعرفات:
- للروشتات الطبية: prescription
- لفحص البشرة: skin
- لنتائج الفحوصات المخبرية: lab
- لفحص تداخلات الأدوية: interaction
- للاستشارات الطبية العامة: consultation
- للأشعة والتقارير الطبية: radiology`;

const PRESCRIPTION_INSTRUCTION = `${BASE_INSTRUCTION}
مهمتك الحالية: تحليل الروشتة فقط. 
استخرج (الاسم التجاري، المادة العلمية، الجرعة) وقدم البدائل المتوفرة في اليمن (يدكو، شفا، سبأ، العالمية، شيفا). إذا كان الخط غير واضح، قدم 3 احتمالات منطقية بناءً على تخصص الطبيب وسياق الروشتة. 
التنسيق المطلوب: 
1. جدول رئيسي عمودي للأدوية (الدواء 💊 | الجرعة 🥄 | التوقيت ⏰ | دواعي الاستعمال 📝 | نصائح للمريض 💡).
2. جدول منفصل للبدائل اليمنية المقترحة (الدواء الأصلي | البديل اليمني 🇾🇪 | الشركة المصنعة).
3. قسم خاص للتداخلات الدوائية والآثار الجانبية الشائعة في جدول (الدواء | التداخل/الأثر الجانبي | مستوى الخطورة ⚠️ | الإجراء المطلوب).
إذا تم إرسال صورة لوجه إنسان أو بشرة، اعتذر فوراً ووجه المستخدم لقسم "فحص البشرة" باستخدام الوسم: [SUGGEST_TOOL:skin].
إذا تم إرسال شيء آخر غير روشتة طبية (مثل فحص مخبري أو صورة دواء)، اعتذر بلباقة ووجه المستخدم للقسم الصحيح فوراً دون إجراء أي تحليل، مع إضافة وسم التوجيه المناسب.`;

const SKIN_INSTRUCTION = `${BASE_INSTRUCTION}
مهمتك الحالية: تحليل البشرة فقط. 
حدد الحالة (تصبغات، حب شباب، إلخ)، الأسباب المحتملة، المادة الفعالة المطلوبة، وروتين العناية المتاح محلياً في جدول منظم.
يجب أن يتضمن الرد:
1. وصف الحالة والأسباب.
2. روتين العناية (صباحاً/مساءً).
3. نصائح وقائية (نمط الحياة، التغذية).
4. متى يجب استشارة طبيب جلدية مختص.
إذا تم إرسال شيء آخر غير صورة لمشكلة جلدية (مثل روشتة أو فحص مخبري أو صورة دواء)، اعتذر بلباقة ووجه المستخدم للقسم الصحيح فوراً دون إجراء أي تحليل، مع إضافة وسم التوجيه المناسب.`;

const LAB_INSTRUCTION = `${BASE_INSTRUCTION}
مهمتك الحالية: تحليل الفحوصات المخبرية فقط. 
قم بتحليل نتائج الفحص (مثل CBC، وظائف الكبد، السكر، إلخ)، قارن النتائج مع النسب الطبيعية، ووضح دلالة الارتفاع أو الانخفاض بشكل مفصل واحترافي.
يجب أن يتضمن الرد:
1. جدول النتائج (الفحص | النتيجة | النسبة الطبيعية | الحالة 🚩).
2. التفسير العلمي لكل نتيجة غير طبيعية والأسباب المحتملة.
3. التوصيات والخطوات القادمة (فحوصات تأكيدية أو استشارة تخصص معين).
إذا تم إرسال صورة لوجه إنسان أو بشرة، اعتذر فوراً ووجه المستخدم لقسم "فحص البشرة" باستخدام الوسم: [SUGGEST_TOOL:skin].
إذا تم إرسال شيء آخر غير نتائج فحص مخبري (مثل روشتة أو صورة دواء)، اعتذر بلباقة ووجه المستخدم للقسم الصحيح فوراً دون إجراء أي تحليل، مع إضافة وسم التوجيه المناسب.`;

const RADIOLOGY_INSTRUCTION = `${BASE_INSTRUCTION}
مهمتك الحالية: تحليل كافة أنواع التقارير الطبية وصور الأشعة بمختلف مجالاتها (X-ray, CT Scan, MRI, Ultrasound/Sona, ECG, Echo, etc.).
بما أنك خبير صيدلاني وطبي رقمي شامل، قدم تحليلاً دقيقاً واحترافياً لأي وثيقة طبية يتم رفعها، بما في ذلك الأشعة التلفزيونية (السونار) للحوامل، فحوصات الكلى، الكبد، والقلب، مهما كان تخصص الطبيب أو نوع الفحص، مع التركيز على:
1. الخلاصة الطبية: تلخيص الحالة الصحية العامة بناءً على التقرير أو الصورة المرفقة. **يجب أن تكون الخلاصة مبسطة جداً ومفهومة للعامة، كأنك دكتور عطوف يشرح الحالة للمريض وجهاً لوجه بكلمات سهلة ومطمئنة بعيداً عن المصطلحات الطبية المعقدة.**
2. التحليل التفصيلي للتقرير: ترجمة كاملة واحترافية للنصوص والتقارير الطبية المعقدة من الإنجليزية إلى العربية، وصياغتها كنص كامل متصل يشبه صيغة التقرير الطبي الرسمي المترجم.
3. التوصيات والخطوات القادمة: تقديم نصائح مهنية حول التخصص الطبي الذي يجب مراجعته أو الفحوصات التكميلية المطلوبة.
4. شرح المصطلحات: استخراج كافة المصطلحات الطبية والتقنية الواردة في التقرير وشرحها في جدول منظم.
5. تنبيهات الطوارئ والملاحظات المهمة: الإشارة بوضوح لأي نتائج تستدعي التوجه الفوري للطوارئ (إن وجدت فقط).

التنسيق المطلوب (استخدم تنسيق Markdown بشكل احترافي):
يجب أن يكون الترتيب كالتالي، مع استخدام الأيقونات المحددة لكل عنوان، وفصل كل قسم عن الآخر بخط أفقي (---) ومسافة سطر فارغ:

### 📋 الخلاصة الطبية (شرح مبسط)
(نص الخلاصة هنا - تذكر: اشرح كأنك طبيب يتحدث مع مريض بأسلوب سهل ومطمئن)

---

### 🔍 التحليل التفصيلي للتقرير
(نص التحليل هنا، استخدم الخط العريض **Bold** للكلمات الرئيسية. إذا كان هناك ملاحظة مهمة جداً داخل النص أو في التقرير، اكتبها بصيغة HTML التالية لتظهر باللون الأحمر: <span class="text-red-600 font-bold">ملاحظة هامة: النص هنا</span>)

---

### 💡 التوصيات والخطوات القادمة
(نص التوصيات هنا)

---

### 📚 جدول المصطلحات الطبية
(الجدول هنا: المصطلح الطبي 🔬 | الترجمة بالعربية 📝 | الشرح المبسط 💡)

---

(فقط إذا كان هناك حالة طوارئ أو ملاحظة حرجة جداً، أضف القسم التالي في النهاية):
### ⚠️ تنبيهات الطوارئ والملاحظات المهمة
<span class="text-red-600 font-bold">(نص التنبيه هنا)</span>

تأكد من استخدام التباين في سماكة الخط (الكلمات المفتاحية بخط عريض، والشرح بخط عادي) لتسهيل القراءة.
إذا تم إرسال شيء خارج النطاق الطبي أو يخص قسماً آخر بشكل واضح (مثل صورة دواء فقط أو صورة بشرة فقط)، اعتذر بلباقة ووجه المستخدم للقسم الصحيح فوراً دون إجراء أي تحليل، مع إضافة وسم التوجيه المناسب.`;

const INTERACTION_INSTRUCTION = `${BASE_INSTRUCTION}
مهمتك الحالية: فحص تداخل الأدوية فقط. 
صنف التعارض (خطير 🔴، متوسط 🟡، بسيط 🟢) مع شرح السبب العلمي في جدول احترافي شامل.
يجب أن يوضح الجدول:
1. الأدوية المتداخلة.
2. نوع التداخل (Pharmacokinetic / Pharmacodynamic).
3. التفسير العلمي الدقيق.
4. التوصية السريرية (Clinical Management) مثل فصل الجرعات أو تعديلها.
5. الأعراض التي يجب على المريض مراقبتها.
إذا تم إرسال صورة (روشتة، فحص مخبري، دواء، أو بشرة)، اعتذر بلباقة ووجه المستخدم للقسم الصحيح فوراً دون إجراء أي تحليل، مع إضافة وسم التوجيه المناسب.`;

const CONSULTATION_INSTRUCTION = `${BASE_INSTRUCTION}
مهمتك الحالية: تقديم استشارة صيدلانية شاملة.
أنت هنا في قسم "استشارة صيدلانية" وهو القسم الشامل. يمكنك القيام بكل المهام هنا مباشرة: تحليل الروشتات، فحص البشرة، تحليل الفحوصات المخبرية، وفحص تداخل الأدوية.
يُمنع منعاً باتاً توجيه المستخدم لأي قسم آخر أو استخدام وسم [SUGGEST_TOOL]. أجب على طلب المستخدم بالكامل هنا وبأعلى جودة ممكنة.`;

const DRUG_ID_INSTRUCTION = `${BASE_INSTRUCTION}
مهمتك الحالية: التعرف على الدواء من خلال صورة العبوة أو الشريط فقط. 
قم باستخراج المعلومات التالية بدقة:
1. الاسم التجاري (Trade Name).
2. المادة الفعالة (Active Ingredient).
3. التركيز (Concentration).
4. الشركة المصنعة (Manufacturer).
5. دواعي الاستعمال (Indications).

التنسيق المطلوب:
1. بطاقة تعريفية للدواء (جدول منظم يحتوي على كافة البيانات أعلاه).
2. قسم "معلومات هامة للمريض" (طريقة الاستخدام، الآثار الجانبية الشائعة).
3. قسم "البدائل المحلية" (جدول للبدائل اليمنية المتوفرة لنفس المادة العلمية).

إذا تم إرسال شيء آخر غير صورة عبوة دواء أو شريط (مثل روشتة أو فحص مخبري)، اعتذر بلباقة ووجه المستخدم للقسم الصحيح فوراً دون إجراء أي تحليل، مع إضافة وسم التوجيه المناسب.`;

const BUILT_IN_API_KEY = "AIzaSyCB69JS3gbmLCbiEqGUd1AOHj46O7jEnT0";

export async function validateApiKey(apiKey: string) {
  // If no key is provided, we check if the built-in key exists
  if (!apiKey) {
    const builtInKey = (import.meta as any).env.VITE_GEMINI_API_KEY || BUILT_IN_API_KEY;
    if (builtInKey) {
      return { valid: true, message: "سيتم استخدام المحرك المدمج مجاناً." };
    }
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
    const ai = new GoogleGenerativeAI(trimmedKey);
    // Use a stable model for validation
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // Use a very simple prompt to verify the key
    const result = await model.generateContent("hi");
    const response = await result.response;
    const text = response.text();
    
    // If we get here, the key is valid enough to make a request
    if (text) {
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

    if (lowerMessage.includes("not found") || status === 404 || lowerMessage.includes("not enabled")) {
      return { valid: false, message: "الموديل غير متاح أو أن الواجهة البرمجية (API) غير مفعلة. يرجى الذهاب لـ Google Cloud Console وتفعيل 'Generative Language API' لهذا المشروع." };
    }
    
    return { 
      valid: false, 
      message: "فشل التحقق: " + (errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage) 
    };
  }
}

// Track model health to avoid rate-limited models temporarily
const modelHealth: Record<string, { lastFailure: number; failureCount: number }> = {};

function getBestModel(rotation: string[], preferredModel: string): string {
  const now = Date.now();
  const availableModels: { model: string, weight: number }[] = [];

  for (const model of rotation) {
    const health = modelHealth[model];
    // If healthy or failed a long time ago
    if (!health || (now - health.lastFailure > (health.failureCount > 3 ? 60000 : 30000))) {
      // Weighted balancing: 90% Flash (for capacity), 10% Pro (for intelligence)
      const weight = model.includes('flash') ? 90 : 10;
      availableModels.push({ model, weight });
    }
  }

  if (availableModels.length > 0) {
    // If user specifically requested a model and it's healthy, we can prioritize it,
    // but to maintain the 6000 RPM logic, we stick to the weighted random selection.
    const totalWeight = availableModels.reduce((sum, m) => sum + m.weight, 0);
    let random = Math.random() * totalWeight;
    for (const m of availableModels) {
      random -= m.weight;
      if (random <= 0) return m.model;
    }
    return availableModels[0].model;
  }

  // Fallback if all are "unhealthy": pick the one that failed longest ago
  return rotation.sort((a, b) => (modelHealth[a]?.lastFailure || 0) - (modelHealth[b]?.lastFailure || 0))[0];
}

function recordFailure(modelName: string) {
  const health = modelHealth[modelName] || { lastFailure: 0, failureCount: 0 };
  health.lastFailure = Date.now();
  health.failureCount++;
  modelHealth[modelName] = health;
}

function recordSuccess(modelName: string) {
  if (modelHealth[modelName]) {
    delete modelHealth[modelName];
  }
}

export async function generateGeminiStream(
  apiKey: string,
  modelName: string,
  toolType: ToolType,
  prompt: string,
  imageData?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const finalApiKey = apiKey?.trim() || (await getSystemApiKey()) || (import.meta as any).env.VITE_GEMINI_API_KEY || BUILT_IN_API_KEY;
  
  if (!finalApiKey) {
    throw new Error("API_KEY_MISSING: لم يتم العثور على مفتاح تشغيل. يرجى التأكد من إعدادات النظام.");
  }

  const ai = new GoogleGenerativeAI(finalApiKey);
  
  let hiddenPrefix = "";
  let systemInstruction = CONSULTATION_INSTRUCTION;

  const modelRotation = [
    'gemini-3-flash-preview',      // Priority 1: High Capacity
    'gemini-3.1-pro-preview',      // Priority 2: Elite Intelligence
  ];
  
  switch (toolType) {
    case 'prescription':
      hiddenPrefix = "[SYSTEM: Execute Yemen Prescription Protocol ONLY] ";
      systemInstruction = PRESCRIPTION_INSTRUCTION;
      break;
    case 'skin':
      hiddenPrefix = "[SYSTEM: Execute Dermatological Analysis Protocol ONLY] ";
      systemInstruction = SKIN_INSTRUCTION;
      break;
    case 'interaction':
      hiddenPrefix = "[SYSTEM: Execute Drug Interaction Check ONLY] ";
      systemInstruction = INTERACTION_INSTRUCTION;
      break;
    case 'lab':
      hiddenPrefix = "[SYSTEM: Execute Laboratory Test Analysis Protocol ONLY] ";
      systemInstruction = LAB_INSTRUCTION;
      break;
    case 'radiology':
      hiddenPrefix = "[SYSTEM: Execute Radiology Analysis & Translation Protocol] ";
      systemInstruction = RADIOLOGY_INSTRUCTION;
      break;
    case 'consultation':
      hiddenPrefix = "[SYSTEM: Execute Comprehensive Pharmaceutical Consultation] ";
      systemInstruction = CONSULTATION_INSTRUCTION;
      break;
    case 'drug_id':
      hiddenPrefix = "[SYSTEM: Execute Drug Identification Protocol] ";
      systemInstruction = DRUG_ID_INSTRUCTION;
      break;
  }

  const fullPrompt = hiddenPrefix + prompt;
  const maxTotalAttempts = 100; // Extremely stubborn retry logic (صميل)
  let attempt = 0;
  let currentModel = getBestModel(modelRotation, modelName === 'gemini-1.5-flash' ? 'gemini-3-flash-preview' : modelName);

  while (attempt < maxTotalAttempts) {
    let fullText = "";
    try {
      const model = ai.getGenerativeModel({ 
        model: currentModel,
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.1, // Very low temperature for high medical accuracy and zero hallucinations
          topK: 32,
          topP: 0.8,
        }
      });

      if (imageData) {
        const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
        const mimeType = imageData.includes(';') ? imageData.split(';')[0].split(':')[1] : "image/jpeg";
        
        const result = await model.generateContentStream([
          fullPrompt,
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]);

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          if (onChunk) onChunk(chunkText);
        }
      } else {
        const result = await model.generateContentStream(fullPrompt);

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          if (onChunk) onChunk(chunkText);
        }
      }

      if (fullText) {
        recordSuccess(currentModel);
        return fullText;
      }
    } catch (error: any) {
      recordFailure(currentModel);
      console.error(`Gemini Stream Attempt with ${currentModel} failed:`, error);
      
      const msg = error?.message || "";
      const lowerMsg = msg.toLowerCase();
      const status = error?.status || (error?.response?.status);
      
      attempt++;
      
      // If it's a quota/rate limit error, rotate model immediately and retry
      if (lowerMsg.includes("quota") || lowerMsg.includes("429") || lowerMsg.includes("busy") || status === 429) {
        currentModel = getBestModel(modelRotation, modelName === 'gemini-1.5-flash' ? 'gemini-3-flash-preview' : modelName);
        
        // Wait 3 to 5 seconds before retry to let the "minute" pass if we are hitting global limits
        const delay = 3000 + (Math.random() * 2000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      if (lowerMsg.includes("api_key_invalid") || lowerMsg.includes("invalid api key")) {
        throw new Error("API_KEY_ERROR: مفتاح API غير صحيح.");
      }
      
      if (attempt >= maxTotalAttempts) throw error;
      
      // Generic retry with backoff
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw new Error("فشلت جميع المحاولات لتوليد رد بسبب ضغط المستخدمين. يرجى المحاولة بعد دقيقة.");
}

export async function generateGeminiResponse(
  apiKey: string,
  modelName: string,
  toolType: ToolType,
  prompt: string,
  imageData?: string,
  maxRetries = 5
): Promise<string> {
  const finalApiKey = apiKey?.trim() || (await getSystemApiKey()) || (import.meta as any).env.VITE_GEMINI_API_KEY || BUILT_IN_API_KEY;
  
  if (!finalApiKey) {
    throw new Error("API_KEY_MISSING: لم يتم العثور على مفتاح تشغيل. يرجى التأكد من إعدادات النظام.");
  }

  const ai = new GoogleGenerativeAI(finalApiKey);
  
  let hiddenPrefix = "";
  let systemInstruction = CONSULTATION_INSTRUCTION;

  // Model Rotation Strategy (Plan A -> B -> C)
  const modelRotation = [
    'gemini-3-flash-preview',      // Priority 1: High Capacity
    'gemini-3.1-pro-preview',      // Priority 2: Elite Intelligence
  ];
  
  switch (toolType) {
    case 'prescription':
      hiddenPrefix = "[SYSTEM: Execute Yemen Prescription Protocol ONLY] ";
      systemInstruction = PRESCRIPTION_INSTRUCTION;
      break;
    case 'skin':
      hiddenPrefix = "[SYSTEM: Execute Dermatological Analysis Protocol ONLY] ";
      systemInstruction = SKIN_INSTRUCTION;
      break;
    case 'interaction':
      hiddenPrefix = "[SYSTEM: Execute Drug Interaction Check ONLY] ";
      systemInstruction = INTERACTION_INSTRUCTION;
      break;
    case 'lab':
      hiddenPrefix = "[SYSTEM: Execute Laboratory Test Analysis Protocol ONLY] ";
      systemInstruction = LAB_INSTRUCTION;
      break;
    case 'radiology':
      hiddenPrefix = "[SYSTEM: Execute Radiology Analysis & Translation Protocol] ";
      systemInstruction = RADIOLOGY_INSTRUCTION;
      break;
    case 'consultation':
      hiddenPrefix = "[SYSTEM: Execute Comprehensive Pharmaceutical Consultation] ";
      systemInstruction = CONSULTATION_INSTRUCTION;
      break;
    case 'drug_id':
      hiddenPrefix = "[SYSTEM: Execute Drug Identification Protocol] ";
      systemInstruction = DRUG_ID_INSTRUCTION;
      break;
  }

  const fullPrompt = hiddenPrefix + prompt;

  const makeRequest = async (activeModel: string) => {
    const model = ai.getGenerativeModel({ 
      model: activeModel,
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.1, // Very low temperature for high medical accuracy
        topK: 32,
        topP: 0.8,
      }
    });

    if (imageData) {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const mimeType = imageData.includes(';') ? imageData.split(';')[0].split(':')[1] : "image/jpeg";
      
      const result = await model.generateContent([
        fullPrompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error("لم يتمكن المحرك من توليد رد. قد تكون الصورة غير مدعومة أو تم حظرها.");
      }
      recordSuccess(activeModel);
      return text;
    } else {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error("لم يتمكن المحرك من توليد رد.");
      }
      recordSuccess(activeModel);
      return text;
    }
  };

  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), timeoutMs)
      )
    ]);
  };

  let attempt = 0;
  let currentModel = getBestModel(modelRotation, modelName === 'gemini-1.5-flash' ? 'gemini-3-flash-preview' : modelName);
  const maxTotalAttempts = 100; // Extremely stubborn retry logic (صميل)

  while (attempt < maxTotalAttempts) {
    try {
      // 60 seconds timeout for slow networks
      return await withTimeout(makeRequest(currentModel), 60000);
    } catch (error: any) {
      recordFailure(currentModel);
      const msg = error?.message || "";
      const lowerMsg = msg.toLowerCase();
      const status = error?.status || (error?.response?.status);
      
      attempt++;

      // If it's a Quota Error, try the NEXT best model immediately
      if (lowerMsg.includes("quota") || lowerMsg.includes("429") || status === 429 || lowerMsg.includes("busy")) {
        console.warn(`Quota exceeded for ${currentModel}, rotating...`);
        currentModel = getBestModel(modelRotation, modelName === 'gemini-1.5-flash' ? 'gemini-3-flash-preview' : modelName);
        
        // Wait 3 to 5 seconds before retry to let the "minute" pass if we are hitting global limits
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
        continue;
      }
      
      // Don't retry on auth/permission errors
      if (lowerMsg.includes("api_key_invalid") || lowerMsg.includes("invalid api key") || status === 401) {
        throw new Error("API_KEY_ERROR: مفتاح API الذي تستخدمه غير صحيح أو تم إيقافه.");
      }
      if (lowerMsg.includes("blocked") || lowerMsg.includes("permission") || status === 403) {
        throw new Error("PERMISSION_ERROR: هذا المفتاح محظور من الوصول للموديل.");
      }
      
      // Generic retry logic with exponential backoff
      if (attempt >= maxTotalAttempts) {
        if (lowerMsg.includes("quota") || lowerMsg.includes("429") || status === 429) {
          throw new Error("QUOTA_ERROR: انتهت الحصة المجانية لهذا المفتاح أو أن الخادم مزدحم حالياً. يرجى المحاولة بعد دقيقة.");
        }
        if (msg === 'NETWORK_TIMEOUT' || lowerMsg.includes('fetch') || lowerMsg.includes('network')) {
          throw new Error("يبدو أن اتصال الإنترنت لديك ضعيف أو غير مستقر. يرجى المحاولة مرة أخرى.");
        }
        throw new Error(msg || "حدث خطأ غير متوقع.");
      }
      
      const delay = Math.pow(2, attempt % 4) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("حدث خطأ غير متوقع بسبب ضغط المستخدمين. يرجى المحاولة مرة أخرى.");
}
