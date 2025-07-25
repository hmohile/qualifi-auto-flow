
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/useUserData";
import OpenAILoanResults from "@/components/OpenAILoanResults";
import { parseVehicleInfo, estimateVehicleValue } from "@/utils/vehiclePricing";
import { matchBorrowerToLenders } from "@/utils/lenderMatching";
import MessageList from "./chat/MessageList";
import UserInput from "./chat/UserInput";
import { useConversationManager } from "./chat/ConversationManager";
import { useFreeChatHandler } from "./chat/FreeChatHandler";
import LenderResults from "./LenderResults";
import QuoteCollection from "./QuoteCollection";
import { LenderQuote } from "@/services/mockLenderAPI";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  component?: 'input' | 'checkbox' | 'lender-results' | 'free-chat';
  fieldName?: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lenderMatches, setLenderMatches] = useState<any>(null);
  const [showLenderResults, setShowLenderResults] = useState(false);
  const [showQuoteCollection, setShowQuoteCollection] = useState(false);
  const [realTimeQuotes, setRealTimeQuotes] = useState<LenderQuote[]>([]);
  const { userData, updateUserData } = useUserData();
  const { 
    getNextStep, 
    isComplete, 
    shouldShowLenderMatching,
    getMissingFields,
    completionMessageShown,
    setCompletionMessageShown
  } = useConversationManager();
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

  const addBotMessage = (content: string, component?: 'input' | 'checkbox' | 'lender-results' | 'free-chat', fieldName?: string) => {
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
    console.log('continueConversation called, isComplete:', isComplete);
    
    const nextStep = getNextStep();
    
    if (!nextStep) {
      console.log('No next step found');
      return;
    }

    console.log('Next step:', nextStep);

    if (nextStep.id === 'completion') {
      addBotMessage(nextStep.message, 'free-chat');
      setCompletionMessageShown(true);
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

  // Continue conversation when userData changes
  useEffect(() => {
    if (messages.length > 0 && !isComplete) {
      console.log('UserData changed, checking if we should continue conversation');
      const timer = setTimeout(() => {
        continueConversation();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [userData]);

  const handleInputSubmit = async (value: string, fieldName?: string) => {
    if (!value.trim()) return;
    
    addUserMessage(value);
    
    if (isComplete && !fieldName) {
      // Handle free-form questions when data is complete
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
    }
  };

  const handleFindLenders = () => {
    if (!isComplete) {
      const missingFields = getMissingFields();
      toast({
        title: "Missing Information",
        description: `Please provide: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      
      addBotMessage(`I still need some information from you: ${missingFields.join(', ')}. Let me ask you about these details.`);
      continueConversation();
      return;
    }
    
    console.log('Finding lenders for user data:', userData);
    setShowLenderResults(true);
    
    const matches = matchBorrowerToLenders(userData);
    setLenderMatches(matches);
    
    toast({
      title: "Finding Your Matches",
      description: "We're analyzing your profile against our lender network...",
    });
  };

  const handleStartQuoteCollection = () => {
    if (!isComplete) {
      const missingFields = getMissingFields();
      toast({
        title: "Missing Information",
        description: `Please provide: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    setShowQuoteCollection(true);
    
    toast({
      title: "Starting AI Quote Collection",
      description: "Our AI agent will contact lenders and negotiate on your behalf...",
    });
  };

  const handleQuotesReady = (quotes: LenderQuote[]) => {
    setRealTimeQuotes(quotes);
    setShowQuoteCollection(false);
    setShowLenderResults(true);
    
    // Update lender matches with real quotes
    if (lenderMatches) {
      const updatedMatches = {
        ...lenderMatches,
        realTimeQuotes: quotes
      };
      setLenderMatches(updatedMatches);
    }
    
    toast({
      title: "Quotes Ready!",
      description: `Received ${quotes.length} live quotes from lenders.`,
    });
  };

  const renderMessageComponent = (message: Message) => {
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

    if (message.component === 'lender-results') {
      return (
        <div className="mt-4">
          <OpenAILoanResults />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              onClick={handleStartQuoteCollection}
              disabled={isTyping}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              🤖 AI Quote Collection
            </Button>
            <Button 
              onClick={handleFindLenders}
              disabled={isTyping}
              variant="outline"
              size="lg"
            >
              📊 View Loan Options
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Ask me about EMIs, eligibility, documents, delivery timelines, or comparisons!
          </p>
        </div>
      );
    }

    return null;
  };

  // Handle Quote Collection View
  if (showQuoteCollection) {
    return (
      <QuoteCollection
        borrowerProfile={userData}
        onQuotesReady={handleQuotesReady}
        onBack={() => setShowQuoteCollection(false)}
      />
    );
  }

  if (showLenderResults) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">
            <div className="text-2xl font-bold text-primary">Qualifi Auto</div>
            <div className="ml-auto flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setShowLenderResults(false)}
              >
                Back to Chat
              </Button>
              {isComplete && (
                <Button 
                  onClick={handleStartQuoteCollection}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  🤖 Get Live Quotes
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                {realTimeQuotes.length > 0 ? 'Live Quotes' : 'Loan Options'}
              </div>
            </div>
          </div>
        </header>

        {/* Loan Results */}
        <div className="container mx-auto max-w-6xl p-4">
          <OpenAILoanResults />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="text-2xl font-bold text-primary">Qualifi Auto</div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>AI Auto Loan Assistant</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connected to OpenAI"></div>
            </div>
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
