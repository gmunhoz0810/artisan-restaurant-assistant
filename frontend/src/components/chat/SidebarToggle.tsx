interface SidebarToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

const SidebarToggle = ({ isExpanded, onToggle, className = '' }: SidebarToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className={`
        absolute 
        left-0
        top-8
        w-6
        h-10
        z-10 
        bg-white 
        rounded-r-md
        transition-all 
        duration-200 
        cursor-pointer
        flex
        items-center
        justify-center
        border border-gray-200
        hover:border-gray-300
        hover:bg-gray-50
        group
        ${className}
      `}
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      <div className="flex gap-1.5 items-center justify-center">
        <div className="h-8 w-[1px] bg-gray-400" />
        <div className="h-8 w-[1px] bg-gray-400" />
      </div>

      <span className="absolute -middle-6 left-7 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-center leading-tight">
        {isExpanded ? (
          <>
            Collapse<br />
            Sidebar
          </>
        ) : (
          <>
            Expand<br />
            Sidebar
          </>
        )}
      </span>
    </button>
  );
};

export default SidebarToggle;