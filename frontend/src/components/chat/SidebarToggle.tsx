interface SidebarToggleProps {
    isExpanded: boolean;
    onToggle: () => void;
  }
  
  const SidebarToggle = ({ isExpanded, onToggle }: SidebarToggleProps) => {
    return (
      <button
        onClick={onToggle}
        className="absolute left-4 top-20 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1 shadow-md"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        )}
      </button>
    );
  };
  
  export default SidebarToggle;