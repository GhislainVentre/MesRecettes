# MesRecettes 🍲

Application Android pour noter ses recettes de cuisine et les retrouver en cuisinant.

## Fonctionnalités

- **Mes recettes** : liste triée (favoris d’abord), recherche sans accents dans le titre, les ingrédients et les notes, filtres par catégorie et favoris.
- **Ajout et modification** : nom, catégorie (apéritif, entrée, plat, dessert, boisson, sauce, autre), photo prise ou choisie dans la galerie, nombre de personnes, temps de préparation et de cuisson, ingrédients et étapes (une ligne chacun), notes.
- **Import depuis un site** : collez l’adresse d’une recette (Marmiton, 750g, Cuisine AZ… tout site qui publie ses recettes au format schema.org) pour pré-remplir le formulaire, photo comprise ; il ne reste qu’à vérifier et enregistrer.
- **Fiche recette** : quantités recalculées quand on change le nombre de personnes, ingrédients et étapes à cocher au fil de la préparation, écran qui reste allumé.
- **Mises à jour** : à chaque lancement, l’application regarde la dernière version publiée dans les Releases GitHub et propose de la télécharger et de l’installer. Les recettes sont conservées.

Les données restent sur le téléphone (AsyncStorage) et les photos sont copiées dans le dossier de l’application.

## Installer la première fois

1. Sur le téléphone, ouvrir la page [Releases](https://github.com/GhislainVentre/MesRecettes/releases/latest) et télécharger `MesRecettes.apk`.
2. Ouvrir le fichier téléchargé. Android demande d’autoriser le navigateur (ou l’application Fichiers) à installer des applications : accepter, puis « Installer ».
3. Les versions suivantes sont proposées directement dans l’application au démarrage.

## Publier une version

Chaque fusion dans `main` compile l’APK (workflow « Android APK ») et publie une Release `build-N`. Le numéro de compilation sert de versionCode : l’application le compare à la dernière Release pour savoir s’il y a une mise à jour. On peut aussi lancer le workflow à la main (« Run workflow »).

## Démarrer

```bash
npm install
npm start        # puis scanner le QR code avec Expo Go, ou touche a / w
```

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
```

## Structure

- `src/app/` : écrans (Expo Router)
- `src/components/` : formulaire, photo, boutons, fenêtre de mise à jour
- `src/context/` : recettes et mises à jour
- `src/lib/recipes.ts` : recherche, durées, adaptation des quantités
- `src/lib/updates.ts` : lecture des Releases GitHub
