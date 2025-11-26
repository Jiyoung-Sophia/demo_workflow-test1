import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, RotateCw, Check, Info } from 'lucide-react';
import { ScheduleConfig, ScheduleMode } from '../../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ScheduleConfig) => void;
  initialConfig: ScheduleConfig;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialConfig 
}) => {
  const [mode, setMode] = useState<ScheduleMode>(initialConfig.mode);
  
  // Recurring State
  const [intervalValue, setIntervalValue] = useState(initialConfig.recurring?.intervalValue || 1);
  const [intervalUnit, setIntervalUnit] = useState<'HOURS' | 'DAYS' | 'WEEKS'>(initialConfig.recurring?.intervalUnit || 'DAYS');
  
  // Specific Time State
  const [specificDate, setSpecificDate] = useState(
    initialConfig.specificTime || new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );

  useEffect(() => {
    if (isOpen) {
        setMode(initialConfig.mode);
        if (initialConfig.recurring) {
            setIntervalValue(initialConfig.recurring.intervalValue);
            setIntervalUnit(initialConfig.recurring.intervalUnit);
        }
        if (initialConfig.specificTime) {
            setSpecificDate(initialConfig.specificTime);
        }
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newConfig: ScheduleConfig = {
      mode,
      isActive: mode !== 'IMMEDIATE',
      recurring: mode === 'RECURRING' ? {
        intervalValue,
        intervalUnit
      } : undefined,
      specificTime: mode === 'SPECIFIC_TIME' ? specificDate : undefined
    };
    onSave(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            Schedule Configuration
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            
            {/* Mode Selection Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg mb-6">
                <button 
                    onClick={() => setMode('IMMEDIATE')}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${mode === 'IMMEDIATE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Run Now
                </button>
                <button 
                    onClick={() => setMode('RECURRING')}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${mode === 'RECURRING' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Recurring
                </button>
                <button 
                    onClick={() => setMode('SPECIFIC_TIME')}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${mode === 'SPECIFIC_TIME' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Specific Date
                </button>
            </div>

            {/* Dynamic Content Body */}
            <div className="min-h-[120px]">
                {mode === 'IMMEDIATE' && (
                    <div className="text-center py-4 text-gray-600">
                        <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock size={24} className="text-blue-500" />
                        </div>
                        <p className="font-medium">Manual Trigger</p>
                        <p className="text-sm mt-1">The job will start immediately when you click submit.</p>
                    </div>
                )}

                {mode === 'RECURRING' && (
                    <div className="space-y-4 animate-fade-in">
                        <label className="block text-sm font-medium text-gray-700">Repeat Frequency</label>
                        <div className="flex gap-3">
                            <input 
                                type="number" 
                                min="1"
                                value={intervalValue}
                                onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                                className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <select 
                                value={intervalUnit}
                                onChange={(e) => setIntervalUnit(e.target.value as any)}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="HOURS">Hours</option>
                                <option value="DAYS">Days</option>
                                <option value="WEEKS">Weeks</option>
                            </select>
                        </div>
                        <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                            <Info size={14} className="mt-0.5 shrink-0" />
                            <p>Cron job will be created to run this pipeline every <b>{intervalValue} {intervalUnit.toLowerCase()}</b>.</p>
                        </div>
                    </div>
                )}

                {mode === 'SPECIFIC_TIME' && (
                    <div className="space-y-4 animate-fade-in">
                        <label className="block text-sm font-medium text-gray-700">Select Start Time</label>
                        <input 
                            type="datetime-local" 
                            value={specificDate}
                            onChange={(e) => setSpecificDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        />
                        <div className="flex items-start gap-2 bg-purple-50 p-3 rounded-lg text-xs text-purple-700">
                            <Info size={14} className="mt-0.5 shrink-0" />
                            <p>The job will be queued and automatically started on <b>{new Date(specificDate).toLocaleString()}</b>.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
                <Check size={16} />
                {mode === 'IMMEDIATE' ? 'Set to Manual' : 'Confirm Schedule'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;