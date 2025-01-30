import { Conversation } from './useChatState';
import { useState } from 'react';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const showDeleteButton = (conversation: Conversation): boolean => {
    return !conversation.is_new && !(conversation.id === currentConversationId && isProcessing);
  };

  const handleDeleteClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setSelectedConversation(conversation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedConversation) {
      onDeleteConversation(selectedConversation.id);
    }
    setDeleteDialogOpen(false);
    setSelectedConversation(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      setDeleteDialogOpen(false);
      setSelectedConversation(null);
    }
  };

  return (
    <>
      <div className="w-64 bg-gray-50 border-r h-full flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={onNewConversation}
            disabled={!canCreateNewChat}
            className={`w-full rounded-lg py-2 px-4 transition-colors cursor-pointer ${
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
                className={`relative flex items-stretch ${
                  conversation.id === currentConversationId ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
              >
                <div
                  className="flex-1 p-3 cursor-pointer"
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <p className={`text-sm font-medium ${conversation.is_new ? 'text-purple-600' : 'text-gray-900'} truncate`}>
                    {conversation.title === 'New Conversation' ? "New Conversation" : conversation.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </p>
                </div>
                {showDeleteButton(conversation) && (
                  <div className="flex items-stretch">
                    <button
                      onClick={(e) => handleDeleteClick(e, conversation)}
                      className="px-4 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors flex items-center cursor-pointer"
                      aria-label="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {deleteDialogOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(107, 114, 128, 0.25)' }}
          onClick={handleOverlayClick}
        >
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium mb-2 text-center">Delete Conversation</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{selectedConversation?.title}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConversationSidebar;