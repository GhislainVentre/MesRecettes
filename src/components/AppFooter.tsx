import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useUpdates, type CheckResult } from '../context/UpdateContext';
import { spacing, type } from '../theme';
import { Button } from './Button';

const RESULT_TEXT: Record<Exclude<CheckResult, 'available'>, string> = {
  'up-to-date': 'Vous avez la dernière version.',
  error: 'Vérification impossible pour le moment (pas de connexion ?).',
  unsupported: 'Les mises à jour se font depuis l’APK installé sur le téléphone.',
};

/** Pied de l'accueil : recherche de mise à jour et numéro de version. */
export function AppFooter() {
  const { installedVersion, checkNow } = useUpdates();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function check() {
    setChecking(true);
    setResult(null);
    const outcome = await checkNow();
    setChecking(false);
    // Une version plus récente ouvre sa propre fenêtre.
    if (outcome !== 'available') setResult(RESULT_TEXT[outcome]);
  }

  return (
    <View style={styles.footer}>
      {Platform.OS === 'android' ? (
        <Button label={checking ? 'Recherche…' : 'Rechercher une mise à jour'} icon="refresh" variant="ghost" onPress={check} disabled={checking} />
      ) : null}
      {result ? <Text style={[type.caption, styles.center]}>{result}</Text> : null}
      <Text style={[type.caption, styles.center]}>{installedVersion ? `MesRecettes ${installedVersion}` : 'MesRecettes'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { gap: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.md },
  center: { textAlign: 'center' },
});
