interface MessageBubbleProps {
    content: string;
    sender: 'user' | 'bot';
    timestamp: string;
    isEdited: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
  }
  
  const MessageBubble = ({
    content,
    sender,
    timestamp,
    isEdited,
    onEdit,
    onDelete
  }: MessageBubbleProps) => {
    const isUser = sender === 'user';
  
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
          <p className="whitespace-pre-wrap break-words">{content}</p>
          
          {isUser && (
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                onClick={onEdit}
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
        </div>
      </div>
    );
  };
  
  export default MessageBubble;