export type ToolType = 'prescription' | 'skin' | 'interaction' | 'consultation' | 'lab' | 'drug_id' | 'radiology';

export interface Drug {
  id: string;
  name: string;
}

export interface HistoryItem {
  id: string;
  user_id: string;
  tool_type: ToolType;
  input_text?: string;
  image_url?: string;
  image_path?: string;
  response: string;
  created_at: any;
}

export interface UserConfig {
  apiKey: string;
  model: 'gemini-3-flash-preview';
  incognitoMode?: boolean;
}
