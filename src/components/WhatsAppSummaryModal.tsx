import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { shareToWhatsApp } from '../utils/formatters';
import {
  X,
  MessageSquare,
  Copy,
  Check,
  FileText,
  AlignLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface WhatsAppSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date?: string;
}

export const WhatsAppSummaryModal: React.FC<WhatsAppSummaryModalProps> = ({
  isOpen,
  onClose,
  date,
}) => {
  const { generateDailyWhatsAppSummary, generateFullDailyWhatsAppSummary, selectedDate } = useBusiness();
  const [selectedType, setSelectedType] = useState<'short' | 'full'>('short');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetDate = date || selectedDate;
  const shortText = generateDailyWhatsAppSummary(targetDate);
  const fullText = generateFullDailyWhatsAppSummary(targetDate);
  const activeText = selectedType === 'short' ? shortText : fullText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSend = () => {
    shareToWhatsApp(activeText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-neutral-900">
                Share Daily Summary
              </h3>
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                දෛනික මුදල් සාරාංශය යවන්න
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-none">
          {/* Options Selection */}
          <div className="grid grid-cols-2 gap-3">
            {/* Short Option Card */}
            <button
              type="button"
              onClick={() => setSelectedType('short')}
              className={`text-left p-3.5 rounded-2xl border-2 transition flex flex-col gap-1.5 ${
                selectedType === 'short'
                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-sm'
                  : 'border-neutral-200/90 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlignLeft size={16} className={selectedType === 'short' ? 'text-emerald-700' : 'text-neutral-400'} />
                <span className="font-extrabold text-xs sm:text-sm">Short Summary</span>
              </div>
              <span className="text-[11px] font-bold text-neutral-600 Sinhala font">කෙටි සාරාංශය</span>
              <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                Opening cash, Aiya transfers, and closing cash hand book table only.
              </p>
            </button>

            {/* Full Option Card */}
            <button
              type="button"
              onClick={() => setSelectedType('full')}
              className={`text-left p-3.5 rounded-2xl border-2 transition flex flex-col gap-1.5 ${
                selectedType === 'full'
                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-sm'
                  : 'border-neutral-200/90 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} className={selectedType === 'full' ? 'text-emerald-700' : 'text-neutral-400'} />
                <span className="font-extrabold text-xs sm:text-sm">Full Summary</span>
              </div>
              <span className="text-[11px] font-bold text-neutral-600 Sinhala">සම්පූර්ණ සාරාංශය</span>
              <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                Includes lorry trips by material, shop fuel sales, worker advances, credit details and notes.
              </p>
            </button>
          </div>

          {/* Message Live Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Info size={12} />
                <span>Message Preview ({selectedType === 'short' ? 'Short' : 'Full'})</span>
              </span>
              <span className="text-[10px] text-neutral-400 italic">දිනය: {targetDate}</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 text-xs font-mono text-slate-800 max-h-[220px] overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
              {activeText}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/60 flex flex-col gap-2">
          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md hover:shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <MessageSquare size={18} className="text-emerald-200" />
            <span>Send to WhatsApp (WhatsApp වෙත යවන්න)</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-extrabold rounded-xl transition active:scale-[0.98] flex items-center justify-center gap-2 text-xs"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard! (පිටපත් විය)</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-neutral-400" />
                <span>Copy Summary Message (සටහන පිටපත් කරන්න)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
