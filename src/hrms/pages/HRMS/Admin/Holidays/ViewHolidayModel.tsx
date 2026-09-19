/** @format */

import { X, Calendar as CalendarIcon, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Holiday {
  title: string;
  date: string;
  day: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  holiday: Holiday | null;
}

const ViewHolidayModal = ({ isOpen, onClose, holiday }: Props) => {
  if (!isOpen || !holiday) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* MODAL */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 text-gray-700">
            <Info size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold">Holiday Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Holiday Name</label>
            <p className="text-lg font-bold text-gray-900">{holiday.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 space-y-1">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <CalendarIcon size={14} />
                <label className="text-[10px] font-bold uppercase tracking-wider">Date</label>
              </div>
              <p className="text-sm font-bold text-gray-800 tabular-nums">
                {new Date(holiday.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock size={14} />
                <label className="text-[10px] font-bold uppercase tracking-wider">Day</label>
              </div>
              <p className="text-sm font-bold text-gray-800">{holiday.day}</p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={onClose}
              className="w-full h-11 rounded-md bg-gray-900 hover:bg-black text-white font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewHolidayModal;
