// ChatWidget.tsx
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    if (!isFullscreen) {
      setIsSidebarExpanded(!isSidebarExpanded);
    }
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setIsSidebarExpanded(true);
    }
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

  if (isMinimized && !isFullscreen) {
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

  const containerClasses = isFullscreen
    ? 'fixed inset-0 m-0 rounded-none w-full'
    : `fixed bottom-4 right-4 rounded-lg h-[700px] ${isSidebarExpanded ? 'w-[900px]' : 'w-[420px]'}`;

  return (
    <div 
      className={`
        ${containerClasses}
        bg-white shadow-xl flex
        overflow-hidden transition-all duration-300
        ${isFullscreen ? 'z-50' : 'z-40'}
        ${isFullscreen ? 'text-sm' : 'text-base'}
      `}
    >
      <div className={`
        flex w-full
        ${isFullscreen ? 'max-w-[1800px] mx-auto px-4' : ''}
      `}>
        {(isSidebarExpanded || isFullscreen) && (
          <div className="w-64 flex-shrink-0 border-r">
            <ConversationSidebar
              conversations={archivedConversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              canCreateNewChat={showNewChatButton}
              isProcessing={isProcessing}
            />
          </div>
        )}
        
        <div className="flex-1 flex flex-col relative">
          <div className="relative">
            {!isFullscreen && (
              <SidebarToggle 
                isExpanded={isSidebarExpanded}
                onToggle={handleSidebarToggle}
                className="absolute top-15 -left-1 h-[72px]"
              />
            )}
            
            <Header 
              onMinimize={() => !isFullscreen && setIsMinimized(true)}
              onClose={() => !isFullscreen && setIsMinimized(true)}
              onNewConversation={showNewChatButton ? handleNewConversation : undefined}
              isSidebarExpanded={isSidebarExpanded}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleFullscreenToggle}
            />
          </div>
          
          <div className={`
            flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50
            ${isFullscreen ? 'text-sm' : 'text-base'}
          `}>
            <div className={`
              mx-auto w-full
              ${isFullscreen ? 'max-w-5xl' : ''}
            `}>
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
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={`${message.id}-${message.isEdited}-${currentConversationId}`}
                      {...message}
                      onEdit={message.sender === 'user' ? (content: string) => handleEditMessage(message.id, content) : undefined}
                      onDelete={message.sender === 'user' ? () => handleDeleteMessage(message.id) : undefined}
                      isFullscreen={isFullscreen}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className={`
            w-full
            ${isFullscreen ? 'max-w-5xl mx-auto' : ''}
          `}>
            <ChatInput 
              onSend={handleMessageSend} 
              disabled={isLoading || isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;