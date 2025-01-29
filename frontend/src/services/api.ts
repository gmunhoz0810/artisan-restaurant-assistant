interface Message {
    id: number;
    content: string;
    sender: 'user' | 'bot';
    timestamp: string;
    isEdited: boolean;
  }
  
  class APIError extends Error {
    constructor(message: string, public status?: number) {
      super(message);
      this.name = 'APIError';
    }
  }
  
  const API_BASE_URL = 'http://localhost:8000/api';
  
  async function handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new APIError(error, response.status);
    }
    return response.json();
  }
  
  export const messageApi = {
    async getMessages(): Promise<Message[]> {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/`);
        return handleResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        if (error instanceof APIError) throw error;
        throw new APIError('Failed to connect to server. Is the backend running?');
      }
    },
  
    async sendMessage(content: string): Promise<Message> {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        return handleResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        if (error instanceof APIError) throw error;
        throw new APIError('Failed to connect to server. Is the backend running?');
      }
    },
  
    async updateMessage(id: number, content: string): Promise<Message> {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        return handleResponse(response);
      } catch (error) {
        console.error('API Error:', error);
        if (error instanceof APIError) throw error;
        throw new APIError('Failed to connect to server. Is the backend running?');
      }
    },
  
    async deleteMessage(id: number): Promise<void> {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new APIError('Failed to delete message', response.status);
        }
      } catch (error) {
        console.error('API Error:', error);
        if (error instanceof APIError) throw error;
        throw new APIError('Failed to connect to server. Is the backend running?');
      }
    },
  };