
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/useUserData";
import PlaidLinkButton from "@/components/PlaidLinkButton";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  component?: 'plaid-link' | 'input' | 'checkbox';
  fieldName?: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { userData, updateUserData } = useUserData();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationFlow = [
    {
      id: 'welcome',
      message: "Hi! I'm your AI auto loan assistant. I'll help you get pre-approved for the best auto loan rates in just a few minutes. First, let's securely connect your bank account to auto-fill your application.",
      component: 'plaid-link' as const
    },
    {
      id: 'dateOfBirth',
      message: "Great! Now I need a few more details. What's your date of birth? (MM/DD/YYYY)",
      component: 'input' as const,
      fieldName: 'dateOfBirth'
    },
    {
      id: 'employmentType',
      message: "What's your employment type? (Full-time, Part-time, Self-employed, etc.)",
      component: 'input' as const,
      fieldName: 'employmentType'
    },
    {
      id: 'vehicleType',
      message: "Are you looking for a new or used vehicle?",
      component: 'input' as const,
      fieldName: 'vehicleType'
    },
    {
      id: 'vinOrModel',
      message: "Do you have a specific vehicle in mind? Please provide the VIN or Make/Model/Year:",
      component: 'input' as const,
      fieldName: 'vinOrModel'
    },
    {
      id: 'purchasePrice',
      message: "What's the expected purchase price of the vehicle?",
      component: 'input' as const,
      fieldName: 'purchasePrice'
    },
    {
      id: 'downPayment',
      message: "How much are you planning to put down as a down payment?",
      component: 'input' as const,
      fieldName: 'downPayment'
    },
    {
      id: 'tradeInValue',
      message: "Do you have a trade-in vehicle? If so, what's its estimated value? (Optional - enter 'none' if no trade-in)",
      component: 'input' as const,
      fieldName: 'tradeInValue'
    },
    {
      id: 'consent',
      message: "Finally, I need your consent for the next steps:",
      component: 'checkbox' as const
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start the conversation
    addBotMessage(conversationFlow[0].message, conversationFlow[0].component);
  }, []);

  const addBotMessage = (content: string, component?: 'plaid-link' | 'input' | 'checkbox', fieldName?: string) => {
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

  const handlePlaidSuccess = (data: any) => {
    console.log('Plaid data received:', data);
    updateUserData({
      plaidConnected: true,
      fullName: data.fullName || "John Doe",
      email: data.email || "john@example.com",
      monthlyIncome: data.monthlyIncome || "$5,000",
      accountBalance: data.accountBalance || "$15,000",
      employerName: data.employerName || "Tech Corp"
    });
    
    addUserMessage("✅ Bank account connected successfully!");
    
    setTimeout(() => {
      addBotMessage("Perfect! I've automatically filled in your basic information from your bank account. Now let me ask you for a few more details...");
      setTimeout(() => {
        setCurrentStep(1);
        addBotMessage(conversationFlow[1].message, conversationFlow[1].component, conversationFlow[1].fieldName);
      }, 1500);
    }, 1000);
    
    toast({
      title: "Bank Connected",
      description: "Your bank account has been connected successfully.",
    });
  };

  const handleInputSubmit = (value: string, fieldName?: string) => {
    if (!value.trim()) return;
    
    addUserMessage(value);
    
    if (fieldName) {
      updateUserData({
        [fieldName]: value
      });
    }
    
    setCurrentInput("");
    
    // Move to next step
    setTimeout(() => {
      const nextStep = currentStep + 1;
      if (nextStep < conversationFlow.length) {
        setCurrentStep(nextStep);
        addBotMessage(
          conversationFlow[nextStep].message, 
          conversationFlow[nextStep].component,
          conversationFlow[nextStep].fieldName
        );
      } else {
        // End of conversation
        addBotMessage("Thank you! I have all the information I need. Let me process your application and find the best loan options for you.");
        setTimeout(() => {
          handleSubmitApplication();
        }, 2000);
      }
    }, 1000);
  };

  const handleConsentChange = (field: string, checked: boolean) => {
    updateUserData({
      [field]: checked
    });
  };

  const handleSubmitApplication = () => {
    console.log('Final user data:', userData);
    toast({
      title: "Application Submitted",
      description: "We're processing your application and will show you loan options shortly.",
    });
    
    addBotMessage("🎉 Your application has been submitted! We're now matching you with the best lenders. This usually takes 30-60 seconds...");
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
            disabled={!currentInput.trim()}
          >
            <Send className="h-4 w-4" />
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
            onClick={() => handleInputSubmit('Consents provided')}
            disabled={!userData.consentToShare || !userData.consentToCreditCheck}
            className="mt-4"
          >
            Continue
          </Button>
        </div>
      );
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
