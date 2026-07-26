import React from 'react';

export function LoadingView() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center w-full">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border-[3px] border-[#EBE3D5] border-t-[#C8885B] rounded-full animate-spin"></div>
        <div className="font-display uppercase tracking-[0.3em] text-[10px] text-gray-400 font-bold animate-pulse">Gathering Manuscripts...</div>
      </div>
    </div>
  );
}
