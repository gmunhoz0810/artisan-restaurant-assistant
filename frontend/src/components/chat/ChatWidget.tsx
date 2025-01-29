import { useState } from 'react';
import Header from './Header';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

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

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
      isEdited: false
    };
    setMessages([...messages, newMessage]);
    // TODO: Send to backend
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg w-16 h-16 flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
           onClick={() => setIsMinimized(false)}>
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
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            Ask me anything or pick a place to start
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            {...message}
            onEdit={() => {/* TODO */}}
            onDelete={() => {/* TODO */}}
          />
        ))}
      </div>

      <ChatInput onSend={handleSendMessage} />
    </div>
  );
};

export default ChatWidget;