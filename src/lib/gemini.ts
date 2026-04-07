import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ToolType } from "../types";

const BASE_INSTRUCTION = `أنت المحرك الذكي لتطبيق (عالم الدواء). أنت خبير صيدلاني يمني رقمي. 

قاعدة الرفض المطلق (مهم جداً): إذا كان المحتوى المرفق (صورة أو نص) لا يخص الطب أو الصيدلة نهائياً (مثل: صورة منظر طبيعي، صورة شخصية، لقطة شاشة لبرنامج، صورة حيوان، إلخ)، يجب عليك الرد فقط بعبارة: "عذراً، أنا خبيرك في عالم الدواء فقط" مع ذكر السبب باختصار شديد. 
يُمنع منعاً باتاً في هذه الحالة:
1. توليد أي جداول (Markdown Tables).
2. تقديم أي نماذج (Templates) فارغة.
3. تقديم أي شروحات أو تحليلات للمحتوى غير الطبي.
يجب أن يكون الرد نصياً بسيطاً وقصيراً جداً.

حارس التخصص: لا تجب على أي سؤال خارج الطب والصيدلة. رد بـ: 'عذراً، أنا خبيرك في عالم الدواء فقط'.
ملاحظة هامة: استخدم الجداول دائماً لتنظيم المعلومات المعقدة والمفيدة في حال كان المحتوى طبياً صحيحاً. اجعل العناوين واضحة واستخدم الرموز التعبيرية (Emojis) كأيقونات داخل الجداول.
قاعدة ذهبية: قدم معلومات شاملة وكاملة تغطي كافة جوانب الموضوع الطبي (دواعي الاستعمال، الجرعات، الآثار الجانبية، التحذيرات، والبدائل) بحيث لا يحتاج السائل للاستفسار مرة أخرى عن نفس الموضوع.
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

export async function validateApiKey(apiKey: string) {
  // If no key is provided, we check if the built-in key exists
  if (!apiKey) {
    const builtInKey = process.env.GEMINI_API_KEY;
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
    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    
    // Use a very simple prompt to verify the key
    // We use gemini-1.5-flash as it's the standard for this app
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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

export async function generateGeminiStream(
  apiKey: string,
  modelName: string,
  toolType: ToolType,
  prompt: string,
  imageData?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const finalApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY;
  
  if (!finalApiKey) {
    throw new Error("API_KEY_MISSING: لم يتم العثور على مفتاح تشغيل.");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  
  let hiddenPrefix = "";
  let systemInstruction = CONSULTATION_INSTRUCTION;

  const modelRotation = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp'
  ];
  
  let currentModelIndex = modelRotation.indexOf(modelName);
  if (currentModelIndex === -1) currentModelIndex = 0;

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
  }

  const fullPrompt = hiddenPrefix + prompt;
  const activeModel = modelRotation[currentModelIndex];

  let fullText = "";

  try {
    if (imageData) {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const mimeType = imageData.includes(';') ? imageData.split(';')[0].split(':')[1] : "image/jpeg";
      
      const result = await ai.models.generateContentStream({
        model: activeModel,
        contents: {
          parts: [
            { text: fullPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        },
        config: {
          systemInstruction: systemInstruction
        }
      });

      for await (const chunk of (result as any).stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk) onChunk(chunkText);
      }
    } else {
      const result = await ai.models.generateContentStream({
        model: activeModel,
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction
        }
      });

      for await (const chunk of (result as any).stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk) onChunk(chunkText);
      }
    }

    if (!fullText) {
      throw new Error("لم يتمكن المحرك من توليد رد.");
    }

    return fullText;
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    const msg = error?.message || "";
    const lowerMsg = msg.toLowerCase();
    
    if (lowerMsg.includes("quota") || lowerMsg.includes("429")) {
      throw new Error("QUOTA_ERROR: انتهت الحصة المجانية لهذا المفتاح.");
    }
    if (lowerMsg.includes("api_key_invalid") || lowerMsg.includes("invalid api key")) {
      throw new Error("API_KEY_ERROR: مفتاح API غير صحيح.");
    }
    
    throw error;
  }
}

export async function generateGeminiResponse(
  apiKey: string,
  modelName: string,
  toolType: ToolType,
  prompt: string,
  imageData?: string,
  maxRetries = 3
): Promise<string> {
  // Use user key if provided, otherwise fallback to built-in key
  const finalApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY;
  
  if (!finalApiKey) {
    throw new Error("API_KEY_MISSING: لم يتم العثور على مفتاح تشغيل. يرجى إضافة مفتاحك الخاص أو التأكد من إعدادات النظام.");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  
  let hiddenPrefix = "";
  let systemInstruction = CONSULTATION_INSTRUCTION;

  // Model Rotation Strategy (Plan A -> B -> C)
  const modelRotation = [
    'gemini-1.5-flash',            // Plan A: Stable, Fast & Best Vision for production
    'gemini-1.5-pro',              // Plan B: High Accuracy Fallback
    'gemini-2.0-flash-exp'         // Plan C: Next-gen speed fallback
  ];
  
  // If the user specifically requested a model, we put it first
  let currentModelIndex = modelRotation.indexOf(modelName);
  if (currentModelIndex === -1) currentModelIndex = 0;

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
  }

  const fullPrompt = hiddenPrefix + prompt;

  const makeRequest = async (model: string) => {
    if (imageData) {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const mimeType = imageData.includes(';') ? imageData.split(';')[0].split(':')[1] : "image/jpeg";
      
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            { text: fullPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        },
        config: {
          systemInstruction: systemInstruction
        }
      });
      
      if (!response.text) {
        throw new Error("لم يتمكن المحرك من توليد رد. قد تكون الصورة غير مدعومة أو تم حظرها.");
      }
      return response.text;
    } else {
      const response = await ai.models.generateContent({
        model: model,
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction
        }
      });
      
      if (!response.text) {
        throw new Error("لم يتمكن المحرك من توليد رد.");
      }
      return response.text;
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
  let modelAttempt = currentModelIndex;

  while (attempt < maxRetries) {
    const activeModel = modelRotation[modelAttempt % modelRotation.length];
    
    try {
      // 60 seconds timeout for slow networks
      return await withTimeout(makeRequest(activeModel), 60000);
    } catch (error: any) {
      const msg = error?.message || "";
      const lowerMsg = msg.toLowerCase();
      const status = error?.status || (error?.response?.status);
      
      // If it's a Quota Error, try the NEXT model in rotation immediately
      if (lowerMsg.includes("quota") || lowerMsg.includes("429") || status === 429) {
        console.warn(`Quota exceeded for ${activeModel}, rotating to next model...`);
        modelAttempt++;
        // If we've tried all models in the rotation, then we increment the global attempt counter
        if (modelAttempt % modelRotation.length === currentModelIndex) {
          attempt++;
        }
        continue; // Try again with the new model
      }

      attempt++;
      
      // Don't retry on auth/permission errors
      if (lowerMsg.includes("api_key_invalid") || lowerMsg.includes("invalid api key") || status === 401) {
        throw new Error("API_KEY_ERROR: مفتاح API الذي تستخدمه غير صحيح أو تم إيقافه.");
      }
      if (lowerMsg.includes("blocked") || lowerMsg.includes("permission") || status === 403) {
        throw new Error("PERMISSION_ERROR: هذا المفتاح محظور من الوصول للموديل.");
      }
      if (lowerMsg.includes("not found") || status === 404) {
        // If model not found, try rotating
        modelAttempt++;
        continue;
      }
      
      // If it's the last attempt, throw the error
      if (attempt >= maxRetries) {
        if (msg === 'NETWORK_TIMEOUT' || lowerMsg.includes('fetch') || lowerMsg.includes('network')) {
          throw new Error("يبدو أن اتصال الإنترنت لديك ضعيف أو غير مستقر. يرجى المحاولة مرة أخرى.");
        }
        if (lowerMsg.includes('500') || status === 500 || lowerMsg.includes('internal')) {
          throw new Error("حدث خطأ داخلي في خوادم الذكاء الاصطناعي. يرجى المحاولة مرة أخرى بعد قليل.");
        }
        if (lowerMsg.includes('503') || status === 503 || lowerMsg.includes('overloaded')) {
          throw new Error("خوادم الذكاء الاصطناعي تواجه ضغطاً عالياً حالياً. يرجى المحاولة مرة أخرى.");
        }
        throw new Error(typeof msg === 'string' && msg.includes('{') ? "حدث خطأ في معالجة الطلب. يرجى المحاولة مرة أخرى." : (msg || "حدث خطأ غير متوقع."));
      }
      
      console.warn(`Gemini API retry ${attempt}/${maxRetries} for ${activeModel} due to:`, msg || status);
      
      // Exponential backoff with random jitter: wait (2^attempt * 1000) + random(0-1000)ms
      // This prevents "thundering herd" effect when many users retry at the exact same time
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 1000; 
      const delay = baseDelay + jitter;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
}
