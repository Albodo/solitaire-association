# Guide des banques de mots

Les mots sont dans `data/banques.js`. Chaque thème a un `id`, un `nom` et des `categories` :

```js
{
  id: 'villes',
  nom: 'Villes du Québec',
  categories: [
    { nom: 'Grandes villes', mots: ['Montréal', 'Québec', 'Laval', 'Gatineau', ...] },
  ],
}
```

À chaque partie, le jeu pige des catégories puis **quelques mots** de chacune
(3 à 7 selon la difficulté). Plus une catégorie a de mots, plus les parties varient.

## Règles d'écriture

1. **Québec d'abord.** Titres de films tels que sortis au Québec (*Histoire de jouets*,
   *Trouver Nemo*, *La Matrice*), parlure d'ici (gougounes, bobettes, coton ouaté).
   Le cinéma peut être international; la musique est franco/québécoise.
2. **Au moins 4 mots** par catégorie, idéalement 7 à 10.
3. **Aucune ambiguïté.** Un mot ne doit pas pouvoir aller dans deux catégories.
   Le générateur bloque les doublons exacts, mais pas les sens voisins :
   par exemple on a retiré « Estrie » des régions parce qu'il existe une catégorie
   « Cantons-de-l'Est », et « Mercure » est seulement dans les planètes.
4. **Court.** 24 caractères maximum (noms de catégories compris); les cartes font
   environ 70 px de large sur un téléphone.
5. Majuscule initiale, accents corrects, pas de point final.

## Vérifier

```bash
node outils/valider-banques.js
```

Signale les catégories trop petites (erreur), les doublons entre catégories et les
textes trop longs (avertissements).

## Ajouter un thème

Ajoute un objet dans `window.BANQUES`. Il apparaît automatiquement dans la fenêtre
« Thèmes ». Donne-lui au moins 3 catégories pour qu'il soit jouable seul en Facile
(4 catégories requises pour une partie Facile complète avec ce seul thème).
