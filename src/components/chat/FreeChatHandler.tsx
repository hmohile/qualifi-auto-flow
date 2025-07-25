
import { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { chatWithOpenAI } from '@/services/openaiChatService';

export const useFreeChatHandler = () => {
  const { userData } = useUserData();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleFreeChatQuestion = async (question: string): Promise<string> => {
    try {
      console.log('Handling free chat question:', question);
      
      const response = await chatWithOpenAI({
        userInput: question,
        userData: {
          carMakeModel: userData.carMakeModel,
          totalBudget: userData.totalBudget,
          downPayment: userData.downPayment,
          annualIncome: userData.annualIncome,
          creditScore: userData.creditScore
        },
        sessionId: currentSessionId || undefined
      });
      
      // Store the session ID for future requests
      if (!currentSessionId) {
        setCurrentSessionId(response.sessionId);
      }
      
      return response.response;
    } catch (error) {
      console.error('Error in free chat:', error);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('quota')) {
        return "I'm currently experiencing issues with my AI service due to usage limits. Please try again later or contact support if the issue persists.";
      }
      
      return "I apologize, but I'm having trouble processing your question right now. This might be due to a temporary service issue. Could you please try again in a moment?";
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
  };

  return { 
    handleFreeChatQuestion,
    startNewSession,
    currentSessionId 
  };
};
