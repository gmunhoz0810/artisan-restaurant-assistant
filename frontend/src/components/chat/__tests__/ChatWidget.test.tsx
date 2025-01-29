
import { render, screen, fireEvent, waitFor } from '@testing-library/react';import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatWidget from '../ChatWidget';
import { messageApi } from '../../../services/api';

// Mock the API
vi.mock('../../../services/api', () => ({
  messageApi: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
  }
}));

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock initial messages load
    (messageApi.getMessages as any).mockResolvedValue([]);
  });

  it('renders empty state correctly', async () => {
    render(<ChatWidget />);
    await waitFor(() => {
      expect(screen.getByText(/ask me anything about restaurants/i)).toBeDefined();
    });
  });

  it('sends a message successfully', async () => {
    const mockMessage = {
      id: 1,
      content: 'Test message',
      sender: 'user',
      timestamp: '2024-01-29T12:00:00Z',
      isEdited: false,
    };
    
    (messageApi.sendMessage as any).mockResolvedValue(mockMessage);
    
    render(<ChatWidget />);
    
    // Find and fill the input
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Test message' } });

    // Find and click the send button
    const sendButton = screen.getByRole('button', { name: /send/i }) || 
                      screen.getByLabelText(/send/i) ||
                      screen.getByTestId('send-button');

    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(messageApi.sendMessage).toHaveBeenCalledWith('Test message');
    });

    await waitFor(() => {
      const messageElement = screen.getByText('Test message');
      expect(messageElement).toBeDefined();
    });
  });
});