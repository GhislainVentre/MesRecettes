import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { UpdatePrompt } from '../components/UpdatePrompt';
import { RecipesProvider } from '../context/RecipesContext';
import { UpdateProvider } from '../context/UpdateContext';
import { colors, fonts } from '../theme';

// L'écran de démarrage natif reste affiché tant que les polices chargent.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Si une police ne charge pas, on démarre quand même avec la police système.
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <RecipesProvider>
      <UpdateProvider>
        <UpdatePrompt />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/new" options={{ title: 'Nouvelle recette', presentation: 'modal' }} />
          <Stack.Screen name="recipe/[id]/index" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]/edit" options={{ title: 'Modifier', presentation: 'modal' }} />
        </Stack>
      </UpdateProvider>
    </RecipesProvider>
  );
}
