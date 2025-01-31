/**
 * useChatState.tsx
 * 
 * Custom hook that manages the chat application's state and business logic.
 * Handles all chat operations including message management and conversation handling.
 * 
 * Key Functionalities:
 * - Message operations (send, edit, delete)
 * - Conversation management (create, switch, delete)
 * - Real-time message streaming with OpenAI
 * - Restaurant search result handling
 * - Authentication state integration
 * 
 * State Management:
 * - Current conversation tracking
 * - Message history
 * - Loading and error states
 * - Restaurant search data persistence
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { YelpSearchParams } from '../../services/yelp';

export interface Message {
    id: number;
    content: string;
    sender: 'user' | 'bot';
    timestamp: string;
    isEdited: boolean;
    conversation_id?: number;
    restaurant_search?: YelpSearchParams & { k?: number };
}

export interface Conversation {
    id: number;
    title: string;
    created_at: string;
    is_active: boolean;
    is_new: boolean;
    messages?: Message[];
}

interface RawMessage extends Omit<Message, 'restaurant_search'> {
    restaurant_search?: string | null | (YelpSearchParams & { k?: number });
}

interface RawConversation extends Omit<Conversation, 'messages'> {
    messages?: RawMessage[];
}

export function useChatState() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const processMessage = (msg: RawMessage): Message => {
    let processedRestaurantSearch = msg.restaurant_search;
    
    if (typeof processedRestaurantSearch === 'string') {
      try {
        processedRestaurantSearch = JSON.parse(processedRestaurantSearch);
      } catch {
        processedRestaurantSearch = undefined;
      }
    }

    return {
      ...msg,
      restaurant_search: processedRestaurantSearch as (YelpSearchParams & { k?: number }) | undefined
    };
  };

  const processConversation = (conv: RawConversation): Conversation => {
    return {
      ...conv,
      messages: conv.messages?.map(processMessage)
    };
  };

  const getCanCreateNewChat = (currentMessages: Message[], conversations: Conversation[]): boolean => {
    // Check for any existing new conversation first
    const hasNewConversation = conversations.some(conv => conv.is_new);
    if (hasNewConversation) return false;
    
    // Only allow new chat if current conversation has messages and isn't new
    const currentConversation = conversations.find(conv => conv.is_active);
    return currentMessages.length > 0 && 
           currentConversation !== undefined && 
           !currentConversation.is_new;
  };

  const handleSelectConversation = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Selecting conversation:', id);
      
      await fetch(`http://localhost:8000/api/messages/conversations/${id}/activate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const response = await fetch(`http://localhost:8000/api/messages/conversations/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to load conversation');
      
      const rawConversation: RawConversation = await response.json();
      console.log('Loaded conversation data:', rawConversation);
      
      const processedConversation = processConversation(rawConversation);
      console.log('Processed conversation:', processedConversation);
      
      setCurrentConversationId(id);
      setMessages(processedConversation.messages || []);

      setArchivedConversations(prev => 
        prev.map(conv => ({
          ...conv,
          is_active: conv.id === id,
          is_new: conv.id === id ? processedConversation.is_new : conv.is_new,
          title: conv.id === id ? processedConversation.title : conv.title  // Add this line
        }))
      );
      
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load conversation');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const existingNewConv = archivedConversations.find(conv => conv.is_new === true);
      
      if (existingNewConv) {
        await handleSelectConversation(existingNewConv.id);
        return;
      }
  
      const response = await fetch('http://localhost:8000/api/messages/new-conversation', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) throw new Error('Failed to create new conversation');
  
      const result = await response.json();
      const returnedConvId = result.id;
      const existingConv = archivedConversations.find(conv => conv.id === returnedConvId);
      
      if (existingConv) {
        setArchivedConversations(prev => 
          prev.map(conv => ({
            ...conv,
            is_active: conv.id === returnedConvId,
            is_new: conv.id === returnedConvId ? true : conv.is_new
          }))
        );
        setCurrentConversationId(returnedConvId);
        setMessages(existingConv.messages || []);
      } else {
        setArchivedConversations(prev => [
          {
            id: result.id,
            title: result.title,
            created_at: result.created_at,
            is_active: result.is_active,
            is_new: result.is_new,
            messages: []
          },
          ...prev.map(conv => ({...conv, is_active: false}))
        ]);
        setCurrentConversationId(result.id);
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to create new conversation');
      console.error(err);
    }
  };

  const loadInitialData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
  
    try {
      console.log('Loading initial data...');
      const response = await fetch('http://localhost:8000/api/messages/conversations', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const rawConversations: RawConversation[] = await response.json();
        console.log('Raw conversations data:', rawConversations);
        
        const processedConversations = rawConversations.map(processConversation);
        
        processedConversations.forEach(conv => {
          console.log(`Conversation ${conv.id} messages:`, conv.messages);
          conv.messages?.forEach(msg => {
            console.log(`Message ${msg.id} full data:`, msg);
            console.log(`Message ${msg.id} restaurant_search:`, msg.restaurant_search);
          });
        });
        
        setArchivedConversations(processedConversations);
  
        const activeConversation = processedConversations.find(c => c.is_active);
        if (activeConversation) {
          console.log('Setting active conversation:', activeConversation);
          setCurrentConversationId(activeConversation.id);
          console.log('Setting messages:', activeConversation.messages);
          setMessages(activeConversation.messages || []);
        } else if (processedConversations.length > 0) {
          await handleSelectConversation(processedConversations[0].id);
        } else {
          await handleNewConversation();
        }
      } else if (response.status === 401) {
        setError('Please log in to continue');
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load conversations');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [isAuthenticated]);

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) {
      setError('No active conversation');
      return;
    }
  
    try {
      setError(null);
  
      // Add user message immediately to UI
      const tempUserMessage: Message = {
        id: -2,
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        isEdited: false,
        conversation_id: currentConversationId,
      };
      setMessages((prev) => [...prev, tempUserMessage]);
  
      const response = await fetch('http://localhost:8000/api/messages/stream', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content,
          conversation_id: currentConversationId,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
  
      const tempBotMessage: Message = {
        id: -1,
        content: '',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isEdited: false,
        conversation_id: currentConversationId,
      };
      setMessages((prev) => [...prev, tempBotMessage]);
  
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
  
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
  
      let userMessageId: number | null = null;
      let botMessageId: number | null = null;
      let incompleteChunk = '';
      let restaurantSearch: YelpSearchParams & { k?: number } | undefined;
      
      console.log('Starting message stream processing...');
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        const lines = (incompleteChunk + chunk).split('\n');
        incompleteChunk = lines.pop() || '';
  
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
  
            try {
              const parsedData = JSON.parse(data);

              if (parsedData.restaurant_search) {
                restaurantSearch = parsedData.restaurant_search;
                console.log('Received restaurant search data:', restaurantSearch);
                
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.sender === 'bot') {
                    // Create a new message object to ensure state update
                    const updatedMessage: Message = {
                      ...lastMessage,
                      restaurant_search: restaurantSearch
                    };
                    console.log('Updating bot message with restaurant data:', updatedMessage);
                    newMessages[newMessages.length - 1] = updatedMessage;
                  }
                  return [...newMessages]; // Force a new array reference
                });
              }

              if (parsedData.conversation_update) {
                console.log('Received conversation update:', parsedData.conversation_update);
                
                // Immediately update both archived conversations and current conversation
                setArchivedConversations(prev =>
                  prev.map(conv =>
                    conv.id === parsedData.conversation_update.id
                      ? {
                          ...conv,
                          ...parsedData.conversation_update,
                          is_new: false  // Explicitly set to false when getting an update
                        }
                      : conv
                  )
                );
              }
  
              if (parsedData.user_message_id && !userMessageId) {
                userMessageId = parsedData.user_message_id;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === -2 ? { ...msg, id: userMessageId! } : msg
                  )
                );
              }
  
              if (parsedData.bot_message_id && !botMessageId) {
                botMessageId = parsedData.bot_message_id;
                if (botMessageId !== null) {
                  const updatedBotMessage: Message = {
                    id: botMessageId,
                    content: '',
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    isEdited: false,
                    conversation_id: currentConversationId,
                    restaurant_search: restaurantSearch
                  };
                  
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === -1 ? updatedBotMessage : msg
                    )
                  );
                  console.log('Created bot message with ID and restaurant data:', updatedBotMessage);
                }
              }
  
              if (parsedData.content) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.sender === 'bot') {
                    const updatedMessage: Message = {
                      ...lastMessage,
                      content: lastMessage.content + parsedData.content,
                      id: botMessageId ?? lastMessage.id,
                      restaurant_search: restaurantSearch ?? lastMessage.restaurant_search
                    };
                    console.log('Updated message with content and restaurant data:', updatedMessage);
                    newMessages[newMessages.length - 1] = updatedMessage;
                  }
                  return [...newMessages]; // Force a new array reference
                });
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
      
      // Handle any remaining incomplete chunk
      if (incompleteChunk) {
        try {
          const parsedData = JSON.parse(incompleteChunk);
          if (parsedData.content) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.sender === 'bot') {
                const updatedMessage: Message = {
                  ...lastMessage,
                  content: lastMessage.content + parsedData.content,
                  restaurant_search: restaurantSearch ?? lastMessage.restaurant_search
                };
                newMessages[newMessages.length - 1] = updatedMessage;
                console.log('Final message state with restaurant data:', updatedMessage);
              }
              return [...newMessages];
            });
          }
        } catch (e) {
          console.error('Error parsing incomplete chunk:', e);
        }
      }
      
      // Final state check
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.sender === 'bot' && restaurantSearch) {
          console.log('Final check - ensuring restaurant data is present:', restaurantSearch);
          return prev.map((msg, index) =>
            index === prev.length - 1
              ? { ...msg, restaurant_search: restaurantSearch }
              : msg
          );
        }
        return prev;
      });
      
      console.log('Message stream processing completed');
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== -1 && msg.id !== -2)
      );
    }
  };

  const handleEditMessage = async (id: number, content: string) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8000/api/messages/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) throw new Error('Failed to edit message');
      
      const rawMessage = await response.json();
      const processedMessage = processMessage(rawMessage);
      setMessages(prev =>
        prev.map(msg => msg.id === id ? processedMessage : msg)
      );
    } catch (err) {
      setError('Failed to edit message');
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8000/api/messages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to delete message');
      
      setMessages(prev => prev.filter(msg => msg.id !== id));
    } catch (err) {
      setError('Failed to delete message');
      console.error(err);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/messages/conversations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      setArchivedConversations(prev => prev.filter(conv => conv.id !== id));
      if (id === currentConversationId) {
        await handleNewConversation();
      }
    } catch (err) {
      setError('Failed to delete conversation');
      console.error(err);
    }
  };

  return {
    messages,
    archivedConversations,
    currentConversationId,
    isLoading,
    error,
    canCreateNewChat: getCanCreateNewChat(messages, archivedConversations),
    handleNewConversation,
    handleSendMessage,
    handleSelectConversation,
    handleEditMessage,
    handleDeleteMessage,
    handleDeleteConversation,
  };
}

export default useChatState;