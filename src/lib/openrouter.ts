export const OPENROUTER_API_KEY = "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";

export async function generateOpenRouterResponse(
  systemInstruction: string,
  prompt: string,
  imageData?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const model = "qwen/qwen-2-vl-72b-instruct:free"; // Free vision model on OpenRouter

  const messages: any[] = [];
  
  if (systemInstruction) {
    messages.push({
      role: "system",
      content: systemInstruction
    });
  }

  const userContent: any[] = [];
  
  if (prompt) {
    userContent.push({
      type: "text",
      text: prompt
    });
  }

  if (imageData) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: imageData
      }
    });
  }

  messages.push({
    role: "user",
    content: userContent
  });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Pharma World AI"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.1,
        stream: !!onChunk
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API Error: ${response.status}`);
    }

    if (onChunk) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                if (content) {
                  fullText += content;
                  onChunk(content);
                }
              } catch (e) {
                console.error("Error parsing stream chunk", e);
              }
            }
          }
        }
      }
      return fullText;
    } else {
      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    }
  } catch (error) {
    console.error("OpenRouter Fallback Error:", error);
    throw error;
  }
}
