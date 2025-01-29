// src/services/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messageApi } from '../api';

describe('messageApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMessages', () => {
    it('should fetch messages successfully', async () => {
      const mockMessages = [
        { id: 1, content: 'Test', sender: 'user', timestamp: '2024-01-29T12:00:00Z', isEdited: false }
      ];

      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessages)
      }));

      const result = await messageApi.getMessages();
      expect(result).toEqual(mockMessages);
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/messages/');
    });

    it('should handle network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network error')));

      await expect(messageApi.getMessages()).rejects.toThrow('Failed to connect to server');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockMessage = { 
        id: 1, 
        content: 'Test', 
        sender: 'user', 
        timestamp: '2024-01-29T12:00:00Z', 
        isEdited: false 
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessage)
      }));

      const result = await messageApi.sendMessage('Test');
      expect(result).toEqual(mockMessage);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/messages/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Test' })
        })
      );
    });
  });
});