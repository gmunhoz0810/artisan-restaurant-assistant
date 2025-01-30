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
        <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0">
          <img
            src="/avatar.png"
            alt="Assistant Avatar"
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%23C4B5FD"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%23FFFFFF">A</text></svg>';
            }}
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