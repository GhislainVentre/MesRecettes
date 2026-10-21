import { Alert, Platform } from 'react-native';

/** Message bloquant simple ; Alert.alert ne fait rien sur le web. */
export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
