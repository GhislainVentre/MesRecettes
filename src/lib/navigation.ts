import { router } from 'expo-router';

/** Revient en arrière, ou à l'accueil quand il n'y a pas d'écran précédent (lien profond, rechargement web). */
export function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
