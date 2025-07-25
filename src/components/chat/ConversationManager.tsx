

import { useState, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';

export interface ConversationStep {
  id: string;
  message: string;
  component: 'input' | 'free-chat' | 'lender-results';
  fieldName?: string;
  isRequired?: boolean;
}

export const useConversationManager = () => {
  const { userData } = useUserData();
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [isComplete, setIsComplete] = useState(false);
  const [shouldShowLenderMatching, setShouldShowLenderMatching] = useState(false);
  const [completionMessageShown, setCompletionMessageShown] = useState(false);

  // Define conversation steps in order
  const conversationSteps: ConversationStep[] = [
    {
      id: 'welcome',
      message: "Hi! I'm your AI auto loan assistant. I'll help you find the best auto loan options based on a few simple questions. Let's start!\n\nWhich car do you want to buy? Please provide the make and model (e.g., Toyota Camry, Ford F-150):",
      component: 'input',
      fieldName: 'carMakeModel',
      isRequired: true
    },
    {
      id: 'totalBudget',
      message: "What is your total budget or car price? (e.g., $25,000)",
      component: 'input',
      fieldName: 'totalBudget',
      isRequired: true
    },
    {
      id: 'downPayment',
      message: "How much down payment are you planning to make? (e.g., $3,000)",
      component: 'input',
      fieldName: 'downPayment',
      isRequired: true
    },
    {
      id: 'employmentStatus',
      message: "Are you currently employed? If yes, what is your monthly or annual income? (e.g., '$5,000/month' or '$60,000/year')",
      component: 'input',
      fieldName: 'annualIncome',
      isRequired: true
    },
    {
      id: 'creditScore',
      message: "What is your credit score? If you don't know the exact number, please estimate: Excellent (750+) / Good (700-749) / Fair (640-699) / Poor (below 640)",
      component: 'input',
      fieldName: 'creditScore',
      isRequired: true
    },
    {
      id: 'completion',
      message: "Hey there 👋 You're almost set to hit the road!\n\nBased on everything you've shared – the car you're eyeing, your downpayment preferences, and your budget – we've already done the heavy lifting to find the best financing options for you.\n\nNow, if you have any questions – whether it's about EMIs, eligibility, delivery timelines, documents needed, or even how this car compares to another one you love – I'm right here to help, 24x7!\n\nJust type your question below. Let's make your car buying journey smooth, easy, and exciting 🚗💨\n\nP.S. You're closer to owning your dream car than you think! 💙",
      component: 'free-chat'
    }
  ];

  // Check if all required data is collected
  const checkDataComplete = () => {
    const requiredFields = ['carMakeModel', 'totalBudget', 'downPayment', 'annualIncome', 'creditScore'];
    const complete = requiredFields.every(field => {
      const value = userData[field as keyof typeof userData];
      return value !== undefined && value !== null && value !== '';
    });
    console.log('Data completeness check:', { requiredFields, userData, complete });
    return complete;
  };

  // Get the next step in the conversation
  const getNextStep = (): ConversationStep | null => {
    console.log('Getting next step, current userData:', userData);
    
    // Check each step in order to find the first missing field
    for (let i = 0; i < conversationSteps.length - 1; i++) {
      const step = conversationSteps[i];
      if (step.fieldName) {
        const fieldValue = userData[step.fieldName as keyof typeof userData];
        if (!fieldValue || fieldValue === '') {
          console.log(`Missing field: ${step.fieldName}, returning step:`, step.id);
          return step;
        }
      }
    }

    // All required data collected - show completion message
    if (checkDataComplete()) {
      return conversationSteps[conversationSteps.length - 1]; // completion step
    }

    return null;
  };

  // Get missing fields for user feedback
  const getMissingFields = (): string[] => {
    const requiredFields = [
      { key: 'carMakeModel', label: 'Car make and model' },
      { key: 'totalBudget', label: 'Total budget' },
      { key: 'downPayment', label: 'Down payment amount' },
      { key: 'annualIncome', label: 'Annual income' },
      { key: 'creditScore', label: 'Credit score' }
    ];

    return requiredFields
      .filter(field => {
        const value = userData[field.key as keyof typeof userData];
        return !value || value === '';
      })
      .map(field => field.label);
  };

  // Update completion status whenever userData changes
  useEffect(() => {
    const complete = checkDataComplete();
    setIsComplete(complete);
    
    if (complete && !shouldShowLenderMatching) {
      setShouldShowLenderMatching(true);
    }
    
    console.log('Data complete status updated:', complete);
  }, [userData]);

  // Update current step when userData changes
  useEffect(() => {
    const nextStep = getNextStep();
    if (nextStep && nextStep.id !== currentStep) {
      setCurrentStep(nextStep.id);
      console.log('Current step updated to:', nextStep.id);
    }
  }, [userData, isComplete]);

  return {
    currentStep,
    setCurrentStep,
    isComplete,
    shouldShowLenderMatching,
    setShouldShowLenderMatching,
    getNextStep,
    getMissingFields,
    conversationSteps,
    completionMessageShown,
    setCompletionMessageShown
  };
};

