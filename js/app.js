/*
 * Interface — Solitaire Association
 * Rendu du plateau, glisser-déposer (et toucher-toucher en secours),
 * sauvegarde locale et statistiques.
 */
(function () {
  'use strict';

  const M = window.Moteur;
  const BANQUES = window.BANQUES;
  const $ = (s) => document.querySelector(s);

  /* ---------- Stockage local (tolérant aux erreurs) ---------- */

  const stock = {
    lire(cle, defaut) {
      try { const v = localStorage.getItem('sa:' + cle); return v ? JSON.parse(v) : defaut; }
      catch (e) { return defaut; }
    },
    ecrire(cle, valeur) {
      try { localStorage.setItem('sa:' + cle, JSON.stringify(valeur)); } catch (e) { /* ignoré */ }
    },
    effacer(cle) {
      try { localStorage.removeItem('sa:' + cle); } catch (e) { /* ignoré */ }
    },
  };

  const reglages = Object.assign(
    { difficulte: 'moyen', themes: BANQUES.map(t => t.id) },
    stock.lire('reglages', {})
  );
  // Thèmes ajoutés depuis la dernière visite : cochés d'office.
  const idsThemes = BANQUES.map(t => t.id);
  const connus = reglages.connus || ['politique', 'culture-pop', 'science', 'techno', 'cinema', 'geographie', 'jurons', 'villes', 'musique'];
  idsThemes.filter(id => !connus.includes(id) && !reglages.themes.includes(id)).forEach(id => reglages.themes.push(id));
  reglages.themes = reglages.themes.filter(id => idsThemes.includes(id));
  reglages.connus = idsThemes;
  stock.ecrire('reglages', reglages);

  const stats = Object.assign(
    { jouees: 0, gagnees: 0, serie: 0, meilleureSerie: 0, etoiles: 0, defis: {} },
    stock.lire('stats', {})
  );

  /* ---------- État de la session ---------- */

  let etat = null;          // état du moteur
  let depart = null;        // copie de la donne initiale (pour recommencer)
  let mode = null;          // { type: 'defi'|'libre', date? }
  let historique = [];      // états précédents (annuler)
  let selection = null;     // { zone, i, idx }
  let dispo = {};           // mesures de mise en page

  /* ---------- Utilitaires ---------- */

  function dateDuJour() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function dateLisible(iso) {
    const [a, m, j] = iso.split('-').map(Number);
    return new Date(a, m - 1, j).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function echapper(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /** Taille de police pour qu'aucun mot ne soit coupé au milieu. */
  function styleTexte(texte, facteur) {
    const base = dispo.police * (facteur || 1);
    const plusLongMot = Math.max(...String(texte).split(/[\s]/).map(m => m.length));
    const largeurUtile = Math.min(dispo.l, 70) - 12;
    let taille = Math.min(base, largeurUtile / (plusLongMot * 0.66));
    if (texte.length > 24) taille = Math.min(taille, base * 0.85);
    // Trop petit? On garde une taille lisible et on permet la césure.
    if (taille < 10) return ` class="txt coupe" style="font-size:10px"`;
    return ` class="txt" style="font-size:${taille.toFixed(1)}px"`;
  }

  /** Césure approximative à la française (trait d'union conditionnel entre syllabes). */
  const V = 'aeiouyàâäéèêëîïôöûùüœ';
  const reCesure = new RegExp(`([${V}])([^${V}\\s'’-])(?=[${V}])`, 'gi');
  const reCesure2 = new RegExp(`([${V}])([^${V}\\s'’&#;-])([^${V}\\s'’&#;-])(?=[${V}])`, 'gi');
  function cesurer(html) {
    return html.split(' ').map(m => m.length > 7
      ? m.replace(reCesure2, (t, a, b, c) => (/^(ch|ph|th|gn)$/i.test(b + c) || /[lr]/i.test(c)) ? t : a + b + '\u00AD' + c)
         .replace(reCesure, '$1\u00AD$2')
      : m).join(' ');
  }

  function texteCarte(texte, facteur) {
    const st = styleTexte(texte, facteur);
    const html = echapper(texte);
    return `<span${st}>${st.includes('coupe') ? cesurer(html) : html}</span>`;
  }

  let minuteurToast = null;
  function toast(message, neutre) {
    const t = $('#toast');
    t.textContent = message;
    t.classList.toggle('neutre', !!neutre);
    t.classList.add('visible');
    clearTimeout(minuteurToast);
    minuteurToast = setTimeout(() => t.classList.remove('visible'), 1800);
  }

  function vibrer(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignoré */ } }

  /* ---------- Écrans ---------- */

  function montrer(id) {
    document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('actif', e.id === id));
    if (id === 'ecran-jeu') requestAnimationFrame(rendre);
    if (id === 'ecran-accueil') majAccueil();
  }

  function majAccueil() {
    const aujourdhui = dateDuJour();
    const fait = stats.defis[aujourdhui];
    $('#defi-date').textContent = dateLisible(aujourdhui) + (fait ? (fait.gagne ? ' · réussi ✓' : ' · tenté') : '');
    const sauvegarde = stock.lire('partie', null);
    $('#btn-continuer').hidden = !(sauvegarde && sauvegarde.etat && !M.estTerminee(sauvegarde.etat));
    document.querySelectorAll('[data-diff]').forEach(b =>
      b.setAttribute('aria-checked', String(b.dataset.diff === reglages.difficulte)));
  }

  /* ---------- Démarrer / sauvegarder ---------- */

  function demarrer(nouveauMode) {
    mode = nouveauMode;
    try {
      if (mode.type === 'defi') {
        etat = M.nouvellePartie({ banques: BANQUES, difficulte: 'moyen', graine: 'defi-' + mode.date });
      } else {
        etat = M.nouvellePartie({ banques: BANQUES, difficulte: reglages.difficulte, themes: reglages.themes });
      }
    } catch (e) {
      toast('Choisis plus de thèmes pour jouer.', true);
      return;
    }
    depart = M.cloner(etat);
    historique = [];
    selection = null;
    sauvegarder();
    montrer('ecran-jeu');
    $('#aide').textContent = 'Glisse une carte vers sa destination. Touche deux fois pour l\'envoyer toute seule.';
  }

  function sauvegarder() {
    stock.ecrire('partie', { etat, depart, mode });
  }

  function reprendre() {
    const s = stock.lire('partie', null);
    if (!s || !s.etat) return;
    etat = s.etat; depart = s.depart; mode = s.mode;
    historique = []; selection = null;
    montrer('ecran-jeu');
  }

  /* ---------- Mise en page ---------- */

  function mesurer() {
    if (!etat) return;
    const racine = document.documentElement;
    const largeur = Math.min(window.innerWidth, 560);
    const ecart = largeur < 360 ? 4 : 6;
    const nbCol = etat.colonnes.length;
    const nb = Math.max(nbCol, etat.fondations.length);
    const l = Math.min(88, Math.floor((largeur - ecart * (nb + 1)) / nb));
    const h = Math.round(l * 1.36);
    racine.style.setProperty('--l-carte', l + 'px');
    racine.style.setProperty('--h-carte', h + 'px');
    racine.style.setProperty('--ecart', ecart + 'px');
    racine.style.setProperty('--l-talon', Math.min(l, 70) + 'px');
    const police = Math.max(10, Math.min(15, l * 0.19));
    racine.style.setProperty('--nb-col', nbCol);
    racine.style.setProperty('--nb-fond', etat.fondations.length);

    // Hauteur disponible pour le tableau → compresser les décalages si besoin
    const plateau = $('#plateau');
    const hauteurFond = h + 12 + 4;
    const dispoH = plateau.clientHeight - hauteurFond - 8;
    let dv = Math.round(h * 0.36), dc = Math.round(h * 0.11);
    const besoin = (col, v, c) => col.reduce((s, k, idx) => idx === col.length - 1 ? s : s + (k.visible ? v : c), 0) + h;
    const pire = () => Math.max(...etat.colonnes.map(col => besoin(col, dv, dc)));
    while (pire() > dispoH && dv > Math.round(h * 0.24)) dv--;
    while (pire() > dispoH && dc > 5) dc--;
    dispo = { l, h, dv, dc, police };
  }

  /* ---------- Rendu ---------- */

  /** n = nombre de mots déjà regroupés sous une carte-catégorie (affiché « n/total »). */
  function htmlCarte(k, extra, n) {
    if (!k.visible) return `<div class="carte cachee${extra || ''}" data-id="${k.id}"></div>`;
    const cat = k.type === 'cat';
    const taille = cat ? ` data-taille="${n || 0}/${etat.categories[k.cat].taille}"` : '';
    return `<div class="carte${cat ? ' cat' : ''}${extra || ''}" data-id="${k.id}"${taille}>` +
      `${texteCarte(k.texte)}</div>`;
  }

  function estChoisie(zone, i, idx) {
    if (!selection || selection.zone !== zone) return false;
    if (zone === 'def') return true;
    return selection.i === i && idx >= selection.idx;
  }

  function rendre() {
    if (!etat) return;
    mesurer();

    // Barre du haut
    const reste = M.coupsRestants(etat);
    $('#coups-restants').textContent = reste;
    $('.compteur').classList.toggle('bas', reste <= 10);
    $('#progres').innerHTML = etat.categories.map((_, i) =>
      `<i class="${etat.terminees.includes(i) ? 'ok' : ''}"></i>`).join('');
    $('#btn-annuler').disabled = historique.length === 0;

    // Fondations
    $('#fondations').innerHTML = etat.fondations.map((f, i) => {
      if (f.cat === null) return `<div class="case" data-zone="fond" data-i="${i}"></div>`;
      const c = etat.categories[f.cat];
      return `<div class="case fond" data-zone="fond" data-i="${i}">` +
        `<div class="carte cat">${texteCarte(c.nom, 0.85)}</div>` +
        `<div class="jauge"><b style="width:${(100 * f.n / c.taille).toFixed(0)}%"></b></div>` +
        `<div class="compte">${f.n}/${c.taille}</div></div>`;
    }).join('');

    // Colonnes
    $('#tableau').innerHTML = etat.colonnes.map((col, i) => {
      let y = 0;
      const cartes = col.map((k, idx) => {
        const dessus = idx === col.length - 1;
        const n = k.type === 'cat' ? M.motsSous(col, idx) : 0;
        const html = htmlCarte(k, (dessus ? ' dessus' : '') + (estChoisie('col', i, idx) ? ' choisie' : ''), n)
          .replace('class="carte', `data-idx="${idx}" style="top:${y}px;z-index:${idx + 1}" class="carte`);
        y += k.visible ? dispo.dv : dispo.dc;
        return html;
      }).join('');
      const hauteur = col.length ? y - (col[col.length - 1].visible ? dispo.dv : dispo.dc) + dispo.h : dispo.h;
      return `<div class="colonne" data-zone="col" data-i="${i}" style="height:${hauteur}px">` +
        `<div class="case"></div>${cartes}</div>`;
    }).join('');

    // Pioche et défausse
    const pioche = $('#pioche');
    pioche.classList.toggle('vide', etat.pioche.length === 0);
    pioche.innerHTML = etat.pioche.length
      ? `<div class="carte cachee"></div><span class="nombre">${etat.pioche.length}</span>`
      : '';
    pioche.setAttribute('aria-label', etat.pioche.length ? `Piocher (${etat.pioche.length} cartes)` : 'Remettre la défausse dans la pioche');
    const haut = etat.defausse[etat.defausse.length - 1];
    $('#defausse').innerHTML = haut ? htmlCarte(haut, ' dessus' + (estChoisie('def') ? ' choisie' : '')) : '';
    $('#defausse').dataset.zone = 'def';
  }

  /* ---------- Jouer ---------- */

  function jouer(coup) {
    if (!M.coupLegal(etat, coup)) return false;
    historique.push(M.cloner(etat));
    if (historique.length > 300) historique.shift();
    const ev = M.appliquer(etat, coup);
    selection = null;
    rendre();
    if (ev.completee !== null) {
      toast('Complétée : ' + etat.categories[ev.completee].nom);
      vibrer(30);
    }
    if (ev.recyclage) toast('Pioche remélangée', true);
    sauvegarder();
    if (M.estTerminee(etat)) setTimeout(finPartie, ev.completee !== null ? 700 : 250);
    return true;
  }

  function annuler() {
    if (!historique.length || M.estTerminee(etat)) return;
    etat = historique.pop();
    selection = null;
    sauvegarder();
    rendre();
  }

  function destinationDe(zone, i) {
    if (zone === 'fond') return { zone: 'fond', i };
    if (zone === 'col') return { zone: 'col', i };
    return null;
  }

  function selectionnable(zone, i, idx) {
    if (zone === 'def') return etat.defausse.length > 0;
    if (zone === 'col' && idx != null) return !!M.prendre(etat, { zone: 'col', i, idx });
    return false;
  }

  /** Envoie la sélection au meilleur endroit légal. */
  function autoDeplacer(de) {
    // Une carte-catégorie posée sur ses mots emporte tout le groupe.
    if (de.zone === 'col') {
      const col = etat.colonnes[de.i];
      if (col[de.idx] && col[de.idx].type === 'cat') de = { ...de, idx: de.idx - M.motsSous(col, de.idx) };
    }
    const cartes = M.prendre(etat, de);
    if (!cartes) return false;
    const candidats = [];
    etat.fondations.forEach((f, i) => { if (f.cat !== null) candidats.push({ zone: 'fond', i }); });
    etat.fondations.forEach((f, i) => { if (f.cat === null) candidats.push({ zone: 'fond', i }); });
    etat.colonnes.forEach((c, i) => { if (c.length) candidats.push({ zone: 'col', i }); });
    etat.colonnes.forEach((c, i) => { if (!c.length) candidats.push({ zone: 'col', i }); });
    for (const vers of candidats) {
      if (vers.zone === 'col' && !etat.colonnes[vers.i].length && de.zone === 'col' && de.idx === 0) continue;
      if (jouer({ type: 'deplacer', de, vers })) return true;
    }
    return false;
  }

  function refuser(el) {
    if (!el) return;
    el.classList.remove('refus');
    void el.offsetWidth;
    el.classList.add('refus');
    vibrer(15);
  }

  function toucher(e) {
    if (!etat || M.estTerminee(etat)) return;
    const elCarte = e.target.closest('.carte');
    const elZone = e.target.closest('[data-zone], #pioche');
    if (!elZone) { if (selection) { selection = null; rendre(); } return; }

    if (elZone.id === 'pioche') {
      selection = null;
      if (!jouer({ type: 'piocher' })) refuser(elZone);
      return;
    }

    const zone = elZone.dataset.zone;
    const i = elZone.dataset.i != null ? Number(elZone.dataset.i) : null;
    const idx = elCarte && elCarte.dataset.idx != null ? Number(elCarte.dataset.idx) : null;
    const ici = { zone, i, idx: zone === 'col' ? idx : undefined };

    if (selection) {
      const meme = selection.zone === zone && (zone === 'def' || (selection.i === i && selection.idx === idx));
      if (meme) {
        const de = selection;
        if (!autoDeplacer(de)) { selection = null; rendre(); refuser(elCarte); toast('Aucun endroit pour cette carte', true); }
        return;
      }
      const vers = destinationDe(zone, i);
      if (vers && jouer({ type: 'deplacer', de: selection, vers })) return;
      if (selectionnable(zone, i, idx)) { selection = ici; rendre(); return; }
      selection = null; rendre();
      refuser(elZone.querySelector('.carte:last-of-type') || elZone);
      return;
    }

    if (selectionnable(zone, i, idx)) { selection = ici; rendre(); }
    else if (elCarte) refuser(elCarte);
  }

  /* ---------- Glisser-déposer ---------- */

  const SEUIL_GLISSE = 8;   // px avant de considérer que c'est un glissement
  let geste = null;         // { id, x0, y0, source, cartesEl, fantome, cibles, glisse }

  /** Source déplaçable sous le doigt, ou null. */
  function sourceSous(cible) {
    const elCarte = cible.closest('.carte');
    const elZone = cible.closest('[data-zone]');
    if (!elCarte || !elZone || elCarte.classList.contains('cachee')) return null;
    if (elZone.dataset.zone === 'def') return etat.defausse.length ? { zone: 'def' } : null;
    if (elZone.dataset.zone === 'col' && elCarte.dataset.idx != null) {
      const src = { zone: 'col', i: Number(elZone.dataset.i), idx: Number(elCarte.dataset.idx) };
      // Prendre une carte-catégorie emporte les mots regroupés sous elle.
      const col = etat.colonnes[src.i];
      if (col[src.idx] && col[src.idx].type === 'cat') src.idx -= M.motsSous(col, src.idx);
      return M.prendre(etat, src) ? src : null;
    }
    return null;
  }

  function elementsSource(src) {
    if (src.zone === 'def') return [$('#defausse .carte')];
    return [...document.querySelectorAll(`#tableau .colonne[data-i="${src.i}"] .carte`)]
      .filter(el => Number(el.dataset.idx) >= src.idx);
  }

  /** Destinations légales pour la source, avec leur élément à l'écran. */
  function ciblesLegales(src) {
    const liste = [];
    etat.fondations.forEach((_, i) => {
      const vers = { zone: 'fond', i };
      if (M.coupLegal(etat, { type: 'deplacer', de: src, vers })) liste.push({ vers, el: $(`#fondations [data-i="${i}"]`) });
    });
    etat.colonnes.forEach((_, i) => {
      const vers = { zone: 'col', i };
      if (M.coupLegal(etat, { type: 'deplacer', de: src, vers })) liste.push({ vers, el: $(`#tableau .colonne[data-i="${i}"]`) });
    });
    return liste;
  }

  function commencerGlisse() {
    const g = geste;
    g.glisse = true;
    selection = null;
    document.querySelectorAll('.carte.choisie').forEach(el => el.classList.remove('choisie'));
    const base = g.cartesEl[0].getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'fantome';
    f.style.left = base.left + 'px';
    f.style.top = base.top + 'px';
    for (const el of g.cartesEl) {
      const r = el.getBoundingClientRect();
      const c = el.cloneNode(true);
      c.classList.remove('indice', 'refus', 'choisie');
      c.style.top = (r.top - base.top) + 'px';
      c.style.left = '0px';
      c.style.zIndex = '';
      f.appendChild(c);
      el.classList.add('traine');
    }
    document.body.appendChild(f);
    g.fantome = f;
    g.cibles = ciblesLegales(g.source);
    g.cibles.forEach(c => c.el && c.el.classList.add('cible-possible'));
  }

  /** Cible dont la zone recouvre le plus la carte déplacée (tolérant sur mobile). */
  function meilleureCible(g, x, y) {
    const r = g.fantome.firstChild.getBoundingClientRect();
    let meilleure = null, aire = 0;
    for (const c of g.cibles) {
      if (!c.el) continue;
      const z = c.el.getBoundingClientRect();
      const bas = c.vers.zone === 'col' ? Math.max(z.bottom, z.top + dispo.h) : z.bottom;
      const w = Math.min(r.right, z.right) - Math.max(r.left, z.left);
      const h = Math.min(r.bottom, bas) - Math.max(r.top, z.top);
      const a = w > 0 && h > 0 ? w * h : 0;
      if (a > aire) { aire = a; meilleure = c; }
    }
    if (meilleure) return meilleure;
    // Sinon : ce qu'il y a sous le doigt
    const sous = document.elementFromPoint(x, y);
    const z = sous && sous.closest('[data-zone]');
    if (!z) return null;
    return g.cibles.find(c => c.el === z) || null;
  }

  function finirGlisse(g) {
    document.querySelectorAll('.cible-possible, .cible').forEach(el => el.classList.remove('cible-possible', 'cible'));
    if (g.fantome) g.fantome.remove();
    document.querySelectorAll('.traine').forEach(el => el.classList.remove('traine'));
  }

  function pointeurBas(e) {
    if (!etat || M.estTerminee(etat) || geste || e.button > 0) return;
    if (e.target.closest('.barre')) return;
    const source = sourceSous(e.target);
    geste = { id: e.pointerId, x0: e.clientX, y0: e.clientY, source, glisse: false, cible: e.target };
    if (source) {
      geste.cartesEl = elementsSource(source);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
    }
  }

  function pointeurBouge(e) {
    const g = geste;
    if (!g || e.pointerId !== g.id || !g.source) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.glisse) {
      if (Math.hypot(dx, dy) < SEUIL_GLISSE) return;
      commencerGlisse();
    }
    e.preventDefault();
    g.fantome.style.transform = `translate(${dx}px, ${dy}px)`;
    const c = meilleureCible(g, e.clientX, e.clientY);
    g.cibles.forEach(x => x.el && x.el.classList.toggle('cible', x === c));
  }

  function pointeurHaut(e) {
    const g = geste;
    if (!g || e.pointerId !== g.id) return;
    geste = null;
    if (!g.glisse) { toucher({ target: g.cible }); return; }
    const c = meilleureCible(g, e.clientX, e.clientY);
    if (c && jouer({ type: 'deplacer', de: g.source, vers: c.vers })) { finirGlisse(g); return; }
    // Retour à la case départ
    const f = g.fantome;
    f.style.transition = 'transform .18s ease';
    f.style.transform = 'translate(0, 0)';
    setTimeout(() => { finirGlisse(g); }, 190);
    if (c === null && g.cibles.length === 0) vibrer(15);
  }

  function pointeurAnnule(e) {
    if (!geste || e.pointerId !== geste.id) return;
    if (geste.glisse) finirGlisse(geste);
    geste = null;
  }

  function indice() {
    if (!etat || M.estTerminee(etat)) return;
    const c = M.meilleurCoup(etat);
    if (!c) { toast('Aucun coup possible', true); return; }
    selection = null;
    rendre();
    let el;
    if (c.type === 'piocher') { el = $('#pioche .carte') || $('#pioche'); toast(etat.pioche.length ? 'Pioche une carte' : 'Remélange la pioche', true); }
    else if (c.de.zone === 'def') el = $('#defausse .carte');
    else el = $(`#tableau .colonne[data-i="${c.de.i}"] .carte[data-idx="${c.de.idx}"]`);
    if (el) { el.classList.add('indice'); setTimeout(() => el.classList.remove('indice'), 1900); }
  }

  /* ---------- Fin de partie ---------- */

  function finPartie() {
    const gagne = M.estGagnee(etat);
    const etoiles = M.nombreEtoiles(etat);

    if (!etat.compte) {
      etat.compte = true;
      const dejaDefi = mode.type === 'defi' && stats.defis[mode.date];
      if (!dejaDefi) {
        stats.jouees++;
        if (gagne) {
          stats.gagnees++; stats.serie++; stats.etoiles += etoiles;
          stats.meilleureSerie = Math.max(stats.meilleureSerie, stats.serie);
        } else stats.serie = 0;
        if (mode.type === 'defi') stats.defis[mode.date] = { gagne, coups: etat.coups, limite: etat.limite, etoiles };
        stock.ecrire('stats', stats);
      }
      sauvegarder();
    }

    $('#fin-titre').textContent = gagne ? 'Bravo!' : 'Plus de coups…';
    $('#fin-etoiles').textContent = gagne ? '★'.repeat(etoiles) + '☆'.repeat(3 - etoiles) : '';
    $('#fin-texte').textContent = gagne
      ? `Réussi en ${etat.coups} coups sur ${etat.limite}.`
      : `Il te restait ${etat.categories.length - etat.terminees.length} catégorie(s). Voici les réponses :`;
    $('#fin-cats').innerHTML = etat.categories.map(c =>
      `<li><b>${echapper(c.nom)}</b><span>${c.mots.map(echapper).join(' · ')}</span></li>`).join('');
    $('#fin-partager').hidden = mode.type !== 'defi';
    $('#dlg-fin').showModal();
  }

  async function partager() {
    const r = stats.defis[mode.date] || { gagne: M.estGagnee(etat), coups: etat.coups, limite: etat.limite, etoiles: M.nombreEtoiles(etat) };
    const texte = `Solitaire Association — défi du ${dateLisible(mode.date)}\n` +
      (r.gagne ? `${'★'.repeat(r.etoiles)}${'☆'.repeat(3 - r.etoiles)} en ${r.coups} coups (sur ${r.limite})` : 'Pas réussi cette fois-ci!');
    try {
      if (navigator.share) await navigator.share({ text: texte });
      else { await navigator.clipboard.writeText(texte); toast('Résultat copié', true); }
    } catch (e) { /* annulé */ }
  }

  /* ---------- Fenêtres ---------- */

  function ouvrirThemes() {
    $('#liste-themes').innerHTML = BANQUES.map(t =>
      `<label><input type="checkbox" value="${t.id}" ${reglages.themes.includes(t.id) ? 'checked' : ''}>${echapper(t.nom)}</label>`).join('');
    $('#dlg-themes').showModal();
  }

  function lireThemes() {
    const choisis = [...document.querySelectorAll('#liste-themes input:checked')].map(i => i.value);
    reglages.themes = choisis.length ? choisis : BANQUES.map(t => t.id);
    stock.ecrire('reglages', reglages);
  }

  function ouvrirStats() {
    const taux = stats.jouees ? Math.round(100 * stats.gagnees / stats.jouees) : 0;
    const bloc = (n, l) => `<div><strong>${n}</strong><span>${l}</span></div>`;
    $('#stats').innerHTML = bloc(stats.jouees, 'parties') + bloc(taux + ' %', 'réussite') +
      bloc(stats.serie, 'série actuelle') + bloc(stats.meilleureSerie, 'meilleure série') +
      bloc(stats.etoiles, 'étoiles') + bloc(Object.values(stats.defis).filter(d => d.gagne).length, 'défis réussis');
    $('#dlg-stats').showModal();
  }

  /* ---------- Branchements ---------- */

  $('#btn-defi').addEventListener('click', () => demarrer({ type: 'defi', date: dateDuJour() }));
  $('#btn-nouvelle').addEventListener('click', () => demarrer({ type: 'libre' }));
  $('#btn-continuer').addEventListener('click', reprendre);
  document.querySelectorAll('[data-diff]').forEach(b => b.addEventListener('click', () => {
    reglages.difficulte = b.dataset.diff;
    stock.ecrire('reglages', reglages);
    majAccueil();
  }));
  $('#btn-themes').addEventListener('click', ouvrirThemes);
  $('#themes-tous').addEventListener('click', () => document.querySelectorAll('#liste-themes input').forEach(i => { i.checked = true; }));
  $('#dlg-themes').addEventListener('close', lireThemes);
  $('#btn-regles').addEventListener('click', () => $('#dlg-regles').showModal());
  $('#btn-stats').addEventListener('click', ouvrirStats);

  const zoneJeu = $('#ecran-jeu');
  zoneJeu.addEventListener('pointerdown', pointeurBas);
  zoneJeu.addEventListener('pointermove', pointeurBouge);
  zoneJeu.addEventListener('pointerup', pointeurHaut);
  zoneJeu.addEventListener('pointercancel', pointeurAnnule);
  $('#btn-annuler').addEventListener('click', annuler);
  $('#btn-indice').addEventListener('click', indice);
  $('#btn-menu').addEventListener('click', () => $('#dlg-menu').showModal());
  $('#menu-recommencer').addEventListener('click', () => {
    $('#dlg-menu').close();
    etat = M.cloner(depart); historique = []; selection = null;
    sauvegarder(); rendre();
  });
  $('#menu-regles').addEventListener('click', () => { $('#dlg-menu').close(); $('#dlg-regles').showModal(); });
  $('#menu-accueil').addEventListener('click', () => { $('#dlg-menu').close(); montrer('ecran-accueil'); });

  $('#fin-rejouer').addEventListener('click', () => { $('#dlg-fin').close(); demarrer({ type: 'libre' }); });
  $('#fin-menu').addEventListener('click', () => { $('#dlg-fin').close(); montrer('ecran-accueil'); });
  $('#fin-partager').addEventListener('click', partager);

  document.querySelectorAll('[data-fermer]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', (e) => { if (e.target === d && d.id !== 'dlg-fin') d.close(); }));

  window.addEventListener('resize', () => { if ($('#ecran-jeu').classList.contains('actif')) rendre(); });

  // Première visite : montrer les règles
  majAccueil();
  if (!stock.lire('vu-regles', false)) {
    stock.ecrire('vu-regles', true);
    setTimeout(() => $('#dlg-regles').showModal(), 300);
  }

  // Accès pour les tests automatisés
  window.__SA = { get etat() { return etat; }, jouer, rendre };
})();
