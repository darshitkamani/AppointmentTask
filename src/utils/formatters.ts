import moment from 'moment';

export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hoursNum = parseInt(hours, 10);

  const period = hoursNum >= 12 ? 'PM' : 'AM';
  const hours12 = hoursNum % 12 || 12;

  return `${hours12}:${minutes} ${period}`;
};

export const formatAppointmentDateTime = (
  dateString: string,
  timeString: string,
): string => {
  const date = new Date(dateString);
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(timeString);

  return `${formattedDate} at ${formattedTime}`;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

export const getRelativeTimeDescription = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';

  const diffTime = date.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return `In ${diffDays} days`;

  return formatDate(date);
};

export const combineDateAndTime = (
  dateString: string,
  timeString: string,
): Date => {
  const date = new Date(dateString);
  const [hours, minutes] = timeString.split(':');

  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return date;
};

export const isUpcomingEvent = (eventDateString: string): boolean => {
  const eventDate = moment(eventDateString, 'ddd, MMM D, YYYY [at] h:mm A');

  const currentDate = moment();

  return eventDate.isAfter(currentDate);
};
