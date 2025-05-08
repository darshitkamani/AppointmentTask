import moment from 'moment';
import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import PushNotification, {Importance} from 'react-native-push-notification';

export async function requestNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
        showPermissionAlert();
      }
    } catch (err) {
      console.warn(err);
    }
  }
}

function showPermissionAlert() {
  Alert.alert(
    'Permission Required',
    'To receive reminders, please allow notification permission from settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => openAppSettings(),
      },
    ],
    {cancelable: true},
  );
}

function openAppSettings() {
  Linking.openSettings().catch(() => {
    console.warn('Unable to open app settings');
  });
}

export const REMINDER_CHANNEL_IDS = {
  ONE_DAY_BEFORE: 'ONE_DAY_BEFORE',
  TWO_HOURS_BEFORE: 'TWO_HOURS_BEFORE',
  CANCEL: 'CANCEL',
};
export const createReminderChannel = ({
  channelId,
}: {
  channelId: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    PushNotification.createChannel(
      {
        channelId: channelId,
        channelName: 'Appointment Reminders',
        channelDescription: 'Notifications for appointment reminders',
        importance: Importance.HIGH,
        vibrate: true,
      },
      created => {
        console.log(`createChannel returned '${created}'`);
        resolve();
      },
    );
  });
};
export const scheduleReminderNotifications = async ({
  date,
  message,
  title,
  channelId,
}: {
  message: string;
  date: Date;
  title: string;
  channelId: string;
}): Promise<void> => {
  const oneDayChannel = `${REMINDER_CHANNEL_IDS.ONE_DAY_BEFORE}-${channelId}`;
  const twoHourChannel = `${REMINDER_CHANNEL_IDS.TWO_HOURS_BEFORE}-${channelId}`;

  const now = new Date();

  const oneDayBefore = moment(date).subtract(1, 'day').toDate();
  if (oneDayBefore > now) {
    await createReminderChannel({channelId: oneDayChannel});
    PushNotification.localNotificationSchedule({
      message: `Reminder: Your appointment is scheduled for tomorrow at ${moment(
        date,
      ).format('hh:mm A')}.`,
      title: title,
      date: oneDayBefore,
      allowWhileIdle: false,
      channelId: oneDayChannel,
      repeatTime: 1,
    });
  } else {
    console.log('Skipped one-day reminder: time is in the past');
  }

  const twoHoursBefore = moment(date).subtract(2, 'hours').toDate();
  if (twoHoursBefore > now) {
    await createReminderChannel({channelId: twoHourChannel});
    PushNotification.localNotificationSchedule({
      message: `Reminder: Your appointment is in 2 hours at ${moment(
        date,
      ).format('hh:mm A')}.`,
      title: title,
      date: twoHoursBefore,
      allowWhileIdle: false,
      channelId: twoHourChannel,
      repeatTime: 1,
    });
  } else {
    console.log('Skipped two-hours reminder: time is in the past');
  }
};

export const cancelReminderNotifications = async (
  channelId: number,
  time?: string,
  isRescheduled: boolean = false,
): Promise<void> => {
  PushNotification.cancelLocalNotification(
    `${REMINDER_CHANNEL_IDS.ONE_DAY_BEFORE}-${channelId}`,
  );
  PushNotification.cancelLocalNotification(
    `${REMINDER_CHANNEL_IDS.TWO_HOURS_BEFORE}-${channelId}`,
  );

  if (isRescheduled && time) {
    const cancelChannel = `${REMINDER_CHANNEL_IDS.CANCEL}-${channelId}`;
    await createReminderChannel({channelId: cancelChannel});
    PushNotification.localNotificationSchedule({
      message: `Your appointment scheduled for ${time} has been cancelled. Please reschedule as needed.`,
      title: 'Appointment Cancelled',
      date: moment().toDate(),
      allowWhileIdle: false,
      channelId: cancelChannel,
      repeatTime: 1,
    });
  }
};
