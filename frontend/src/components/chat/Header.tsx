import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    onMinimize: () => void;
    onClose: () => void;
    onNewConversation?: () => void;
    isSidebarExpanded: boolean;
}

const Header = ({ onMinimize, onClose, onNewConversation, isSidebarExpanded }: HeaderProps) => {
    const { user, logout } = useAuth();

    return (
        <div className="relative px-4 pt-6 pb-4 border-b bg-white">
            {/* Top row with action buttons */}
            <div className="absolute top-2 right-4 flex items-center gap-2">
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
                            onClick={logout}
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
                    </>
                )}
            </div>

            {/* Avatar and welcome message */}
            <div className="flex flex-col items-center mt-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 mb-2 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-purple-600">A</span>
                </div>
                <h1 className="text-lg font-semibold">Hey 👋, I'm Chef Ava</h1>
                <p className="text-sm text-gray-500">Ask me anything about restaurants</p>
            </div>
        </div>
    );
};

export default Header;
