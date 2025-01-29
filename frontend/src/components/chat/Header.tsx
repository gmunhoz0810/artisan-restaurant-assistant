interface HeaderProps {
    onMinimize: () => void;
    onClose: () => void;
  }
  
  const Header = ({ onMinimize, onClose }: HeaderProps) => {
    return (
      <div className="relative p-4 border-b">
        {/* Window controls */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex space-x-2">
          <button
            onClick={onMinimize}
            className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500"
          />
          <button
            className="w-3 h-3 rounded-full bg-gray-300"
          />
        </div>
  
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
  
        {/* Avatar and welcome message */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 mb-2">
            <img
              src="/avatar.png"
              alt="Assistant Avatar"
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23C4B5FD"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23FFFFFF">A</text></svg>';
              }}
            />
          </div>
          <h1 className="text-lg font-semibold">Hey 👋, I'm Ava</h1>
          <p className="text-sm text-gray-500">Ask me anything or pick a place to start</p>
        </div>
      </div>
    );
  };
  
  export default Header;