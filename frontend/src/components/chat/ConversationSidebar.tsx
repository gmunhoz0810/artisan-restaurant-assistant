import { Conversation } from './useChatState';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: number) => void;
  canCreateNewChat: boolean;
  isProcessing: boolean;
}

const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  canCreateNewChat,
  isProcessing
}: ConversationSidebarProps) => {
  // Debug log conversations
  console.log('=== SIDEBAR RENDER ===');
  conversations.forEach(conv => {
    console.log(`Conversation ${conv.id}:`, {
      title: conv.title,
      is_new: conv.is_new,
      isCurrentConversation: conv.id === currentConversationId,
      isProcessing
    });
  });

  // Helper function to determine if delete button should be shown
  const showDeleteButton = (conversation: Conversation): boolean => {
    const shouldShow = !conversation.is_new && !(conversation.id === currentConversationId && isProcessing);
    console.log(`Delete button for conv ${conversation.id}:`, {
      is_new: conversation.is_new,
      isCurrentConversation: conversation.id === currentConversationId,
      isProcessing,
      shouldShow
    });
    return shouldShow;
  };

  return (
    <div className="w-64 bg-gray-50 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <button
          onClick={onNewConversation}
          disabled={!canCreateNewChat}
          className={`w-full rounded-lg py-2 px-4 transition-colors ${
            canCreateNewChat 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-300 cursor-not-allowed text-gray-500'
          }`}
        >
          New Chat
        </button>
      </div>
    
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">
            No conversations yet
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                conversation.id === currentConversationId ? 'bg-gray-100' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex-1 truncate">
                <p className={`text-sm font-medium ${conversation.is_new ? 'text-purple-600' : 'text-gray-900'} truncate`}>
                  {conversation.title === 'New Conversation' ? "New Conversation" : conversation.title}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(conversation.created_at).toLocaleDateString()}
                </p>
              </div>
              {showDeleteButton(conversation) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  aria-label="Delete conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;