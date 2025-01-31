import { useState } from 'react';

interface MessageBubbleProps {
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isEdited: boolean;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
}

export const MessageBubble = ({
  content,
  sender,
  timestamp,
  isEdited,
  onEdit,
  onDelete
}: MessageBubbleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const isUser = sender === 'user';

  const handleSubmitEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(content);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'items-start'} gap-2`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <img
            src="/ChefAva.png"
            alt="Ava"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div 
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isUser 
            ? 'bg-purple-600 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-white text-gray-800 rounded p-2 focus:outline-none"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(content);
                }}
                className="text-xs text-white/80 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                className="text-xs text-white/80 hover:text-white"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap break-words">{content}</p>
            {isUser && (
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-white/80 hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={onDelete}
                  className="text-xs text-white/80 hover:text-white"
                >
                  Delete
                </button>
              </div>
            )}
            {isEdited && (
              <span className="text-xs text-white/60 mt-1 block">
                (edited)
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;