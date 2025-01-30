import { useState, useEffect, useRef, memo } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load initial messages with cleanup
  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/messages/');
        const data = await response.json();
        if (mounted) {
          setMessages(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading messages:', err);
          setError('Failed to load messages');
          setIsLoading(false);
        }
      }
    };

    fetchMessages();
    return () => {
      mounted = false;
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    try {
      setError(null);
      // Add user message
      const newMessage = {
        id: Date.now(),
        content,
        sender: 'user' as const,
        timestamp: new Date().toISOString(),
        isEdited: false
      };
      setMessages(prev => [...prev, newMessage]);

      // Start streaming response
      const response = await fetch('http://localhost:8000/api/messages/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Create bot message placeholder
      const botMessage = {
        id: Date.now() + 1,
        content: '',
        sender: 'bot' as const,
        timestamp: new Date().toISOString(),
        isEdited: false
      };
      setMessages(prev => [...prev, botMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data === '[DONE]') break;
            
            try {
              const parsedData = JSON.parse(data);
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'bot') {
                  lastMessage.content += parsedData.content;
                }
                return newMessages;
              });
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  const handleClearChat = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:8000/api/messages/clear', {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to clear chat');
      
      setMessages([]);
    } catch (err) {
      setError('Failed to clear chat');
      console.error(err);
    }
  };

  const handleEditMessage = async (id: number, content: string) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8000/api/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) throw new Error('Failed to edit message');
      
      const updatedMessage = await response.json();
      setMessages(prev =>
        prev.map(msg => msg.id === id ? updatedMessage : msg)
      );
    } catch (err) {
      setError('Failed to edit message');
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8000/api/messages/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete message');
      
      setMessages(prev => prev.filter(msg => msg.id !== id));
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
        onClearChat={handleClearChat}
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
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSendMessage} />
    </div>
  );
};

export default memo(ChatWidget);