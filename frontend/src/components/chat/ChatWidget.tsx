import { useRef, useState, useEffect } from 'react';
import Header from './Header';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ConversationSidebar from './ConversationSidebar';
import SidebarToggle from './SidebarToggle';
import { useChatState } from './useChatState';

const ChatWidget = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    archivedConversations,
    currentConversationId,
    isLoading,
    error,
    handleNewConversation,
    handleSendMessage,
    handleSelectConversation,
    handleEditMessage,
    handleDeleteMessage,
    handleDeleteConversation,
  } = useChatState();

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Reset scroll when switching conversations
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [currentConversationId]);

  const handleSidebarToggle = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
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

  const showNewChatButton = messages.length > 0;

  return (
    <div 
      className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl flex
        ${isSidebarExpanded ? 'w-[800px]' : 'w-[380px]'} h-[600px] overflow-hidden transition-all duration-300`}
    >
      {isSidebarExpanded && (
        <ConversationSidebar
          conversations={archivedConversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          canCreateNewChat={showNewChatButton}
        />
      )}
      
      <div className="flex-1 flex flex-col relative">
        <SidebarToggle 
          isExpanded={isSidebarExpanded}
          onToggle={handleSidebarToggle}
        />
        
        <Header 
          onMinimize={() => setIsMinimized(true)}
          onClose={() => setIsMinimized(true)}
          onNewConversation={showNewChatButton ? handleNewConversation : undefined}
        />
        
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
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
                key={`${message.id}-${message.isEdited}-${currentConversationId}`}
                {...message}
                onEdit={message.sender === 'user' ? (content) => handleEditMessage(message.id, content) : undefined}
                onDelete={message.sender === 'user' ? () => handleDeleteMessage(message.id) : undefined}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default ChatWidget;