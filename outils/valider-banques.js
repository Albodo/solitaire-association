// Vérifie les banques de mots : node outils/valider-banques.js
// Signale : catégories trop petites, doublons (même dans d'autres catégories), textes trop longs.
const fs = require('fs');
const path = require('path');
const { normaliser } = require('../js/moteur.js');

const window = {};
new Function('window', fs.readFileSync(path.join(__dirname, '../data/banques.js'), 'utf8'))(window);

const LONGUEUR_MAX = 24;
const vus = new Map();
let erreurs = 0, avertissements = 0, nbCats = 0, nbMots = 0;

for (const theme of window.BANQUES) {
  if (!theme.id || !theme.nom) { console.error('✗ Thème sans id ou nom'); erreurs++; }
  for (const cat of theme.categories) {
    nbCats++;
    const ou = `${theme.nom} › ${cat.nom}`;
    if (cat.mots.length < 4) { console.error(`✗ ${ou} : seulement ${cat.mots.length} mots (min. 4)`); erreurs++; }
    for (const texte of [cat.nom, ...cat.mots]) {
      if (texte !== cat.nom) nbMots++;
      const cle = normaliser(texte);
      if (vus.has(cle)) { console.warn(`⚠ « ${texte} » apparaît dans ${ou} et ${vus.get(cle)}`); avertissements++; }
      else vus.set(cle, ou);
      if (texte.length > LONGUEUR_MAX) { console.warn(`⚠ ${ou} : « ${texte} » est long (${texte.length} car.)`); avertissements++; }
    }
  }
}
console.log(`\n${window.BANQUES.length} thèmes, ${nbCats} catégories, ${nbMots} mots — ${erreurs} erreur(s), ${avertissements} avertissement(s).`);
process.exit(erreurs ? 1 : 0);
