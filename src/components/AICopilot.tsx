
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Sparkles, HelpCircle, DollarSign, TrendingUp } from 'lucide-react';
import { LenderQuote } from '@/services/mockLenderAPI';
import { UserData } from '@/hooks/useUserData';

interface AICopilotProps {
  quotes: LenderQuote[];
  userData: UserData;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AICopilot = ({ quotes, userData }: AICopilotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterPrompts = [
    "Which lender is offering the best deal?",
    "What's the total cost of this loan?",
    "Can I save more with a bigger down payment?",
    "What does APR mean and why does it matter?"
  ];

  useEffect(() => {
    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'ai',
      content: "Hi! I'm your AI loan advisor. I can help you understand your offers, compare terms, and make the best decision for your situation. What would you like to know?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(text, quotes, userData);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (question: string, quotes: LenderQuote[], userData: UserData): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Sort quotes by APR for recommendations
    const sortedQuotes = [...quotes].sort((a, b) => a.offeredAPR - b.offeredAPR);
    const bestQuote = sortedQuotes[0];
    const worstQuote = sortedQuotes[sortedQuotes.length - 1];

    // Best deal question
    if (lowerQuestion.includes('best deal') || lowerQuestion.includes('best offer') || lowerQuestion.includes('recommend')) {
      const savings = (worstQuote.monthlyPayment - bestQuote.monthlyPayment) * bestQuote.termLength;
      return `Based on your ${quotes.length} offers, **${bestQuote.lenderName}** is offering the best deal with ${bestQuote.offeredAPR.toFixed(2)}% APR and $${bestQuote.monthlyPayment}/month. This could save you $${savings.toLocaleString()} compared to the highest rate offer. ${bestQuote.status === 'negotiated' ? 'This rate was negotiated down for you!' : ''}`;
    }

    // Total cost question
    if (lowerQuestion.includes('total cost') || lowerQuestion.includes('how much will') || lowerQuestion.includes('pay in total')) {
      const totalCost = bestQuote.monthlyPayment * bestQuote.termLength;
      const interest = totalCost - bestQuote.maxLoanAmount;
      return `For the best offer from **${bestQuote.lenderName}**, you'll pay:\n\n• **Total amount**: $${totalCost.toLocaleString()}\n• **Principal**: $${bestQuote.maxLoanAmount.toLocaleString()}\n• **Interest**: $${interest.toLocaleString()}\n• **Monthly payment**: $${bestQuote.monthlyPayment}\n\nThis is over ${bestQuote.termLength} months at ${bestQuote.offeredAPR.toFixed(2)}% APR.`;
    }

    // Down payment question
    if (lowerQuestion.includes('down payment') || lowerQuestion.includes('bigger down')) {
      const currentDown = parseInt(userData.downPayment?.replace(/[,$]/g, '') || '0');
      return `Your current down payment is $${currentDown.toLocaleString()}. Increasing it by $5,000-$10,000 could:\n\n• Lower your monthly payment by $80-150\n• Reduce your APR by 0.25-0.5%\n• Save $2,000-4,000 in total interest\n\nWould you like me to show you how different down payment amounts affect your offers?`;
    }

    // APR explanation
    if (lowerQuestion.includes('apr') || lowerQuestion.includes('interest rate') || lowerQuestion.includes('what does')) {
      return `**APR (Annual Percentage Rate)** is the total cost of borrowing money per year, including:\n\n• Base interest rate\n• Processing fees\n• Other loan costs\n\nIt's more accurate than just the interest rate. In your offers, APR ranges from ${bestQuote.offeredAPR.toFixed(2)}% to ${worstQuote.offeredAPR.toFixed(2)}%. Even a 1% difference can save you thousands over the loan term!`;
    }

    // Comparison questions
    if (lowerQuestion.includes('compare') || lowerQuestion.includes('difference between') || lowerQuestion.includes('vs')) {
      const midQuote = sortedQuotes[Math.floor(sortedQuotes.length / 2)];
      return `Here's a quick comparison of your top offers:\n\n**${bestQuote.lenderName}** (Best)\n• APR: ${bestQuote.offeredAPR.toFixed(2)}%\n• Payment: $${bestQuote.monthlyPayment}\n\n**${midQuote.lenderName}** (Middle)\n• APR: ${midQuote.offeredAPR.toFixed(2)}%\n• Payment: $${midQuote.monthlyPayment}\n\nThe difference in monthly payment is $${midQuote.monthlyPayment - bestQuote.monthlyPayment}, which adds up to $${(midQuote.monthlyPayment - bestQuote.monthlyPayment) * bestQuote.termLength} over the loan term.`;
    }

    // Default response
    return `I can help you with questions about:\n\n• Comparing your loan offers\n• Understanding terms like APR, fees, and loan length\n• Calculating total costs and savings\n• Recommending the best option for your situation\n\nYou have ${quotes.length} offers ranging from ${bestQuote.offeredAPR.toFixed(2)}% to ${worstQuote.offeredAPR.toFixed(2)}% APR. What specific aspect would you like to explore?`;
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          AI Loan Advisor
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4">
        {/* Starter Prompts */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Try asking:</p>
            <div className="space-y-2">
              {starterPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full text-left justify-start h-auto p-2 text-xs"
                  onClick={() => handleSendMessage(prompt)}
                >
                  <HelpCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3" />
                    <span className="text-xs font-medium">AI Advisor</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-line">{message.content}</div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-1">
                  <div className="animate-pulse">●</div>
                  <div className="animate-pulse delay-100">●</div>
                  <div className="animate-pulse delay-200">●</div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your loan offers..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isTyping}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AICopilot;
