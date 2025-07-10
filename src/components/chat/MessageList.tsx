
import { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ChatMessage, { Message } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  children?: (message: Message) => React.ReactNode;
}

const MessageList = ({ messages, isTyping, children }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message}>
          {children?.(message)}
        </ChatMessage>
      ))}
      
      {isTyping && (
        <ChatMessage 
          message={{
            id: 'typing',
            type: 'bot',
            content: '',
            timestamp: new Date()
          }}
        >
          <div className="flex items-center space-x-2 mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Typing...</span>
          </div>
        </ChatMessage>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
