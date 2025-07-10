import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/useUserData";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import { parseVehicleInfo, estimateVehicleValue } from "@/utils/vehiclePricing";
import { matchBorrowerToLenders } from "@/utils/lenderMatching";

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
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lenderMatches, setLenderMatches] = useState<any>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDataComplete, setIsDataComplete] = useState(false);
  const [conversationMode, setConversationMode] = useState<'onboarding' | 'free-chat' | 'complete'>('onboarding');
  const { userData, updateUserData } = useUserData();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Check if all required data is collected
  const checkIfDataComplete = () => {
    const required = [
      'plaidConnected',
      'dateOfBirth',
      'employmentType',
      'vehicleType',
      'vinOrModel',
      'downPayment',
      'tradeInValue'
    ];
    
    const hasAllRequired = required.every(field => {
      const value = userData[field as keyof typeof userData];
      return value !== undefined && value !== null && value !== '';
    });

    // Auto-set purchase price if we have vehicle info but no price
    if (hasAllRequired && !userData.purchasePrice && userData.vinOrModel) {
      const vehicleInfo = parseVehicleInfo(userData.vinOrModel);
      const valueEstimate = estimateVehicleValue(vehicleInfo);
      
      if (valueEstimate && valueEstimate.confidence !== 'low') {
        updateUserData({ purchasePrice: `$${valueEstimate.finalEstimate.toLocaleString()}` });
      }
    }

    return hasAllRequired;
  };

  // Smart conversation flow - only ask for missing information
  const getNextQuestion = () => {
    console.log('Current userData:', userData);
    console.log('Current question ID:', currentQuestionId);
    
    // After Plaid connection, check what we still need
    if (!userData.plaidConnected) {
      return {
        id: 'welcome',
        message: "Hi! I'm your AI auto loan assistant. I'll help you get pre-approved for the best auto loan rates in just a few minutes. First, let's securely connect your bank account to auto-fill your application.",
        component: 'plaid-link' as const
      };
    }

    // Essential missing information (not available from Plaid)
    if (!userData.dateOfBirth) {
      return {
        id: 'dateOfBirth',
        message: "Great! I have your financial information from your bank. I just need a few more details. What's your date of birth? (MM/DD/YYYY)",
        component: 'input' as const,
        fieldName: 'dateOfBirth'
      };
    }

    if (!userData.employmentType) {
      return {
        id: 'employmentType',
        message: "What's your employment type? (You can say 'full time', 'part time', 'self employed', etc.)",
        component: 'input' as const,
        fieldName: 'employmentType'
      };
    }

    if (!userData.vehicleType) {
      return {
        id: 'vehicleType',
        message: "Are you looking for a new or used vehicle?",
        component: 'input' as const,
        fieldName: 'vehicleType'
      };
    }

    if (!userData.vinOrModel) {
      return {
        id: 'vinOrModel',
        message: "What vehicle are you interested in? Please provide the VIN, or tell me the make/model/year (e.g., '2024 Toyota Camry'):",
        component: 'input' as const,
        fieldName: 'vinOrModel'
      };
    }

    // Auto-determine purchase price from vehicle info, only ask if we can't figure it out
    if (!userData.purchasePrice && userData.vinOrModel) {
      const vehicleInfo = parseVehicleInfo(userData.vinOrModel);
      const valueEstimate = estimateVehicleValue(vehicleInfo);
      
      if (valueEstimate && valueEstimate.confidence !== 'low') {
        // Auto-set the price and continue
        updateUserData({ purchasePrice: `$${valueEstimate.finalEstimate.toLocaleString()}` });
        
        return {
          id: 'downPayment',
          message: `Perfect! I found that vehicle. Based on current market data, a ${vehicleInfo?.year} ${vehicleInfo?.make} ${vehicleInfo?.model} is estimated at around $${valueEstimate.finalEstimate.toLocaleString()}. How much are you planning to put down as a down payment?`,
          component: 'input' as const,
          fieldName: 'downPayment'
        };
      } else {
        return {
          id: 'purchasePrice',
          message: "I couldn't find reliable pricing data for that specific vehicle. What's the expected purchase price?",
          component: 'input' as const,
          fieldName: 'purchasePrice'
        };
      }
    }

    if (!userData.downPayment) {
      return {
        id: 'downPayment',
        message: "How much are you planning to put down as a down payment?",
        component: 'input' as const,
        fieldName: 'downPayment'
      };
    }

    if (!userData.tradeInValue) {
      return {
        id: 'tradeInValue',
        message: "Do you have a trade-in vehicle? If so, what's its estimated value? (You can say 'no', 'none', or '$0' if no trade-in)",
        component: 'input' as const,
        fieldName: 'tradeInValue'
      };
    }

    // All required data collected - move to free chat mode
    return {
      id: 'data-complete',
      message: "Perfect! I have all the basic information I need. You can now ask me any additional questions about your auto loan, like 'Can I afford this car?' or 'What's my debt-to-income ratio?', or click below to see your lender matches.",
      component: 'free-chat' as const
    };
  };

  const handleFreeChatQuestion = async (question: string) => {
    const lowerQ = question.toLowerCase();
    
    // Parse user financial data for context
    const monthlyIncome = parseMoneyString(userData.monthlyIncome);
    const vehiclePrice = parseMoneyString(userData.purchasePrice);
    const downPayment = parseMoneyString(userData.downPayment);
    const tradeInValue = parseMoneyString(userData.tradeInValue);
    const accountBalance = parseMoneyString(userData.accountBalance);
    const loanAmount = vehiclePrice - downPayment - tradeInValue;
    
    // Estimate monthly payment (assuming 6% APR, 60 months)
    const estimatedPayment = calculateMonthlyPayment(loanAmount, 6, 60);
    const debtToIncomeRatio = ((estimatedPayment / monthlyIncome) * 100).toFixed(1);
    
    let response = "";
    
    if (lowerQ.includes('afford') || lowerQ.includes('budget')) {
      response = `Based on your profile:\n\n• Monthly Income: $${monthlyIncome.toLocaleString()}\n• Estimated Car Payment: $${estimatedPayment.toLocaleString()}\n• Debt-to-Income Ratio: ${debtToIncomeRatio}%\n\nGenerally, your car payment should be no more than 10-15% of your gross monthly income. Your estimated ratio of ${debtToIncomeRatio}% ${parseFloat(debtToIncomeRatio) <= 15 ? 'looks great!' : 'might be on the higher side - consider a lower-priced vehicle or larger down payment.'}`;
    } else if (lowerQ.includes('debt') && lowerQ.includes('income')) {
      response = `Your estimated debt-to-income ratio for this car loan would be ${debtToIncomeRatio}%. This is ${parseFloat(debtToIncomeRatio) <= 15 ? 'excellent' : parseFloat(debtToIncomeRatio) <= 20 ? 'good' : 'high'} for an auto loan. Lenders typically prefer to see auto loan DTI below 20%.`;
    } else if (lowerQ.includes('payment') || lowerQ.includes('monthly')) {
      response = `Based on the ${userData.vinOrModel} at $${vehiclePrice.toLocaleString()} with your $${(downPayment + tradeInValue).toLocaleString()} down payment, your estimated monthly payment would be around $${estimatedPayment.toLocaleString()} (assuming 6% APR over 60 months). This could vary based on the actual APR you qualify for.`;
    } else if (lowerQ.includes('rate') || lowerQ.includes('apr') || lowerQ.includes('interest')) {
      response = `Based on your income of $${monthlyIncome.toLocaleString()}/month and account balance of $${accountBalance.toLocaleString()}, you're likely to qualify for competitive rates. Typical APRs range from 4-8% for well-qualified buyers. Your exact rate will depend on your credit score and the lender's assessment.`;
    } else if (lowerQ.includes('credit') || lowerQ.includes('score')) {
      response = `I don't have access to your actual credit score, but based on your stable income and healthy account balance, you appear to be in good financial standing. Most lenders will pull your credit score during the application process to determine your exact rate.`;
    } else if (lowerQ.includes('down payment') || lowerQ.includes('trade')) {
      const totalDown = downPayment + tradeInValue;
      const downPaymentPercent = ((totalDown / vehiclePrice) * 100).toFixed(1);
      response = `Your total down payment of $${totalDown.toLocaleString()} (including trade-in) represents ${downPaymentPercent}% of the vehicle price. This is ${parseFloat(downPaymentPercent) >= 20 ? 'excellent' : parseFloat(downPaymentPercent) >= 10 ? 'good' : 'minimal'} - a larger down payment typically results in better loan terms.`;
    } else {
      response = `I'd be happy to help with that! Based on your profile, you're looking at a ${userData.vinOrModel} with a loan amount of about $${loanAmount.toLocaleString()}. Is there something specific about your auto loan or finances you'd like me to explain?`;
    }
    
    return response;
  };

  const parseMoneyString = (value?: string): number => {
    if (!value) return 0;
    if (value === '$0') return 0;
    return parseInt(value.replace(/[$,]/g, '')) || 0;
  };

  const calculateMonthlyPayment = (loanAmount: number, apr: number, termMonths: number): number => {
    if (loanAmount <= 0 || apr <= 0) return 0;
    const monthlyRate = apr / 100 / 12;
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                    (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(payment);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if data is complete
    const dataComplete = checkIfDataComplete();
    if (dataComplete && !isDataComplete) {
      setIsDataComplete(true);
      setConversationMode('free-chat');
    }
  }, [userData, isDataComplete]);

  useEffect(() => {
    // Start the conversation only once
    if (messages.length === 0 && !isProcessing) {
      const firstQuestion = getNextQuestion();
      setCurrentQuestionId(firstQuestion.id);
      addBotMessage(firstQuestion.message, firstQuestion.component, firstQuestion.fieldName);
    }
  }, [messages.length, isProcessing]);

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
    if (isProcessing) {
      console.log('Already processing, skipping...');
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      const nextQuestion = getNextQuestion();
      
      console.log('Next question:', nextQuestion.id, 'Current:', currentQuestionId);
      
      // Prevent asking the same question twice
      if (nextQuestion.id === currentQuestionId && nextQuestion.id !== 'data-complete') {
        console.log('Skipping duplicate question:', nextQuestion.id);
        setIsProcessing(false);
        return;
      }
      
      setCurrentQuestionId(nextQuestion.id);
      
      if (nextQuestion.id === 'data-complete') {
        setConversationMode('free-chat');
        addBotMessage(nextQuestion.message, nextQuestion.component);
      } else {
        addBotMessage(nextQuestion.message, nextQuestion.component, nextQuestion.fieldName);
      }
      
      setIsProcessing(false);
    }, 1000);
  };

  const handlePlaidSuccess = (data: any) => {
    console.log('Plaid data received:', data);
    
    // Prevent multiple calls
    if (isProcessing) return;
    
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
      
      // Small delay before continuing
      setTimeout(() => {
        continueConversation();
      }, 500);
    }, 1500);
    
    toast({
      title: "Bank Connected",
      description: "Your bank account has been connected successfully.",
    });
  };

  const handleInputSubmit = async (value: string, fieldName?: string) => {
    if (!value.trim() || isProcessing) return;
    
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
      updateUserData({ [fieldName]: normalizedValue });
      
      setCurrentInput("");
      
      // Small delay before continuing
      setTimeout(() => {
        continueConversation();
      }, 500);
    }
    
    setCurrentInput("");
  };

  const handleConsentChange = (field: string, checked: boolean) => {
    updateUserData({
      [field]: checked
    });
  };

  const handleFindLenders = () => {
    if (isProcessing) return;
    
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
        <div className="mt-4 flex space-x-2">
          <Input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="Type your answer..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleInputSubmit(currentInput, message.fieldName);
              }
            }}
            className="flex-1"
          />
          <Button 
            onClick={() => handleInputSubmit(currentInput, message.fieldName)}
            disabled={!currentInput.trim() || isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (message.component === 'free-chat') {
      return (
        <div className="mt-4 space-y-4">
          <div className="flex space-x-2">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Ask me anything about your auto loan..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleInputSubmit(currentInput);
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={() => handleInputSubmit(currentInput)}
              disabled={!currentInput.trim() || isProcessing}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={handleFindLenders}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            Find My Lender Matches
          </Button>
        </div>
      );
    }
    
    if (message.component === 'checkbox') {
      return (
        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="consentToShare"
              checked={userData.consentToShare || false}
              onCheckedChange={(checked) => handleConsentChange('consentToShare', checked as boolean)}
            />
            <label htmlFor="consentToShare" className="text-sm">
              I consent to share my information with potential lenders
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="consentToCreditCheck"
              checked={userData.consentToCreditCheck || false}
              onCheckedChange={(checked) => handleConsentChange('consentToCreditCheck', checked as boolean)}
            />
            <label htmlFor="consentToCreditCheck" className="text-sm">
              I authorize a credit check to get accurate rates
            </label>
          </div>
          <Button 
            onClick={handleFindLenders}
            disabled={!userData.consentToShare || !userData.consentToCreditCheck || isProcessing}
            className="mt-4"
          >
            Find My Lenders
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
          {/* Messages */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`p-4 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {renderMessageComponent(message)}
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
