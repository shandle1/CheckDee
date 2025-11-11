import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { gregorianToBE, beToGregorian } from '@/lib/thaiDate';

interface ThaiDateTimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export default function ThaiDateTimePicker({
  value,
  onChange,
  label = 'Due Date',
  required = false,
  error,
}: ThaiDateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const [hours, setHours] = useState(
    value ? new Date(value).getHours() : 9
  );
  const [minutes, setMinutes] = useState(
    value ? new Date(value).getMinutes() : 0
  );

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(date);
      setHours(date.getHours());
      setMinutes(date.getMinutes());
    }
  }, [value]);

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const beYear = gregorianToBE(currentMonth.getFullYear());
  const monthName = thaiMonths[currentMonth.getMonth()];

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = generateCalendarDays();

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    finalDate.setHours(hours, minutes, 0, 0);
    onChange(finalDate.toISOString());
    setShowPicker(false);
  };

  const handleClear = () => {
    onChange('');
    setShowPicker(false);
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const date = new Date(value);
    const beYear = gregorianToBE(date.getFullYear());
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${beYear} เวลา ${h}:${m}`;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && '*'}
        </label>
      )}

      {/* Input Display */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={`w-full px-4 py-2 border rounded-lg text-left flex items-center justify-between ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? formatDisplayValue() : 'เลือกวันที่และเวลา'}
        </span>
        <Calendar className="h-5 w-5 text-gray-400" />
      </button>

      <p className="text-xs text-gray-500 mt-1">
        ปฏิทินพุทธศักราช (พ.ศ.) เวลา 24 ชั่วโมง
      </p>

      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}

      {/* Calendar Picker Modal */}
      {showPicker && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />

          {/* Picker */}
          <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {monthName} {beYear}
                </div>
                <div className="text-xs text-gray-500">
                  พ.ศ. {beYear}
                </div>
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {thaiDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-600 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={!day}
                  className={`
                    aspect-square p-2 text-sm rounded-lg transition-colors
                    ${!day ? 'invisible' : ''}
                    ${isToday(day) ? 'font-bold' : ''}
                    ${
                      isSelected(day)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : isToday(day)
                        ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                        : 'hover:bg-gray-100 text-gray-900'
                    }
                  `}
                >
                  {day?.getDate()}
                </button>
              ))}
            </div>

            {/* Time Selection */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  เวลา (24 ชั่วโมง)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500">:</span>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ล้าง
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
