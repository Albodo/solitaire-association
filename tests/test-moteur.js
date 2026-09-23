// Tests du moteur : node tests/test-moteur.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const M = require('../js/moteur.js');

// Charger les banques (fichier navigateur qui définit window.BANQUES)
const window = {};
new Function('window', fs.readFileSync(path.join(__dirname, '../data/banques.js'), 'utf8'))(window);
const banques = window.BANQUES;

let ok = 0;
function test(nom, fn) { fn(); ok++; console.log('✓', nom); }

test('suiteValide', () => {
  const v = (type, cat) => ({ type, cat, visible: true, texte: 'x' });
  assert(M.suiteValide([v('mot', 0), v('mot', 0), v('cat', 0)]));   // catégorie par-dessus
  assert(!M.suiteValide([v('cat', 0), v('mot', 0)]));               // catégorie dessous : interdit
  assert(!M.suiteValide([v('mot', 0), v('mot', 1)]));
});

test('rien ne se pose sur une carte-catégorie', () => {
  const v = (type, cat) => ({ type, cat, visible: true, texte: 'x' });
  const e = { colonnes: [[v('cat', 0)], [v('mot', 0)]], fondations: [{ cat: null, n: 0 }, { cat: 0, n: 0 }], defausse: [], categories: [{ taille: 2 }] };
  assert(!M.peutPoser(e, [v('mot', 0)], { zone: 'def' }, { zone: 'col', i: 0 }));
  assert(M.peutPoser(e, [v('cat', 0)], { zone: 'col', i: 0 }, { zone: 'col', i: 1 }));
  assert(M.peutPoser(e, [v('mot', 0), v('cat', 0)], { zone: 'col', i: 1 }, { zone: 'fond', i: 0 }));
  assert(!M.peutPoser(e, [v('mot', 0), v('cat', 0)], { zone: 'col', i: 1 }, { zone: 'fond', i: 1 }));
  assert.strictEqual(M.motsSous([v('mot', 0), v('mot', 0), v('cat', 0)], 2), 2);
});

test('parties déterministes avec une graine', () => {
  const a = M.nouvellePartie({ banques, difficulte: 'moyen', graine: '2026-09-23' });
  const b = M.nouvellePartie({ banques, difficulte: 'moyen', graine: '2026-09-23' });
  assert.deepStrictEqual(a.colonnes, b.colonnes);
  assert.strictEqual(a.limite, b.limite);
});

for (const diff of Object.keys(M.DIFFICULTES)) {
  test(`${diff} : 30 donnes générées, solvables, sans doublons`, () => {
    const t0 = Date.now();
    let sommeLimite = 0, sommeCartes = 0;
    for (let i = 0; i < 30; i++) {
      const e = M.nouvellePartie({ banques, difficulte: diff, graine: diff + i });
      assert(e.limite < 999, 'donne non résolue');
      const toutes = [...e.colonnes.flat(), ...e.pioche];
      const cles = toutes.map(k => M.normaliser(k.texte));
      assert.strictEqual(new Set(cles).size, cles.length, 'doublon dans la donne');
      assert.strictEqual(toutes.length, e.categories.reduce((s, c) => s + c.taille + 1, 0));
      // Le solveur rejoue et gagne sous la limite
      const r = M.resoudre(e, M.mulberry32(i + 1), 60);
      assert(r !== null);
      sommeLimite += e.limite; sommeCartes += toutes.length;
    }
    console.log(`   cartes moy. ${(sommeCartes / 30).toFixed(1)}, limite moy. ${(sommeLimite / 30).toFixed(1)}, ${((Date.now() - t0) / 30).toFixed(0)} ms/donne`);
  });
}

test('filtre par thème', () => {
  const e = M.nouvellePartie({ banques, difficulte: 'facile', themes: ['jurons', 'villes'], graine: 'x' });
  assert(e.categories.every(c => ['jurons', 'villes'].includes(c.theme)));
});

test('une partie jouée par le solveur respecte la limite', () => {
  const e = M.nouvellePartie({ banques, difficulte: 'moyen', graine: 'jeu' });
  const rng = M.mulberry32(7);
  let gagne = false;
  for (let essai = 0; essai < 60 && !gagne; essai++) {
    const s = M.cloner(e);
    while (!M.estTerminee(s)) {
      const c = M.meilleurCoup(s, rng);
      if (!c) break;
      assert(M.coupLegal(s, c));
      M.appliquer(s, c);
    }
    gagne = M.estGagnee(s);
  }
  assert(gagne);
});

console.log(`\n${ok} tests réussis`);
