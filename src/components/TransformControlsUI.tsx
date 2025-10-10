import React from 'react';

interface TransformControlsUIProps {
  transformEnabled: boolean;
  currentTransformMode: 'translate' | 'rotate' | 'scale';
  onModeChange: (mode: 'translate' | 'rotate' | 'scale') => void;
}

const TransformControlsUI: React.FC<TransformControlsUIProps> = ({
  transformEnabled,
  currentTransformMode,
  onModeChange,
}) => {
  if (!transformEnabled) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      <div className="flex gap-2 bg-black/95 text-white text-sm p-3 rounded-lg border border-gray-600 shadow-lg backdrop-blur-sm">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer select-none transform hover:scale-105 ${
            currentTransformMode === 'translate'
              ? 'bg-blue-600 text-white shadow-md border-2 border-blue-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          }`}
          onClick={() => onModeChange('translate')}
        >
          📦 MOVE
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer select-none transform hover:scale-105 ${
            currentTransformMode === 'rotate'
              ? 'bg-green-600 text-white shadow-md border-2 border-green-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          }`}
          onClick={() => onModeChange('rotate')}
        >
          🔄 ROTATE
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer select-none transform hover:scale-105 ${
            currentTransformMode === 'scale'
              ? 'bg-purple-600 text-white shadow-md border-2 border-purple-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          }`}
          onClick={() => onModeChange('scale')}
        >
          📏 SCALE
        </button>
      </div>
    </div>
  );
};

export default TransformControlsUI;
