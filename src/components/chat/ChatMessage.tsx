
import { Bot, User } from 'lucide-react';

export interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  component?: 'plaid-link' | 'input' | 'checkbox' | 'lender-results' | 'free-chat';
  fieldName?: string;
}

interface ChatMessageProps {
  message: Message;
  children?: React.ReactNode;
}

const ChatMessage = ({ message, children }: ChatMessageProps) => {
  return (
    <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
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
          <p className="text-sm whitespace-pre-line">{message.content}</p>
          {children}
        </div>
      </div>
      {message.type === 'user' && (
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
