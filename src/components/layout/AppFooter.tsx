import React from 'react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="mt-3 pt-1.5 border-t border-gray-200">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="text-lg">©</span>
          <a
            href="https://netmate.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            NetMate.cz
          </a>
        </div>
        <div className="text-gray-400">
          Verze: 3.2.1
        </div>
      </div>
    </footer>
  );
};
