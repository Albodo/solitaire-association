/*
 * Moteur de jeu — Solitaire Association
 * --------------------------------------
 * Logique pure (aucun accès au DOM) : génération des donnes, règles,
 * coups légaux, solveur heuristique. Fonctionne dans le navigateur
 * (window.Moteur) et dans Node (require) pour les tests.
 */
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.Moteur = fabrique();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Hasard reproductible ---------- */

  function mulberry32(graine) {
    let a = graine >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hacher(texte) {
    let h = 2166136261 >>> 0;
    for (const c of String(texte)) {
      h ^= c.codePointAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function melanger(tab, rng) {
    for (let i = tab.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = tab[i]; tab[i] = tab[j]; tab[j] = t;
    }
    return tab;
  }

  function entre(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  /** Clé de comparaison : sans accents, sans ponctuation, minuscules. */
  function normaliser(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/œ/g, 'oe').replace(/[^a-z0-9+]/g, '');
  }

  /* ---------- Paramètres ---------- */

  const DIFFICULTES = {
    facile:    { nom: 'Facile',    categories: 4, mots: [3, 5], colonnes: 4, fondations: 3, base: 1, marge: 1.6 },
    moyen:     { nom: 'Moyen',     categories: 6, mots: [4, 6], colonnes: 5, fondations: 4, base: 1, marge: 1.35 },
    difficile: { nom: 'Difficile', categories: 8, mots: [4, 7], colonnes: 5, fondations: 4, base: 2, marge: 1.15 },
  };

  /* ---------- Catalogue ---------- */

  /** Aplati les banques en une liste de catégories avec leur thème. */
  function construireCatalogue(banques) {
    const liste = [];
    for (const theme of banques) {
      for (const cat of theme.categories) {
        liste.push({ theme: theme.id, nomTheme: theme.nom, nom: cat.nom, mots: cat.mots.slice() });
      }
    }
    return liste;
  }

  /**
   * Choisit n catégories et, pour chacune, un sous-ensemble de mots,
   * sans aucun mot (ni nom de catégorie) en double dans la donne.
   */
  function choisirCategories(catalogue, config, rng, themes) {
    const [minMots, maxMots] = config.mots;
    let pool = catalogue.filter(c => !themes || themes.length === 0 || themes.includes(c.theme));
    pool = melanger(pool.slice(), rng);
    const pris = new Set();
    const choisies = [];
    for (const cat of pool) {
      if (choisies.length >= config.categories) break;
      const cleNom = normaliser(cat.nom);
      if (pris.has(cleNom)) continue;
      const libres = melanger(cat.mots.filter(m => !pris.has(normaliser(m))), rng);
      const voulu = entre(rng, minMots, maxMots);
      if (libres.length < minMots) continue;
      const mots = libres.slice(0, Math.min(voulu, libres.length));
      pris.add(cleNom);
      mots.forEach(m => pris.add(normaliser(m)));
      choisies.push({ nom: cat.nom, theme: cat.theme, nomTheme: cat.nomTheme, mots });
    }
    return choisies;
  }

  /* ---------- Donne ---------- */

  function distribuer(categories, config, rng) {
    let id = 0;
    const cartes = [];
    categories.forEach((cat, ci) => {
      cartes.push({ id: id++, type: 'cat', cat: ci, texte: cat.nom, visible: false });
      cat.mots.forEach(m => cartes.push({ id: id++, type: 'mot', cat: ci, texte: m, visible: false }));
    });
    melanger(cartes, rng);
    const colonnes = [];
    for (let i = 0; i < config.colonnes; i++) {
      const n = config.base + i;
      const col = cartes.splice(0, n);
      if (col.length) col[col.length - 1].visible = true;
      colonnes.push(col);
    }
    return {
      categories: categories.map(c => ({ nom: c.nom, theme: c.theme, nomTheme: c.nomTheme, taille: c.mots.length, mots: c.mots.slice() })),
      colonnes,
      pioche: cartes,            // face cachée, le dessus = dernier élément
      defausse: [],              // face visible, le dessus = dernier élément
      fondations: Array.from({ length: config.fondations }, () => ({ cat: null, n: 0 })),
      terminees: [],             // indices des catégories complétées
      coups: 0,                  // coups joués
      limite: Infinity,          // coups permis
    };
  }

  function cloner(etat) {
    return {
      ...etat,
      colonnes: etat.colonnes.map(c => c.map(k => ({ ...k }))),
      pioche: etat.pioche.map(k => ({ ...k })),
      defausse: etat.defausse.map(k => ({ ...k })),
      fondations: etat.fondations.map(f => ({ ...f })),
      terminees: etat.terminees.slice(),
      coups: etat.coups,
      limite: etat.limite,
    };
  }

  /* ---------- Règles ---------- */

  /** Une suite déplaçable : même catégorie, visibles, carte-catégorie seulement à la base. */
  function suiteValide(cartes) {
    if (!cartes.length) return false;
    const cat = cartes[0].cat;
    for (let i = 0; i < cartes.length; i++) {
      const k = cartes[i];
      if (!k.visible || k.cat !== cat) return false;
      if (i > 0 && k.type !== 'mot') return false;
    }
    return true;
  }

  /** Cartes prises depuis une source, ou null si la prise est illégale. */
  function prendre(etat, source) {
    if (source.zone === 'def') {
      const k = etat.defausse[etat.defausse.length - 1];
      return k ? [k] : null;
    }
    if (source.zone === 'col') {
      const col = etat.colonnes[source.i];
      if (!col || source.idx < 0 || source.idx >= col.length) return null;
      const suite = col.slice(source.idx);
      return suiteValide(suite) ? suite : null;
    }
    return null;
  }

  function peutPoser(etat, cartes, source, dest) {
    if (!cartes || !cartes.length) return false;
    const tete = cartes[0];
    if (dest.zone === 'fond') {
      const f = etat.fondations[dest.i];
      if (!f) return false;
      if (f.cat === null) return tete.type === 'cat';
      return tete.type === 'mot' && tete.cat === f.cat;
    }
    if (dest.zone === 'col') {
      if (source.zone === 'col' && source.i === dest.i) return false;
      const col = etat.colonnes[dest.i];
      if (!col) return false;
      if (!col.length) return true;
      const haut = col[col.length - 1];
      return haut.visible && tete.type === 'mot' && haut.cat === tete.cat;
    }
    return false;
  }

  function coupLegal(etat, coup) {
    if (estTerminee(etat)) return false;
    if (coup.type === 'piocher') return etat.pioche.length > 0 || etat.defausse.length > 0;
    const cartes = prendre(etat, coup.de);
    return !!cartes && peutPoser(etat, cartes, coup.de, coup.vers);
  }

  /**
   * Applique un coup (modifie l'état). Retourne un résumé des événements
   * pour l'interface : { completee: indexCategorie|null, retournee: bool }.
   */
  function appliquer(etat, coup) {
    const ev = { completee: null, retournee: false, recyclage: false };
    etat.coups++;
    if (coup.type === 'piocher') {
      if (etat.pioche.length) {
        const k = etat.pioche.pop();
        k.visible = true;
        etat.defausse.push(k);
      } else {
        etat.pioche = etat.defausse.reverse().map(k => ({ ...k, visible: false }));
        etat.defausse = [];
        ev.recyclage = true;
      }
      return ev;
    }
    let cartes;
    if (coup.de.zone === 'def') {
      cartes = [etat.defausse.pop()];
    } else {
      const col = etat.colonnes[coup.de.i];
      cartes = col.splice(coup.de.idx);
      const haut = col[col.length - 1];
      if (haut && !haut.visible) { haut.visible = true; ev.retournee = true; }
    }
    if (coup.vers.zone === 'col') {
      etat.colonnes[coup.vers.i].push(...cartes);
    } else {
      const f = etat.fondations[coup.vers.i];
      for (const k of cartes) {
        if (k.type === 'cat') f.cat = k.cat;
        else f.n++;
      }
      const taille = etat.categories[f.cat].taille;
      if (f.n >= taille) {
        etat.terminees.push(f.cat);
        ev.completee = f.cat;
        f.cat = null; f.n = 0;
      }
    }
    return ev;
  }

  function estGagnee(etat) { return etat.terminees.length === etat.categories.length; }
  function estPerdue(etat) { return !estGagnee(etat) && etat.coups >= etat.limite; }
  function estTerminee(etat) { return estGagnee(etat) || estPerdue(etat); }
  function coupsRestants(etat) { return Math.max(0, etat.limite - etat.coups); }

  /* ---------- Coups légaux ---------- */

  function sources(etat) {
    const s = [];
    if (etat.defausse.length) s.push({ zone: 'def' });
    etat.colonnes.forEach((col, i) => {
      for (let idx = col.length - 1; idx >= 0; idx--) {
        if (!col[idx].visible) break;
        if (suiteValide(col.slice(idx))) s.push({ zone: 'col', i, idx });
        else break;
      }
    });
    return s;
  }

  function coupsLegaux(etat) {
    if (estTerminee(etat)) return [];
    const liste = [];
    for (const de of sources(etat)) {
      const cartes = prendre(etat, de);
      etat.fondations.forEach((_, i) => {
        const vers = { zone: 'fond', i };
        if (peutPoser(etat, cartes, de, vers)) liste.push({ type: 'deplacer', de, vers });
      });
      etat.colonnes.forEach((_, i) => {
        const vers = { zone: 'col', i };
        if (peutPoser(etat, cartes, de, vers)) liste.push({ type: 'deplacer', de, vers });
      });
    }
    if (etat.pioche.length || etat.defausse.length) liste.push({ type: 'piocher' });
    return liste;
  }

  /* ---------- Heuristique (solveur + indices) ---------- */

  /** Note un coup ; -Infinity = coup inutile à ignorer. */
  function noter(etat, coup) {
    if (coup.type === 'piocher') return 1;
    const cartes = prendre(etat, coup.de);
    const tete = cartes[0];
    let sousCarte = null;
    if (coup.de.zone === 'col') sousCarte = etat.colonnes[coup.de.i][coup.de.idx - 1] || null;
    const reveleCachee = !!sousCarte && !sousCarte.visible;
    const videColonne = coup.de.zone === 'col' && coup.de.idx === 0;

    if (coup.vers.zone === 'fond') {
      if (tete.type === 'cat') {
        // Poser une catégorie : bien si on voit déjà des mots qui l'attendent.
        const f = etat.fondations.filter(x => x.cat === null).length;
        return 60 + cartes.length * 5 + (reveleCachee ? 15 : 0) - (f === 1 ? 20 : 0);
      }
      return 100 + cartes.length + (reveleCachee ? 15 : 0);
    }
    // Vers une colonne
    const destVide = etat.colonnes[coup.vers.i].length === 0;
    if (coup.de.zone === 'col') {
      if (sousCarte && sousCarte.visible && sousCarte.cat === tete.cat) return -Infinity; // scinder une suite : inutile
      if (destVide && videColonne) return -Infinity;                                       // déplacer une colonne entière vers une vide
      if (destVide) return reveleCachee ? 40 : (tete.type === 'cat' ? 5 : -Infinity);
      return reveleCachee ? 50 : (videColonne ? 30 : 10);
    }
    // Depuis la défausse
    return destVide ? (tete.type === 'cat' ? 25 : 12) : 35;
  }

  function meilleurCoup(etat, rng) {
    const coups = coupsLegaux(etat);
    let meilleur = null, note = -Infinity;
    for (const c of coups) {
      let n = noter(etat, c);
      if (n === -Infinity) continue;
      if (rng) n += rng() * 20;
      if (n > note) { note = n; meilleur = c; }
    }
    return meilleur;
  }

  /** Une partie simulée ; retourne le nombre de coups si gagnée, sinon null. */
  function simuler(depart, rng, max) {
    const etat = cloner(depart);
    etat.limite = Infinity;
    let sansProgres = 0;
    const tailleCycle = () => etat.pioche.length + etat.defausse.length + 1;
    while (etat.coups < max) {
      if (estGagnee(etat)) return etat.coups;
      const c = meilleurCoup(etat, rng);
      if (!c) return null;
      appliquer(etat, c);
      if (c.type === 'piocher') {
        if (++sansProgres > tailleCycle() * 2 + 2) return null;
      } else sansProgres = 0;
    }
    return estGagnee(etat) ? etat.coups : null;
  }

  function resoudre(etat, rng, essais) {
    let meilleur = null;
    for (let i = 0; i < essais; i++) {
      const r = simuler(etat, rng, 600);
      if (r !== null && (meilleur === null || r < meilleur)) meilleur = r;
    }
    return meilleur;
  }

  /* ---------- Partie complète ---------- */

  /**
   * Crée une nouvelle partie solvable.
   * options : { banques, difficulte, themes, graine }
   */
  function nouvellePartie(options) {
    const config = DIFFICULTES[options.difficulte] || DIFFICULTES.moyen;
    const graine = options.graine != null ? hacher(options.graine) : Math.floor(Math.random() * 2 ** 32);
    const rng = mulberry32(graine);
    const catalogue = construireCatalogue(options.banques);
    let dernier = null;
    for (let tentative = 0; tentative < 40; tentative++) {
      const cats = choisirCategories(catalogue, config, rng, options.themes);
      if (cats.length < Math.min(3, config.categories)) {
        throw new Error('Pas assez de catégories dans les thèmes choisis.');
      }
      const etat = distribuer(cats, config, rng);
      const solution = resoudre(etat, rng, 40);
      dernier = etat;
      if (solution !== null) {
        etat.limite = Math.ceil(solution * config.marge) + 2;
        etat.solution = solution;
        etat.difficulte = options.difficulte;
        return etat;
      }
    }
    // Filet de sécurité : très peu probable
    dernier.limite = 999;
    dernier.difficulte = options.difficulte;
    return dernier;
  }

  function nombreEtoiles(etat) {
    if (!estGagnee(etat)) return 0;
    const reste = coupsRestants(etat) / Math.max(1, etat.limite);
    return reste >= 0.25 ? 3 : reste >= 0.1 ? 2 : 1;
  }

  return {
    DIFFICULTES, mulberry32, hacher, normaliser, construireCatalogue, choisirCategories,
    distribuer, cloner, suiteValide, prendre, peutPoser, coupLegal, appliquer,
    estGagnee, estPerdue, estTerminee, coupsRestants, coupsLegaux, noter,
    meilleurCoup, simuler, resoudre, nouvellePartie, nombreEtoiles,
  };
});
