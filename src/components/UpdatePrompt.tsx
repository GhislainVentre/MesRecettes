import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useUpdates } from '../context/UpdateContext';
import { formatSize } from '../lib/updates';
import { card, colors, fonts, radius, spacing, type } from '../theme';
import { Button } from './Button';

/** Fenêtre qui propose la nouvelle version, la télécharge puis lance son installation. */
export function UpdatePrompt() {
  const { proposed, install, installUpdate, snooze } = useUpdates();
  if (!proposed) return null;
  const busy = install.step === 'downloading' || install.step === 'installing';
  const percent = install.step === 'downloading' && install.progress !== null ? Math.round(install.progress * 100) : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={busy ? undefined : snooze}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.icon}>
            <Ionicons name="cloud-download-outline" size={30} color={colors.primary} />
          </View>
          <Text style={type.title}>Nouvelle version</Text>
          <Text style={type.caption}>
            {proposed.version}
            {proposed.sizeBytes ? ` · ${formatSize(proposed.sizeBytes)}` : ''}
          </Text>

          {proposed.notes ? (
            <ScrollView style={styles.notes} contentContainerStyle={styles.notesContent}>
              <Text style={type.label}>Nouveautés</Text>
              <Text style={type.body}>{proposed.notes}</Text>
            </ScrollView>
          ) : null}

          {install.step === 'downloading' ? (
            <View style={styles.progress}>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${percent ?? 5}%` }]} />
              </View>
              <Text style={type.caption}>{percent !== null ? `Téléchargement… ${percent} %` : 'Téléchargement…'}</Text>
            </View>
          ) : null}
          {install.step === 'installing' ? <Text style={type.caption}>Ouverture de l’installation…</Text> : null}
          {install.step === 'error' ? <Text style={styles.error}>{install.message}</Text> : null}

          <Text style={styles.hint}>
            La première fois, Android demande d’autoriser MesRecettes à installer des applications : acceptez, puis
            confirmez l’installation. Vos recettes sont conservées.
          </Text>

          <Button
            label={install.step === 'error' ? 'Réessayer' : 'Mettre à jour'}
            icon="download-outline"
            size="lg"
            onPress={installUpdate}
            disabled={busy}
          />
          <Button label="Plus tard" variant="ghost" onPress={snooze} disabled={busy} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  sheet: { ...card, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md, maxHeight: '90%' },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notes: { maxHeight: 180, backgroundColor: colors.surface, borderRadius: radius.md },
  notesContent: { padding: spacing.md, gap: spacing.xs },
  progress: { gap: spacing.xs },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.primaryLight, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  error: { ...type.caption, color: colors.danger },
  hint: { ...type.caption, fontFamily: fonts.body },
});
