import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.7,
};

const PHOTOS_DIR = 'photos';

export type PhotoSource = 'camera' | 'library';

export type PhotoResult = { uri: string } | { error: string } | null;

/** Ouvre l'appareil photo ou la galerie. Renvoie null si l'utilisateur annule. */
export async function pickPhoto(source: PhotoSource): Promise<PhotoResult> {
  // La galerie passe par le sélecteur du système et n'a pas besoin de permission.
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return { error: "L'accès à l'appareil photo a été refusé. Autorisez-le dans les réglages du téléphone." };
    }
  }
  let result: ImagePicker.ImagePickerResult;
  try {
    result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  } catch {
    return { error: "Impossible d'ouvrir la photo. Réessayez." };
  }
  if (result.canceled || result.assets.length === 0) return null;
  return persistPhoto(result.assets[0].uri);
}

/**
 * Sur le web, le sélecteur renvoie une URL `blob:` qui meurt au rechargement :
 * on réduit l'image et on la garde en data URI (quelques dizaines de Ko).
 */
async function persistWebPhoto(uri: string): Promise<PhotoResult> {
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image'));
      img.src = uri;
    });
    const MAX = 1024;
    const scale = Math.min(1, MAX / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { uri: canvas.toDataURL('image/jpeg', 0.8) };
  } catch {
    return { error: "Impossible de lire cette image." };
  }
}

function photosDirectory(): Directory {
  const dir = new Directory(Paths.document, PHOTOS_DIR);
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/**
 * Copie la photo dans le dossier documents de l'application (les fichiers du
 * sélecteur sont temporaires) et renvoie un chemin relatif `photos/<nom>` :
 * le dossier documents peut changer d'emplacement à la mise à jour de l'app.
 */
async function persistPhoto(uri: string): Promise<PhotoResult> {
  if (Platform.OS === 'web') return persistWebPhoto(uri);
  try {
    const match = /\.(jpe?g|png|webp|heic|gif)$/i.exec(uri.split('?')[0]);
    const extension = match ? match[1].toLowerCase() : 'jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;
    const target = new File(photosDirectory(), name);
    new File(uri).copySync(target);
    return { uri: `${PHOTOS_DIR}/${name}` };
  } catch {
    // Mieux vaut le dire que de garder un fichier temporaire que le système effacera.
    return { error: "La photo n'a pas pu être enregistrée. Réessayez." };
  }
}

/** Transforme le chemin enregistré en URI affichable par <Image>. */
export function resolvePhotoUri(uri: string | null): string | null {
  if (!uri) return null;
  if (Platform.OS === 'web') return uri;
  const name = managedName(uri);
  if (!name) return uri;
  try {
    return new File(Paths.document, PHOTOS_DIR, name).uri;
  } catch {
    return null;
  }
}

/** Nom du fichier si la photo est gérée par l'app (chemin relatif ou ancienne URI absolue). */
function managedName(uri: string): string | null {
  const match = /(?:^|\/)photos\/([^/?#]+)$/.exec(uri);
  return match ? match[1] : null;
}

/** Supprime une photo copiée par l'application. */
export function deletePhoto(uri: string | null): void {
  if (!uri || Platform.OS === 'web') return;
  const name = managedName(uri);
  if (!name) return;
  try {
    const file = new File(Paths.document, PHOTOS_DIR, name);
    if (file.exists) file.delete();
  } catch {
    // La photo a déjà disparu : rien à faire.
  }
}
