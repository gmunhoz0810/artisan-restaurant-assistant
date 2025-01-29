import { useState, useEffect } from 'react';
import Header from './Header';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { messageApi } from '../../services/api';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isEdited: boolean;
}

const ChatWidget = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const fetchedMessages = await messageApi.getMessages();
      setMessages(fetchedMessages);
      setError(null);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const newMessage = await messageApi.sendMessage(content);
      setMessages(prevMessages => [...prevMessages, newMessage]);
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  const handleEditMessage = async (id: number, content: string) => {
    try {
      const updatedMessage = await messageApi.updateMessage(id, content);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === id ? updatedMessage : msg
        )
      );
    } catch (err) {
      setError('Failed to edit message');
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      await messageApi.deleteMessage(id);
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.id !== id)
      );
    } catch (err) {
      setError('Failed to delete message');
      console.error(err);
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg w-16 h-16 flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setIsMinimized(false)}
      >
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
          A
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl flex flex-col w-[380px] h-[600px] overflow-hidden">
      <Header 
        onMinimize={() => setIsMinimized(true)}
        onClose={() => setIsMinimized(true)}
      />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center text-gray-500 mt-4">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">
            Ask me anything about restaurants
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              {...message}
              onEdit={(content) => handleEditMessage(message.id, content)}
              onDelete={() => handleDeleteMessage(message.id)}
            />
          ))
        )}
      </div>

      <ChatInput onSend={handleSendMessage} />
    </div>
  );
};

export default ChatWidget;