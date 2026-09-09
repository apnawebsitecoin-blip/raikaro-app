import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export function configureNotificationHandler() {
  // setNotificationHandler internally calls addPushTokenListener, which is
  // not supported in Expo Go since SDK 53 and will crash the app.
  if (Constants.executionEnvironment === 'storeClient') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(userId: string): Promise<void> {
  // Expo Go dropped remote push support in SDK 53 — skip silently.
  // Use a dev build (npx expo run:ios / run:android) to test push end-to-end.
  if (Constants.executionEnvironment === 'storeClient') return;
  if (!Device.isDevice) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Raikaro',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;
    if (!token) return;

    await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
  } catch {
    // Never let a push registration failure crash the app
  }
}
