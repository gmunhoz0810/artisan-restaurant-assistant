/**
 * MessageBubble.tsx
 * 
 * Renders individual chat messages with different styles for user and bot messages.
 * Handles message interactions and restaurant search result display.
 * 
 * Features:
 * - Different styling for user/bot messages
 * - Message editing functionality (user messages only)
 * - Message deletion
 * - Markdown rendering for bot messages
 * - Restaurant search result integration
 * - Responsive design in both regular and fullscreen modes
 */

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import type { YelpSearchParams } from '../../services/yelp';
import RestaurantMessageContent from './RestaurantMessageContent';

interface MessageBubbleProps {
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isEdited: boolean;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  isFullscreen?: boolean;
  restaurant_search?: YelpSearchParams & { k?: number };
}

export const MessageBubble = ({
  content,
  sender,
  timestamp,
  isEdited,
  onEdit,
  onDelete,
  isFullscreen,
  restaurant_search
}: MessageBubbleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const isUser = sender === 'user';

  const messageWidth = (isFullscreen && !isUser && restaurant_search?.k !== undefined && restaurant_search.k > 1)
    ? 'w-[85%] max-w-5xl'
    : 'max-w-[75%]';

  // Set base text size - same for both user and bot in fullscreen
  const textSize = isFullscreen ? 'text-base' : 'text-sm';

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
    <div className={`flex ${isUser ? 'justify-end' : 'items-start'} gap-1.5`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
          <img
            src="/ChefAva.png"
            alt="Ava"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div 
        className={`
          ${messageWidth} 
          rounded-xl px-3 py-1.5
          ${isUser ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'}
          ${textSize}
        `}
      >
        {isEditing ? (
          <div className="flex flex-col gap-1.5">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className={`w-full bg-white text-gray-800 rounded p-1.5 focus:outline-none ${textSize}`}
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
              <p className={`whitespace-pre-wrap break-words ${textSize}`}>{content}</p>
            ) : (
              <div className={`
                prose ${isFullscreen ? 'prose-base' : 'prose-sm'} max-w-none prose-neutral 
                prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-1.5
                prose-p:${textSize} prose-headings:${isFullscreen ? 'text-lg' : 'text-base'}
                overflow-x-auto
              `}>
                <Markdown>{content}</Markdown>

                {restaurant_search && Object.keys(restaurant_search).length > 0 && (
                  <div className="mt-3">
                    <RestaurantMessageContent 
                      searchParams={restaurant_search}
                      isFullscreen={isFullscreen}
                      key={JSON.stringify(restaurant_search)}
                    />
                  </div>
                )}
              </div>
            )}
            {isUser && (
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] text-white/80 hover:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={onDelete}
                  className="text-[10px] text-white/80 hover:text-white"
                >
                  Delete
                </button>
              </div>
            )}
            {isEdited && (
              <span className="text-[10px] text-white/60 mt-0.5 block">
                (edited)
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};