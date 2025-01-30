import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface Message {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isEdited: boolean;
  conversation_id?: number;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  is_active: boolean;
  messages?: Message[];
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

  const findEmptyConversation = (conversations: Conversation[]): Conversation | undefined => {
    if (!conversations || conversations.length === 0) return undefined;
    return conversations.find(conv => {
      // Only check current conversation if it's the active one
      if (conv.is_active) {
        return false;
      }
      // Check if messages array exists and is empty
      const messages = conv.messages || [];
      return messages.length === 0;
    });
  };

  const hasEmptyConversation = (conversations: Conversation[]): boolean => {
    if (!conversations || conversations.length === 0) return false;
    return conversations.some(conv => {
      // Only check current conversation if it's the active one
      if (conv.is_active) {
        return false;
      }
      // Check if messages array exists and is empty
      const messages = conv.messages || [];
      return messages.length === 0;
    });
  };

  const getCanCreateNewChat = (currentMessages: Message[], conversations: Conversation[]): boolean => 
    currentMessages.length > 0 && !hasEmptyConversation(conversations);

  const handleSelectConversation = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First activate the conversation
      await fetch(`http://localhost:8000/api/messages/conversations/${id}/activate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      // Then load the conversation data
      const response = await fetch(`http://localhost:8000/api/messages/conversations/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to load conversation');
      
      const conversation = await response.json();
      setCurrentConversationId(id);
      setMessages(conversation.messages || []);

      // Update local state
      setArchivedConversations(prev => 
        prev.map(conv => ({
          ...conv,
          is_active: conv.id === id
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
      setError(null);
      
      // Check for empty conversation but exclude the active one
      const emptyConv = findEmptyConversation(archivedConversations);
      if (emptyConv && emptyConv.id !== currentConversationId) {
        // If there is an empty conversation and we're not in it, switch to it
        await handleSelectConversation(emptyConv.id);
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/messages/new-conversation', {
        method: 'POST',
        headers: getAuthHeaders()
      });
  
      if (!response.ok) throw new Error('Failed to create new conversation');
  
      const result = await response.json();
      
      if (result.status === 'success') {
        // Refresh conversations list
        const convResponse = await fetch('http://localhost:8000/api/messages/conversations', {
          headers: getAuthHeaders()
        });
        const conversations = await convResponse.json();
        
        setArchivedConversations(conversations);
        
        // Directly set the new conversation as active
        setCurrentConversationId(result.id);
        setMessages([]);
        
        // Find and activate the new conversation
        const newConv = conversations.find((c: Conversation) => c.id === result.id);
        if (newConv) {
          // Update conversation title in list
          setArchivedConversations(prev => 
            prev.map(conv => 
              conv.id === result.id ? {...conv, is_active: true} : {...conv, is_active: false}
            )
          );
        }
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
      const response = await fetch('http://localhost:8000/api/messages/conversations', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const conversations: Conversation[] = await response.json();
        setArchivedConversations(conversations);

        // Find active conversation or create new one
        const activeConversation = conversations.find(c => c.is_active);
        if (activeConversation) {
          setCurrentConversationId(activeConversation.id);
          setMessages(activeConversation.messages || []);
        } else if (conversations.length > 0) {
          setCurrentConversationId(conversations[0].id);
          setMessages(conversations[0].messages || []);
        } else {
          await handleNewConversation();
        }
      } else if (response.status === 401) {
        // Handle unauthorized error
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
  
      // Send message to backend
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
  
      // Add bot message placeholder
      const tempBotMessage: Message = {
        id: -1,
        content: '',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isEdited: false,
        conversation_id: currentConversationId,
      };
      setMessages((prev) => [...prev, tempBotMessage]);
  
      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
  
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
  
      let userMessageId: number | null = null;
      let botMessageId: number | null = null;
      let incompleteChunk = '';
  
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
  
              if (parsedData.user_message_id && !userMessageId) {
                userMessageId = parsedData.user_message_id;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === -2 ? { ...msg, id: userMessageId! } : msg
                  )
                );
              }
  
              if (parsedData.bot_message_id && !botMessageId) {
                botMessageId = parsedData.bot_message_id;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === -1 ? { ...msg, id: botMessageId! } : msg
                  )
                );
              }
  
              if (parsedData.content) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.sender === 'bot') {
                    lastMessage.content += parsedData.content;
                    if (botMessageId) {
                      lastMessage.id = botMessageId;
                    }
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
  
      if (incompleteChunk) {
        try {
          const parsedData = JSON.parse(incompleteChunk);
          if (parsedData.content) {
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && lastMessage.sender === 'bot') {
                lastMessage.content += parsedData.content;
                if (botMessageId) {
                  lastMessage.id = botMessageId;
                }
              }
              return newMessages;
            });
          }
        } catch (e) {
          console.error('Error parsing incomplete chunk:', e);
        }
      }
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
      
      const updatedMessage = await response.json();
      setMessages(prev =>
        prev.map(msg => msg.id === id ? updatedMessage : msg)
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