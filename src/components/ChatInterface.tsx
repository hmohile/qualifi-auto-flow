import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/useUserData";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import { parseVehicleInfo, estimateVehicleValue } from "@/utils/vehiclePricing";
import { matchBorrowerToLenders } from "@/utils/lenderMatching";
import MessageList from "./chat/MessageList";
import UserInput from "./chat/UserInput";
import { useConversationManager } from "./chat/ConversationManager";
import { useFreeChatHandler } from "./chat/FreeChatHandler";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  component?: 'plaid-link' | 'input' | 'checkbox' | 'lender-results' | 'free-chat';
  fieldName?: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lenderMatches, setLenderMatches] = useState<any>(null);
  const [conversationMode, setConversationMode] = useState<'onboarding' | 'free-chat' | 'complete'>('onboarding');
  const { userData, updateUserData } = useUserData();
  const { getNextStep, isComplete } = useConversationManager();
  const { handleFreeChatQuestion } = useFreeChatHandler();

  // Normalize user input for better matching
  const normalizeInput = (input: string): string => {
    const normalized = input.toLowerCase().trim();
    
    // Employment type normalization
    if (normalized.includes('full time') || normalized === 'fulltime') {
      return 'Full-time';
    }
    if (normalized.includes('part time') || normalized === 'parttime') {
      return 'Part-time';
    }
    if (normalized.includes('self employ') || normalized.includes('freelance') || normalized.includes('contractor')) {
      return 'Self-employed';
    }
    if (normalized.includes('retire')) {
      return 'Retired';
    }
    
    // Vehicle type normalization
    if (normalized.includes('new')) {
      return 'New';
    }
    if (normalized.includes('used') || normalized.includes('pre-owned') || normalized.includes('second hand')) {
      return 'Used';
    }
    
    // None/zero normalization
    if (normalized === 'no' || normalized === 'none' || normalized === 'nothing' || normalized === '0' || normalized === '$0') {
      return '$0';
    }
    
    return input.trim();
  };

  const addBotMessage = (content: string, component?: 'plaid-link' | 'input' | 'checkbox' | 'lender-results' | 'free-chat', fieldName?: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content,
        timestamp: new Date(),
        component,
        fieldName
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const continueConversation = () => {
    console.log('Continuing conversation...');
    const nextStep = getNextStep();
    
    if (!nextStep) {
      console.log('No next step found');
      return;
    }

    console.log('Next step:', nextStep);

    if (nextStep.id === 'complete') {
      setConversationMode('free-chat');
      addBotMessage(nextStep.message, 'free-chat');
    } else if (nextStep.id === 'auto-price-set') {
      // Handle auto price setting
      if (userData.vinOrModel) {
        const vehicleInfo = parseVehicleInfo(userData.vinOrModel);
        const valueEstimate = estimateVehicleValue(vehicleInfo);
        if (valueEstimate && valueEstimate.confidence !== 'low') {
          updateUserData({ purchasePrice: `$${valueEstimate.finalEstimate.toLocaleString()}` });
        }
      }
      addBotMessage(nextStep.message);
      // Continue to next question after setting price
      setTimeout(() => continueConversation(), 1500);
    } else {
      addBotMessage(nextStep.message, nextStep.component, nextStep.fieldName);
    }
  };

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      console.log('Initializing conversation');
      continueConversation();
    }
  }, []);

  // Check if data is complete and switch modes
  useEffect(() => {
    if (isComplete && conversationMode === 'onboarding') {
      console.log('Data collection complete, switching to free chat');
      setConversationMode('free-chat');
    }
  }, [isComplete, conversationMode]);

  const handlePlaidSuccess = (data: any) => {
    console.log('Plaid data received:', data);
    
    updateUserData({
      plaidConnected: true,
      fullName: data.fullName,
      email: data.email,
      monthlyIncome: data.monthlyIncome,
      accountBalance: data.accountBalance,
      employerName: data.employerName
    });
    
    addUserMessage("✅ Bank account connected successfully!");
    
    setTimeout(() => {
      addBotMessage(`Excellent! I can see your income is ${data.monthlyIncome} per month and you have ${data.accountBalance} in your account. This puts you in a strong position for a great rate!`);
      
      setTimeout(() => {
        continueConversation();
      }, 1500);
    }, 1000);
    
    toast({
      title: "Bank Connected",
      description: "Your bank account has been connected successfully.",
    });
  };

  const handleInputSubmit = async (value: string, fieldName?: string) => {
    if (!value.trim()) return;
    
    addUserMessage(value);
    
    if (conversationMode === 'free-chat' && !fieldName) {
      // Handle free-form questions
      setIsTyping(true);
      try {
        const response = await handleFreeChatQuestion(value);
        setTimeout(() => {
          addBotMessage(response, 'free-chat');
        }, 1000);
      } catch (error) {
        setTimeout(() => {
          addBotMessage("I'm sorry, I had trouble processing that question. Could you try rephrasing it?", 'free-chat');
        }, 1000);
      }
    } else if (fieldName) {
      // Handle structured data collection
      const normalizedValue = normalizeInput(value);
      console.log(`Updating ${fieldName} with:`, normalizedValue);
      updateUserData({ [fieldName]: normalizedValue });
      
      // Continue conversation after a brief delay
      setTimeout(() => {
        continueConversation();
      }, 1000);
    }
  };

  const handleFindLenders = () => {
    console.log('Finding lenders for user data:', userData);
    setConversationMode('complete');
    
    const matches = matchBorrowerToLenders(userData);
    setLenderMatches(matches);
    
    addBotMessage("Perfect! Let me find the best lenders for your situation...", 'lender-results');
    
    toast({
      title: "Finding Your Matches",
      description: "We're analyzing your profile against our lender network...",
    });
  };

  const renderLenderResults = () => {
    if (!lenderMatches) return null;

    return (
      <div className="mt-4 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Your Loan Profile Summary</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Monthly Income: ${lenderMatches.borrowerSummary.monthlyIncome.toLocaleString()}</p>
            <p>• Vehicle Value: ${lenderMatches.borrowerSummary.vehicleValue.toLocaleString()}</p>
            <p>• Down Payment: ${lenderMatches.borrowerSummary.downPayment.toLocaleString()}</p>
            <p>• Loan Amount: ${lenderMatches.borrowerSummary.loanAmount.toLocaleString()}</p>
            <p>• Estimated Credit Score: {lenderMatches.borrowerSummary.estimatedCreditScore}</p>
          </div>
        </div>

        {lenderMatches.matches.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-green-800">🎉 Great news! You qualify for {lenderMatches.matches.length} lenders:</h3>
            {lenderMatches.matches.map((match: any, index: number) => (
              <div key={match.lender.id} className={`border rounded-lg p-4 ${index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">{match.lender.name}</h4>
                    {index === 0 && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">BEST RATE</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{match.estimatedAPR.toFixed(2)}% APR</div>
                    <div className="text-sm text-gray-600">{match.confidence} confidence</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Monthly Payment:</span>
                    <div className="font-semibold">${match.monthlyPayment.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Loan Term:</span>
                    <div className="font-semibold">{match.loanTerm} months</div>
                  </div>
                </div>
                <Button className="w-full mt-3" variant={index === 0 ? "default" : "outline"}>
                  View Details & Apply
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">No Direct Matches Found</h3>
            <p className="text-yellow-700 text-sm mb-3">
              Based on your current profile, you don't qualify for our standard lenders. Here are some common reasons:
            </p>
            <ul className="text-sm text-yellow-700 space-y-1">
              {lenderMatches.noMatchReasons.slice(0, 3).map((reason: string, index: number) => (
                <li key={index}>• {reason}</li>
              ))}
            </ul>
            <Button className="w-full mt-3" variant="outline">
              Explore Alternative Options
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderMessageComponent = (message: Message) => {
    if (message.component === 'plaid-link') {
      return (
        <div className="mt-4">
          <PlaidLinkButton onSuccess={handlePlaidSuccess} />
        </div>
      );
    }
    
    if (message.component === 'input') {
      return (
        <div className="mt-4">
          <UserInput
            onSubmit={handleInputSubmit}
            fieldName={message.fieldName}
            placeholder="Type your answer..."
            disabled={isTyping}
          />
        </div>
      );
    }

    if (message.component === 'free-chat') {
      return (
        <div className="mt-4 space-y-4">
          <UserInput
            onSubmit={handleInputSubmit}
            placeholder="Ask me anything about your auto loan..."
            disabled={isTyping}
          />
          <Button 
            onClick={handleFindLenders}
            disabled={isTyping}
            className="w-full"
            size="lg"
          >
            Find My Lender Matches
          </Button>
        </div>
      );
    }

    if (message.component === 'lender-results') {
      return renderLenderResults();
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="text-2xl font-bold text-primary">Qualifi Auto</div>
          <div className="ml-auto text-sm text-muted-foreground">
            AI Auto Loan Assistant
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="container mx-auto max-w-4xl p-4">
        <div className="bg-card rounded-lg border shadow-sm min-h-[600px] flex flex-col">
          <MessageList 
            messages={messages} 
            isTyping={isTyping}
          >
            {renderMessageComponent}
          </MessageList>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
