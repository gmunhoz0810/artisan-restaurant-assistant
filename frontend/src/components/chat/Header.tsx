/**
 * Header.tsx
 * 
 * Chat interface header component with user controls and branding.
 * Manages chat window controls and user authentication state.
 * 
 * Features:
 * - Window controls (minimize/maximize/close)
 * - Fullscreen toggle
 * - New conversation button
 * - Sign out functionality with confirmation
 * - Chef Ava branding display
 * - Responsive design adaptation
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    onMinimize: () => void;
    onClose: () => void;
    onNewConversation?: () => void;
    isSidebarExpanded: boolean;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}

const Header = ({ 
    onMinimize, 
    onClose, 
    onNewConversation, 
    isSidebarExpanded,
    isFullscreen,
    onToggleFullscreen 
}: HeaderProps) => {
    const { user, logout } = useAuth();
    const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

    const handleSignOutClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSignOutDialogOpen(true);
    };

    const handleConfirmSignOut = () => {
        logout();
        setSignOutDialogOpen(false);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setSignOutDialogOpen(false);
        }
    };

    return (
        <>
            <div className={`relative px-4 ${isFullscreen ? 'pt-2' : 'pt-6'} pb-4 border-b bg-white`}>
                <div className="flex justify-between items-center absolute w-full left-0 px-4" style={{ top: '8px' }}>
                    <button
                        onClick={onToggleFullscreen}
                        className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-all duration-200 group relative border border-gray-200 hover:border-gray-300 cursor-pointer ml-0"
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        {isFullscreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4l-6 6M4 20l6-6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 10V4h-6M4 14v6h6" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20l6-6M20 4l-6 6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14v6h6M20 10V4h-6" />
                            </svg>
                        )}
                        <span className="absolute -bottom-8 left-4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        </span>
                    </button>

                    <div className="flex items-center gap-2">
                        {user && (
                            <>
                                {onNewConversation && (
                                    <button
                                        onClick={onNewConversation}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 group relative border border-purple-200 hover:border-purple-300 cursor-pointer"
                                        aria-label="New Chat"
                                    >
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-5 w-5" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M12 4v16m8-8H4" 
                                            />
                                        </svg>
                                        <span className="absolute -bottom-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                                            New Chat
                                        </span>
                                    </button>
                                )}
                                <button
                                    onClick={handleSignOutClick}
                                    className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-all duration-200 group relative border border-gray-200 hover:border-gray-300 cursor-pointer"
                                    aria-label="Sign Out"
                                >
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        className="h-5 w-5" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                                        />
                                    </svg>
                                    <span className="absolute -bottom-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                                        Sign Out
                                    </span>
                                </button>
                                {!isFullscreen && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-200 group relative border border-gray-200 hover:border-gray-300 cursor-pointer"
                                        aria-label="Close Chat"
                                    >
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-5 w-5" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M6 18L18 6M6 6l12 12" 
                                            />
                                        </svg>
                                        <span className="absolute -bottom-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                                            Close Chat
                                        </span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className={`flex flex-col items-center ${isFullscreen ? 'mt-0' : 'mt-2'}`}>
                    <div className="w-12 h-12 rounded-full mb-2 overflow-hidden">
                        <img
                            src="/ChefAva.png"
                            alt="Ava"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="text-lg font-semibold">Hey, I'm Chef Ava 👩🏻‍🍳</h1>
                    <p className="text-sm text-gray-500">Ask me anything about restaurants</p>
                </div>
            </div>

            {signOutDialogOpen && (
                <div 
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ backgroundColor: 'rgba(107, 114, 128, 0.25)' }}
                    onClick={handleOverlayClick}
                >
                    <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-medium mb-2 text-center">Sign Out</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to sign out? Your conversations will be saved for next time.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSignOutDialogOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSignOut}
                                className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded cursor-pointer transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;