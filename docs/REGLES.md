# Règles et conception

## But

Compléter toutes les catégories de la donne avant d'épuiser ses coups.

## Le matériel

- **Cartes-catégories** (bleues) : le nom de la catégorie et le nombre de mots à trouver.
- **Cartes-mots** (crème) : un mot qui appartient à une seule catégorie de la donne.
- **Fondations** (cases du haut) : 3 ou 4 selon la difficulté — moins que le nombre de
  catégories, d'où le casse-tête.
- **Tableau** : 4 ou 5 colonnes; seule la carte du dessus est visible au départ.
- **Pioche / défausse** (en bas, sous le pouce).

## Les coups (chacun coûte 1 coup)

| Action | Condition |
|---|---|
| Poser une carte-catégorie sur une fondation | La fondation est vide |
| Poser un mot (ou une suite de mots) sur une fondation | La fondation porte sa catégorie |
| Poser un mot **ou sa carte-catégorie** sur une colonne | La carte du dessus est un mot de la même catégorie |
| Poser n'importe quelle carte ou suite sur une colonne vide | — |
| Déplacer une suite | Cartes visibles, même catégorie; la carte-catégorie seulement **par-dessus** |
| Ouvrir une fondation avec un groupe | Un groupe « mots + catégorie par-dessus » part d'un seul coup |

Rien ne se pose sur une carte-catégorie dans les colonnes. Elle affiche le nombre de
mots regroupés sous elle sur le total (ex. **Condiments 3/4**).
| Piocher | Tire une carte; pioche vide → la défausse est remise dans la pioche |

Retourner une carte cachée est gratuit (automatique).
Quand une fondation reçoit tous ses mots, la catégorie est **complétée** et la case se libère.

## Difficultés

| | Catégories | Mots/catégorie | Colonnes | Fondations | Marge de coups |
|---|---|---|---|---|---|
| Facile | 4 | 3–5 | 4 | 3 | +60 % |
| Moyen | 6 | 4–6 | 5 | 4 | +35 % |
| Difficile | 8 | 4–7 | 5 | 4 | +15 % |

## Donnes toujours solvables

À la génération, un solveur heuristique (parties simulées avec un peu de hasard, 40 essais)
cherche une solution. Si aucune n'est trouvée, on redistribue. La limite de coups vaut
`solution trouvée × marge + 2`. Le défi du jour utilise une graine basée sur la date
(`defi-AAAA-MM-JJ`), donc tout le monde a la même donne.

## Étoiles

- ★★★ : au moins 25 % des coups restants
- ★★ : au moins 10 %
- ★ : réussi de justesse

## Interface

- **Glisser-déposer** : on traîne une carte (et celles par-dessus si elles forment une suite)
  vers une colonne ou une fondation. Les destinations permises s'allument en jaune; la
  cible retenue est celle que la carte recouvre le plus (tolérant au doigt).
- En secours : toucher une carte, puis sa destination.
- Toucher deux fois la même carte l'envoie au meilleur endroit possible (une carte-catégorie
  emporte les mots regroupés sous elle).
- Boutons : annuler (illimité), indice (gratuit), menu (recommencer la donne, accueil).

## Pistes pour la suite

- Animations de déplacement des cartes.
- Mode hors ligne complet (service worker) pour installer comme appli.
- Banques plus grosses; niveaux thématiques (ex. « 100 % sacres »).
- Écran d'archives des défis passés.
