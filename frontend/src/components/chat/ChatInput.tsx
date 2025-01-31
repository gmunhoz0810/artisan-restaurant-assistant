/**
 * ChatInput.tsx
 * 
 * Message input component with user avatar integration and send functionality.
 * Provides real-time message input with support for multiline text.
 * 
 * Features:
 * - Message sending with Enter key support
 * - Loading state handling during message processing
 * - Google profile picture integration
 * - Fallback avatar with user initials
 * - Disabled state handling during processing
 * - Mobile-responsive design
 */

import { useState, KeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled = false }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [imageError, setImageError] = useState(false);
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
      if (!disabled) {
        handleSend();
      }
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const canSend = message.trim().length > 0 && !disabled;

  const renderUserAvatar = () => {
    if (!user) {
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-sm font-medium text-purple-600">?</span>
        </div>
      );
    }

    if (!user.picture || imageError) {
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-sm font-medium text-purple-600">
            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      );
    }

    return (
      <img
        src={user.picture}
        alt={user.name || 'User avatar'}
        onError={handleImageError}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  };

  return (
    <div className="border-t p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        {renderUserAvatar()}
      </div>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-purple-500"
        aria-label="Message input"
      />

      <button
        onClick={handleSend}
        disabled={!canSend}
        className={`text-purple-600 hover:text-purple-700 disabled:text-gray-400 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            !canSend ? 'cursor-not-allowed opacity-50' : 'hover:bg-purple-50 cursor-pointer'
        }`}             
        aria-label="Send message"
        data-testid="send-button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
            transform="rotate(90 12 12)" 
          />
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;
