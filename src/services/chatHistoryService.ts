
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  message_type: 'user' | 'bot';
  content: string;
  user_input?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_data: any;
  created_at: string;
  updated_at: string;
}

export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    return [];
  }
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat sessions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getChatSessions:', error);
    return [];
  }
};
