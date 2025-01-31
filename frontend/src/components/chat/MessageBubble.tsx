import { useState } from 'react';
import Markdown from 'react-markdown';

interface MessageBubbleProps {
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isEdited: boolean;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
}

// Add this interface to fix the TypeScript error
interface CodeComponentProps {
  inline?: boolean;
  node?: any;
  children?: React.ReactNode;
  className?: string;
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
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{content}</p>
            ) : (
              <div className="prose prose-sm max-w-none prose-neutral prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 overflow-x-auto">
                <Markdown components={{
                  // Style links
                  a: ({ node, ...props }) => (
                    <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
                  ),
                  // Style paragraphs
                  p: ({ node, ...props }) => (
                    <p {...props} className="mb-2 last:mb-0" />
                  ),
                  // Style lists
                  ul: ({ node, ...props }) => (
                    <ul {...props} className="list-disc pl-4 mb-2 last:mb-0" />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol {...props} className="list-decimal pl-4 mb-2 last:mb-0" />
                  ),
                  // Style list items
                  li: ({ node, ...props }) => (
                    <li {...props} className="mb-1 last:mb-0" />
                  ),
                  // Style code blocks
                  pre: ({ node, ...props }) => (
                    <pre {...props} className="overflow-x-auto bg-gray-200 p-2 rounded-lg text-sm my-2 whitespace-pre" style={{ maxWidth: '100%' }} />
                  ),
                  code: ({ node, inline, ...props }: CodeComponentProps) => (
                    inline 
                      ? <code {...props} className="bg-gray-200 px-1 py-0.5 rounded text-sm" />
                      : <code {...props} className="break-words whitespace-pre-wrap text-sm" />
                  ),
                  // Style blockquotes
                  blockquote: ({ node, ...props }) => (
                    <blockquote {...props} className="border-l-4 border-gray-300 pl-4 italic my-2" />
                  ),
                  // Style headings
                  h1: ({ node, ...props }) => (
                    <h1 {...props} className="text-xl font-bold mb-2" />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 {...props} className="text-lg font-bold mb-2" />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 {...props} className="text-base font-bold mb-2" />
                  ),
                  // Style tables
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-2">
                      <table {...props} className="min-w-full border-collapse border border-gray-300" />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead {...props} className="bg-gray-200" />
                  ),
                  tbody: ({ node, ...props }) => (
                    <tbody {...props} className="bg-white" />
                  ),
                  tr: ({ node, ...props }) => (
                    <tr {...props} className="border-b border-gray-300" />
                  ),
                  th: ({ node, ...props }) => (
                    <th {...props} className="border border-gray-300 px-4 py-2 text-left" />
                  ),
                  td: ({ node, ...props }) => (
                    <td {...props} className="border border-gray-300 px-4 py-2" />
                  ),
                }}>
                  {content}
                </Markdown>
              </div>
            )}
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