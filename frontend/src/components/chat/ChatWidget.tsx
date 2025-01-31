import { useRef, useState, useEffect } from 'react';
import Header from './Header';
import { MessageBubble } from './MessageBubble.tsx';
import ChatInput from './ChatInput';
import ConversationSidebar from './ConversationSidebar';
import SidebarToggle from './SidebarToggle';
import { useChatState } from './useChatState';

const ChatWidget = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [currentConversationId]);

  const handleSidebarToggle = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const handleMessageSend = async (content: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await handleSendMessage(content);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg w-16 h-16 flex items-center justify-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        onClick={() => setIsMinimized(false)}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <img
            src="/ChefAva.png"
            alt="Chef Ava"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  const showNewChatButton = messages.length > 0;

  return (
    <div 
      className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl flex
        ${isSidebarExpanded ? 'w-[900px]' : 'w-[420px]'} h-[700px] overflow-hidden transition-all duration-300`}
    >
      {isSidebarExpanded && (
        <ConversationSidebar
          conversations={archivedConversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          canCreateNewChat={showNewChatButton}
          isProcessing={isProcessing}
        />
      )}
      
      <div className="flex-1 flex flex-col relative">
        <div className="relative">
          <SidebarToggle 
            isExpanded={isSidebarExpanded}
            onToggle={handleSidebarToggle}
            className="absolute top-6 -left-1 h-[72px]"
          />
          
          <Header 
            onMinimize={() => setIsMinimized(true)}
            onClose={() => setIsMinimized(true)}
            onNewConversation={showNewChatButton ? handleNewConversation : undefined}
            isSidebarExpanded={isSidebarExpanded}
          />
        </div>
        
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
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
              New Conversation...
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={`${message.id}-${message.isEdited}-${currentConversationId}`}
                {...message}
                onEdit={message.sender === 'user' ? (content: string) => handleEditMessage(message.id, content) : undefined}
                onDelete={message.sender === 'user' ? () => handleDeleteMessage(message.id) : undefined}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={handleMessageSend} disabled={isLoading || isProcessing} />
      </div>
    </div>
  );
};

export default ChatWidget;