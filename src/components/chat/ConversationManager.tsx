import { useState, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { parseVehicleInfo, estimateVehicleValue } from '@/utils/vehiclePricing';

export interface ConversationStep {
  id: string;
  message: string;
  component: 'plaid-link' | 'input' | 'free-chat' | 'lender-results';
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
      message: "Hi! I'm your AI auto loan assistant. I'll help you get pre-approved for the best auto loan rates in just a few minutes. First, let's securely connect your bank account to auto-fill your application.",
      component: 'plaid-link',
      isRequired: true
    },
    {
      id: 'dateOfBirth',
      message: "Great! I have your financial information from your bank. I just need a few more details. What's your date of birth? (MM/DD/YYYY)",
      component: 'input',
      fieldName: 'dateOfBirth',
      isRequired: true
    },
    {
      id: 'employmentType',
      message: "What's your employment type? (You can say 'full time', 'part time', 'self employed', etc.)",
      component: 'input',
      fieldName: 'employmentType',
      isRequired: true
    },
    {
      id: 'vehicleType',
      message: "Are you looking for a new or used vehicle?",
      component: 'input',
      fieldName: 'vehicleType',
      isRequired: true
    },
    {
      id: 'vinOrModel',
      message: "What vehicle are you interested in? Please provide the VIN, or tell me the make/model/year (e.g., '2024 Toyota Camry'):",
      component: 'input',
      fieldName: 'vinOrModel',
      isRequired: true
    },
    {
      id: 'downPayment',
      message: "How much are you planning to put down as a down payment?",
      component: 'input',
      fieldName: 'downPayment',
      isRequired: true
    },
    {
      id: 'tradeInValue',
      message: "Do you have a trade-in vehicle? If so, what's its estimated value? (You can say 'no', 'none', or '$0' if no trade-in)",
      component: 'input',
      fieldName: 'tradeInValue',
      isRequired: true
    }
  ];

  // Check if all required data is collected
  const checkDataComplete = () => {
    const requiredFields = ['plaidConnected', 'dateOfBirth', 'employmentType', 'vehicleType', 'vinOrModel', 'downPayment', 'tradeInValue'];
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
    
    // If data is complete and completion message already shown, don't return anything
    if (isComplete && completionMessageShown) {
      return null;
    }
    
    // If not connected to Plaid, start with welcome
    if (!userData.plaidConnected) {
      console.log('Plaid not connected, returning welcome step');
      return conversationSteps[0]; // welcome step
    }

    // Check each step in order after Plaid connection
    for (let i = 1; i < conversationSteps.length; i++) {
      const step = conversationSteps[i];
      if (step.fieldName) {
        const fieldValue = userData[step.fieldName as keyof typeof userData];
        if (!fieldValue || fieldValue === '') {
          console.log(`Missing field: ${step.fieldName}, returning step:`, step.id);
          return step;
        }
      }
    }

    // Auto-set purchase price if we have vehicle info but no price
    if (userData.vinOrModel && !userData.purchasePrice) {
      const vehicleInfo = parseVehicleInfo(userData.vinOrModel);
      const valueEstimate = estimateVehicleValue(vehicleInfo);
      
      if (valueEstimate && valueEstimate.confidence !== 'low') {
        console.log('Auto-setting vehicle price');
        return {
          id: 'auto-price-set',
          message: `Perfect! I found that vehicle. Based on current market data, a ${vehicleInfo?.year} ${vehicleInfo?.make} ${vehicleInfo?.model} is estimated at around $${valueEstimate.finalEstimate.toLocaleString()}.`,
          component: 'input'
        };
      }
    }

    // All data collected - show completion message only once
    if (!completionMessageShown) {
      console.log('All data collected, returning completion step');
      return {
        id: 'complete',
        message: "Perfect! I have all the information I need. You can now ask me questions like 'Can I afford this car?' or click the button below to see your personalized lender matches.",
        component: 'free-chat'
      };
    }

    return null;
  };

  // Get missing fields for user feedback
  const getMissingFields = (): string[] => {
    const requiredFields = [
      { key: 'plaidConnected', label: 'Bank account connection' },
      { key: 'dateOfBirth', label: 'Date of birth' },
      { key: 'employmentType', label: 'Employment type' },
      { key: 'vehicleType', label: 'Vehicle type (new/used)' },
      { key: 'vinOrModel', label: 'Vehicle information' },
      { key: 'downPayment', label: 'Down payment amount' },
      { key: 'tradeInValue', label: 'Trade-in value' }
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
    if (!isComplete) {
      const nextStep = getNextStep();
      if (nextStep && nextStep.id !== currentStep) {
        setCurrentStep(nextStep.id);
        console.log('Current step updated to:', nextStep.id);
      }
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
