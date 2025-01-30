import { useState, KeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled = false }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4 flex items-center gap-3">
      {/* User profile picture */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-purple-100 flex items-center justify-center">
            <span className="text-sm font-medium text-purple-600">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
        )}
      </div>

      {/* Message input */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        className={`flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-purple-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
        aria-label="Message input"
        disabled={disabled}
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className={`text-purple-600 hover:text-purple-700 disabled:text-gray-400 w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 transition-colors ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
        aria-label="Send message"
        data-testid="send-button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;