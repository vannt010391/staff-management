import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isSameMonth,
  isToday,
  parseISO,
  startOfYear,
  endOfYear,
  getMonth,
  getDay
} from 'date-fns';
import calendarService from '../services/calendar';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // day, week, month, year
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_all_day: true,
    color: '#3b82f6'
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let startDate, endDate;

      if (view === 'day') {
        startDate = format(currentDate, 'yyyy-MM-dd');
        endDate = format(currentDate, 'yyyy-MM-dd');
      } else if (view === 'week') {
        startDate = format(startOfWeek(currentDate), 'yyyy-MM-dd');
        endDate = format(endOfWeek(currentDate), 'yyyy-MM-dd');
      } else if (view === 'month') {
        startDate = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
        endDate = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');
      } else if (view === 'year') {
        startDate = format(startOfYear(currentDate), 'yyyy-MM-dd');
        endDate = format(endOfYear(currentDate), 'yyyy-MM-dd');
      }

      const data = await calendarService.getEventsByDateRange(startDate, endDate);
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, -1));
    else if (view === 'month') setCurrentDate(addMonths(currentDate, -1));
    else if (view === 'year') setCurrentDate(addYears(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'year') setCurrentDate(addYears(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventStart = event.start_date;
      const eventEnd = event.end_date;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const isWeekend = (date) => {
    const day = getDay(date);
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const formatEventTime = (event) => {
    if (event.is_all_day || !event.start_time) return '';
    return event.start_time.substring(0, 5); // Get HH:MM format
  };

  const openEventModal = (date = null, event = null) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        start_date: event.start_date,
        end_date: event.end_date,
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        is_all_day: event.is_all_day,
        color: event.color || '#3b82f6'
      });
    } else {
      const dateStr = format(date, 'yyyy-MM-dd');
      setFormData({
        title: '',
        description: '',
        start_date: dateStr,
        end_date: dateStr,
        start_time: '',
        end_time: '',
        is_all_day: true,
        color: '#3b82f6'
      });
    }
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      is_all_day: true,
      color: '#3b82f6'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        start_time: formData.is_all_day || !formData.start_time ? null : formData.start_time,
        end_time: formData.is_all_day || !formData.end_time ? null : formData.end_time
      };

      if (selectedEvent) {
        await calendarService.updateEvent(selectedEvent.id, submitData);
        toast.success('Event updated successfully');
      } else {
        await calendarService.createEvent(submitData);
        toast.success('Event created successfully');
      }
      closeEventModal();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await calendarService.deleteEvent(eventId);
      toast.success('Event deleted successfully');
      closeEventModal();
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <div className="space-y-2">
          {dayEvents.length === 0 ? (
            <p className="text-gray-500">No events for this day</p>
          ) : (
            dayEvents.map(event => (
              <div
                key={event.id}
                className="p-3 rounded-lg cursor-pointer hover:opacity-80"
                style={{ backgroundColor: event.color + '20', borderLeft: `4px solid ${event.color}` }}
                onClick={() => openEventModal(null, event)}
              >
                <div className="font-semibold">{event.title}</div>
                {event.description && <div className="text-sm text-gray-600">{event.description}</div>}
                {!event.is_all_day && event.start_time && (
                  <div className="text-sm text-gray-500 mt-1">
                    {event.start_time} {event.end_time && `- ${event.end_time}`}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDate, i));
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map(day => {
            const dayEvents = getEventsForDate(day);
            const isCurrentDay = isToday(day);
            const weekend = isWeekend(day);

            return (
              <div
                key={day.toString()}
                className={`p-2 min-h-[120px] ${
                  isCurrentDay ? 'bg-yellow-50' : weekend ? 'bg-red-50' : 'bg-white'
                }`}
              >
                <div className={`text-center mb-2 ${
                  isCurrentDay ? 'font-bold text-yellow-700' : weekend ? 'text-red-700' : ''
                }`}>
                  <div className="text-sm">{format(day, 'EEE')}</div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: event.color + '20', color: event.color }}
                      onClick={() => openEventModal(null, event)}
                      title={`${event.title}${formatEventTime(event) ? ` - ${formatEventTime(event)}` : ''}`}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      {formatEventTime(event) && (
                        <div className="text-[10px] opacity-80">{formatEventTime(event)}</div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => openEventModal(day)}
                  className="mt-2 text-xs text-gray-400 hover:text-blue-600 w-full text-center"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(day);
        day = addDays(day, 1);
      }
      rows.push(days);
      days = [];
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {dayNames.map((dayName, idx) => (
            <div
              key={dayName}
              className={`p-2 text-center font-semibold text-sm ${
                idx === 0 || idx === 6 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {rows.flat().map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const weekend = isWeekend(day);

            return (
              <div
                key={index}
                className={`p-2 min-h-[100px] ${
                  isCurrentDay ? 'bg-yellow-50' : weekend ? 'bg-red-50' : 'bg-white'
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}
              >
                <div className={`text-sm mb-1 ${
                  isCurrentDay
                    ? 'font-bold text-yellow-700'
                    : weekend && isCurrentMonth
                    ? 'text-red-700 font-medium'
                    : isCurrentMonth
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: event.color + '20', color: event.color }}
                      onClick={() => openEventModal(null, event)}
                      title={`${event.title}${formatEventTime(event) ? ` - ${formatEventTime(event)}` : ''}`}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      {formatEventTime(event) && (
                        <div className="text-[10px] opacity-80">{formatEventTime(event)}</div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                  )}
                </div>
                <button
                  onClick={() => openEventModal(day)}
                  className="mt-1 text-xs text-gray-400 hover:text-blue-600 w-full text-center"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(new Date(currentDate.getFullYear(), i, 1));
    }

    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map(month => {
          const monthEvents = events.filter(event => {
            const eventDate = parseISO(event.start_date);
            return getMonth(eventDate) === getMonth(month);
          });

          return (
            <div
              key={month.toString()}
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setCurrentDate(month);
                setView('month');
              }}
            >
              <h4 className="font-semibold mb-2">{format(month, 'MMMM')}</h4>
              <div className="text-sm text-gray-600">
                {monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getViewTitle = () => {
    if (view === 'day') return format(currentDate, 'MMMM d, yyyy');
    if (view === 'week') return `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`;
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'year') return format(currentDate, 'yyyy');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">My Calendar</h1>
          </div>
          <p className="text-gray-600">Manage your personal events and schedules</p>
        </div>
        <button
          onClick={() => openEventModal(currentDate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Today
            </button>
            <h2 className="text-lg font-semibold text-gray-800 ml-4">{getViewTitle()}</h2>
          </div>

          <div className="flex gap-1">
            {['day', 'week', 'month', 'year'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-lg capitalize font-medium transition-colors ${
                  view === v
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
          {view === 'day' && renderDayView()}
          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
          {view === 'year' && renderYearView()}
        </>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button onClick={closeEventModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={formData.is_all_day}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={formData.is_all_day}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_all_day}
                    onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">All day event (disable time)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4">
                {selectedEvent && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedEvent.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeEventModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
