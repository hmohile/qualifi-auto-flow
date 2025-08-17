
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
    console.log('Calling localhost chat server with:', { userInput, userData, sessionId });
    
    // Generate or get user_id - using a simple approach for now
    const userId = sessionId || 'anonymous_user';
    
    const requestBody = {
      user_question: userInput,
      session_id: sessionId,
      user_id: userId
    };

    const response = await fetch('http://localhost:8080/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat server error:', errorText);
      throw new Error(`Chat server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Chat server response:', data);
    
    return {
      response: data.response || data.message || 'No response received',
      sessionId: sessionId || data.session_id || 'new_session'
    };
    
  } catch (error) {
    console.error('Error calling chat server:', error);
    
    // Handle network errors
    if (error.message && error.message.includes('fetch')) {
      throw new Error('Unable to connect to chat server. Please ensure the server is running on http://localhost:8080');
    }
    
    throw new Error('Failed to get response from chat server. Please try again.');
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
