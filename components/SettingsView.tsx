
import React from 'react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {
  return (
    <div className="p-6 h-full overflow-y-auto bg-white fade-in">
      <div className="max-w-3xl mx-auto py-8">
        <header className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800">Preferences</h2>
          <p className="text-slate-500 text-sm">Configure your personal assistant experience</p>
        </header>

        <div className="space-y-10">
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Interface</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-slate-700">Dark Mode</p>
                  <p className="text-xs text-slate-500">Enable high-contrast night theme (Simulated)</p>
                </div>
                <button 
                  onClick={() => onUpdate({ darkMode: !settings.darkMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-slate-700">Display Language</p>
                  <p className="text-xs text-slate-500">Primary UI language for menus and buttons</p>
                </div>
                <select 
                  value={settings.language}
                  onChange={(e) => onUpdate({ language: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">AI Behavior</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-slate-700">Streaming Responses</p>
                  <p className="text-xs text-slate-500">See text as it's generated for faster reading</p>
                </div>
                <button 
                  onClick={() => onUpdate({ streaming: !settings.streaming })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.streaming ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.streaming ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-slate-700">Model Engine</p>
                  <p className="text-xs text-slate-500">Select the Gemini model variant</p>
                </div>
                <select 
                  value={settings.modelName}
                  onChange={(e) => onUpdate({ modelName: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-medium focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (Complex)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="pt-8 border-t border-slate-100">
            <button className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest">
              Reset Application Data
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
