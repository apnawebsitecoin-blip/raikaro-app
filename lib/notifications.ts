import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Evaluated once at module load — safe, no expo-notifications involved.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

export async function configureNotificationHandler(): Promise<void> {
  // Guard BEFORE any dynamic import — the import itself must never happen
  // in Expo Go because expo-notifications registers addPushTokenListener
  // as a module-level side effect the moment the module is evaluated.
  if (IS_EXPO_GO) return;

  const Notifications = await import('expo-notifications');
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
  if (IS_EXPO_GO) return;
  if (!Device.isDevice) return;

  try {
    const Notifications = await import('expo-notifications');

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
