import { useState, useEffect } from 'react';
import { Clock, X, CheckCircle } from 'lucide-react';
import attendanceService from '../services/attendanceService';
import AttendanceModal from './AttendanceModal';

/**
 * AttendanceNotification - Shows reminder to check-in/check-out
 * Displays at the top of the page when user hasn't checked in/out
 */
export default function AttendanceNotification() {
  const [todayStatus, setTodayStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('check-in');
  const [loading, setLoading] = useState(true);

  const isEndOfDay = () => {
    const now = new Date();
    const hours = now.getHours();
    // Show check-out reminder after 5 PM
    return hours >= 17;
  };

  const checkTodayStatus = async () => {
    try {
      const status = await attendanceService.getTodayStatus();
      setTodayStatus(status);
      setLoading(false);

      // Reset dismissed state if showing new notification type
      if (!status.has_checked_in || (!status.has_checked_out && isEndOfDay())) {
        setDismissed(false);
      }
    } catch (error) {
      // Silently fail if user doesn't have permission or isn't an employee yet
      // This prevents blocking the UI when attendance feature is not available
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.debug('Attendance notification not available for this user');
      } else {
        console.error('Failed to check attendance status:', error);
      }
      setLoading(false);
      setTodayStatus(null); // Ensure component hides on error
    }
  };

  useEffect(() => {
    checkTodayStatus();
    // Check every 30 minutes
    const interval = setInterval(checkTodayStatus, 30 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = () => {
    setModalType('check-in');
    setShowModal(true);
  };

  const handleCheckOut = () => {
    setModalType('check-out');
    setShowModal(true);
  };

  const handleSuccess = () => {
    checkTodayStatus();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading || dismissed || !todayStatus) {
    return null;
  }

  // Don't show if user has checked in and checked out
  if (todayStatus.has_checked_in && todayStatus.has_checked_out) {
    return null;
  }

  // Show check-in notification if not checked in
  if (!todayStatus.has_checked_in) {
    return (
      <>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You haven't checked in today
                </p>
                <p className="text-sm text-yellow-700">
                  Please check in to record your attendance for today
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCheckIn}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Check In Now
              </button>
              <button
                onClick={handleDismiss}
                className="text-yellow-600 hover:text-yellow-800 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <AttendanceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          type={modalType}
        />
      </>
    );
  }

  // Show check-out notification if checked in but not checked out (and it's end of day)
  if (todayStatus.has_checked_in && !todayStatus.has_checked_out && isEndOfDay()) {
    return (
      <>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Don't forget to check out
                </p>
                <p className="text-sm text-blue-700">
                  You checked in at {new Date(todayStatus.attendance.check_in_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}. Please check out when you're done.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCheckOut}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Check Out Now
              </button>
              <button
                onClick={handleDismiss}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <AttendanceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          type={modalType}
        />
      </>
    );
  }

  return null;
}
