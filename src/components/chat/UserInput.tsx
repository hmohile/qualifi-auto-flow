
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface UserInputProps {
  onSubmit: (value: string, fieldName?: string) => void;
  fieldName?: string;
  placeholder?: string;
  disabled?: boolean;
}

const UserInput = ({ onSubmit, fieldName, placeholder = "Type your answer...", disabled = false }: UserInputProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSubmit(input.trim(), fieldName);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex space-x-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        onKeyPress={handleKeyPress}
        className="flex-1"
        disabled={disabled}
      />
      <Button 
        onClick={handleSubmit}
        disabled={!input.trim() || disabled}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default UserInput;
