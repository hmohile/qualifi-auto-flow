
import { supabase } from '@/integrations/supabase/client';

interface ChatRequest {
  userInput: string;
  userData: {
    carMakeModel?: string;
    totalBudget?: string;
    downPayment?: string;
    annualIncome?: string;
    creditScore?: string;
  };
  sessionId?: string;
}

interface ChatResponse {
  response: string;
  sessionId: string;
}

export const chatWithOpenAI = async ({ userInput, userData, sessionId }: ChatRequest): Promise<ChatResponse> => {
  try {
    console.log('Calling OpenAI Edge Function with:', { userInput, userData, sessionId });
    
    const { data, error } = await supabase.functions.invoke('openai-chat', {
      body: { userInput, userData, sessionId }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    console.log('OpenAI Edge Function response:', data);
    
    return {
      response: data.response,
      sessionId: data.sessionId
    };
    
  } catch (error) {
    console.error('Error calling OpenAI service:', error);
    throw new Error('Failed to get response from AI assistant. Please try again.');
  }
};

// Legacy function for backward compatibility - now also uses OpenAI
export const chatWithOpenAILegacy = async ({ userInput, userData }: Omit<ChatRequest, 'sessionId'>): Promise<string> => {
  try {
    const response = await chatWithOpenAI({ userInput, userData });
    return response.response;
  } catch (error) {
    console.error('Error in legacy chat function:', error);
    return "I apologize, but I'm having trouble processing your question right now. Could you please try again or rephrase your question?";
  }
};
