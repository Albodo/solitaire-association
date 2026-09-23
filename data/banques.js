/*
 * Banques de mots — Solitaire Association
 * ----------------------------------------
 * Chaque thème contient des catégories. Chaque catégorie a un nom (affiché
 * sur la carte-catégorie) et une liste de mots (au moins 4, idéalement 6 à 10).
 * Le jeu pige au hasard un sous-ensemble des mots à chaque partie.
 *
 * Règles d'or :
 *  - Orientation Québec : titres québécois des films, parlure d'ici, etc.
 *  - Un mot ne doit pas pouvoir appartenir à deux catégories (le générateur
 *    évite les doublons exacts, mais pas les ambiguïtés de sens).
 *  - Textes courts : les cartes sont petites sur mobile (idéalement ≤ 18 caractères).
 *
 * Voir docs/BANQUES.md pour le guide complet.
 */
window.BANQUES = [
  {
    id: 'politique',
    nom: 'Politique',
    categories: [
      { nom: 'Premiers ministres (QC)', mots: ['Lévesque', 'Bourassa', 'Parizeau', 'Bouchard', 'Landry', 'Charest', 'Marois', 'Couillard', 'Legault', 'Duplessis', 'Lesage'] },
      { nom: 'Premiers ministres (CAN)', mots: ['Laurier', 'Diefenbaker', 'Pearson', 'Mulroney', 'Chrétien', 'Harper', 'Trudeau', 'Carney', 'Macdonald'] },
      { nom: 'Partis du Québec', mots: ['Parti québécois', 'Parti libéral du Québec', 'Coalition avenir Québec', 'Québec solidaire', 'Union nationale', 'Action démocratique', 'Option nationale', 'Parti vert du Québec', 'Climat Québec'] },
      { nom: 'Partis fédéraux', mots: ['Bloc québécois', 'NPD', 'Parti conservateur', 'Parti libéral du Canada', 'Parti vert du Canada', 'Parti populaire'] },
      { nom: 'Vie parlementaire', mots: ['Salon bleu', 'Salon rouge', 'Député', 'Circonscription', 'Période de questions', 'Whip', 'Bâillon', 'Projet de loi'] },
      { nom: "Moments d'histoire", mots: ['Révolution tranquille', "Crise d'Octobre", 'Loi 101', 'Lac Meech', 'Patriotes', 'Expo 67', 'Référendum de 1995', 'Grande Noirceur'] },
      { nom: 'Présidents américains', mots: ['Washington', 'Jefferson', 'Lincoln', 'Roosevelt', 'Truman', 'Eisenhower', 'Kennedy', 'Johnson', 'Nixon', 'Carter', 'Reagan', 'Clinton', 'Bush', 'Obama', 'Trump', 'Biden'] },
      { nom: 'Présidents français', mots: ['Vincent Auriol', 'René Coty', 'Charles de Gaulle', 'Georges Pompidou', "Valéry Giscard d'Estaing", 'François Mitterrand', 'Jacques Chirac', 'Nicolas Sarkozy', 'François Hollande', 'Emmanuel Macron'] },
    ],
  },
  {
    id: 'culture-pop',
    nom: 'Culture pop',
    categories: [
      { nom: 'Émissions jeunesse', mots: ['Passe-Partout', 'Bobino', 'Watatatow', 'Cornemuse', 'Vazimolo', 'Toc Toc Toc', 'Ramdam', 'Télé-Pirate'] },
      { nom: 'Téléséries d\'ici', mots: ['Unité 9', 'District 31', 'Lance et compte', 'Les Bougon', 'Les Filles de Caleb', 'Fugueuse', 'Les Invincibles', '19-2'] },
      { nom: 'Humoristes', mots: ['Yvon Deschamps', 'Lise Dion', 'Martin Matte', 'Louis-José Houde', 'Rachid Badouri', 'Mike Ward', 'Jean-Marc Parent', 'Sugar Sammy', 'Claudine Mercier'] },
      { nom: 'Bouffe québécoise', mots: ['Poutine', 'Tourtière', 'Pâté chinois', 'Pouding chômeur', 'Tarte au sucre', 'Cretons', 'Guédille', 'Fèves au lard', 'Tire sur la neige'] },
      { nom: 'Légendes du Canadien', mots: ['Maurice Richard', 'Jean Béliveau', 'Guy Lafleur', 'Patrick Roy', 'Carey Price', 'Saku Koivu', 'Ken Dryden', 'Larry Robinson'] },
      { nom: 'Vêtements en québécois', mots: ['Tuque', 'Mitaines', 'Gougounes', 'Bas', 'Chandail', 'Coton ouaté', 'Bobettes', 'Camisole', 'Froc'] },
      { nom: 'Verbes bien de chez nous', mots: ['Niaiser', 'Placoter', 'Magasiner', 'Pogner', 'Chialer', 'Bretter', 'Zigonner', 'Taponner', 'Achaler'] },
      { nom: 'La Petite Vie', mots: ['Popa', 'Moman', 'Rod', 'Caro', 'Lison', 'Thérèse', 'Réjean'] },
      { nom: 'Dans une galaxie…', mots: ['Charles Patenaude', 'Brad Spitfire', 'Flavien Bouchard', 'Bob Lamoureux', 'Valence'] },
      { nom: 'Friends', mots: ['Rachel', 'Monica', 'Phoebe', 'Joey', 'Chandler', 'Ross', 'Gunther', 'Janice'] },
      { nom: 'How I Met Your Mother', mots: ['Ted', 'Marshall', 'Lily', 'Robin', 'Barney', 'Ranjit'] },
      { nom: 'The Office', mots: ['Michael', 'Dwight', 'Jim', 'Pam', 'Angela', 'Kevin', 'Stanley', 'Creed', 'Ryan', 'Toby'] },
    ],
  },
  {
    id: 'science',
    nom: 'Science',
    categories: [
      { nom: 'Planètes', mots: ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune'] },
      { nom: 'Éléments chimiques', mots: ['Hydrogène', 'Hélium', 'Carbone', 'Azote', 'Oxygène', 'Fer', 'Cuivre', 'Sodium', 'Uranium', 'Lithium'] },
      { nom: 'Organes', mots: ['Cœur', 'Foie', 'Poumon', 'Rein', 'Estomac', 'Pancréas', 'Rate', 'Cerveau', 'Intestin'] },
      { nom: 'Os du corps', mots: ['Fémur', 'Tibia', 'Péroné', 'Humérus', 'Radius', 'Cubitus', 'Clavicule', 'Omoplate', 'Rotule'] },
      { nom: 'Scientifiques', mots: ['Einstein', 'Curie', 'Newton', 'Darwin', 'Galilée', 'Pasteur', 'Tesla', 'Hubert Reeves', 'Marie-Victorin'] },
      { nom: 'Animaux du Québec', mots: ['Orignal', 'Caribou', 'Castor', 'Carcajou', 'Harfang des neiges', 'Béluga', 'Ours noir', 'Raton laveur', 'Marmotte', 'Tamia rayé'] },
    ],
  },
  {
    id: 'techno',
    nom: 'Technologie',
    categories: [
      { nom: 'Langages informatiques', mots: ['Python', 'JavaScript', 'Java', 'Rust', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin'] },
      { nom: 'Réseaux sociaux', mots: ['Facebook', 'Instagram', 'TikTok', 'Snapchat', 'LinkedIn', 'Reddit', 'Pinterest', 'Bluesky'] },
      { nom: "Pièces d'ordinateur", mots: ['Processeur', 'Carte mère', 'Mémoire vive', 'Disque dur', 'Carte graphique', "Bloc d'alimentation", 'Ventilateur'] },
      { nom: 'Périphériques', mots: ['Clavier', 'Souris', 'Écran', 'Imprimante', 'Webcam', "Casque d'écoute", 'Manette', 'Numériseur'] },
      { nom: 'Unités informatiques', mots: ['Bit', 'Octet', 'Kilooctet', 'Mégaoctet', 'Gigaoctet', 'Téraoctet', 'Pétaoctet'] },
      { nom: "Mots de l'OQLF", mots: ['Courriel', 'Pourriel', 'Clavardage', 'Balado', 'Mot-clic', 'Égoportrait', 'Hameçonnage', 'Infonuagique'] },
      { nom: 'Jeux vidéo montréalais', mots: ["Assassin's Creed", 'Far Cry', 'Rainbow Six Siege', 'Watch Dogs', 'Dead by Daylight', 'Deus Ex', 'Prince of Persia'] },
    ],
  },
  {
    id: 'cinema',
    nom: 'Cinéma',
    categories: [
      { nom: 'Cinéastes québécois', mots: ['Denis Villeneuve', 'Xavier Dolan', 'Denys Arcand', 'Jean-Marc Vallée', 'Philippe Falardeau', 'Claude Jutra', 'Léa Pool', 'Pierre Falardeau'] },
      { nom: 'Films québécois', mots: ['C.R.A.Z.Y.', 'Les Invasions barbares', 'Bon Cop, Bad Cop', 'Mommy', 'Incendies', 'La Grande Séduction', 'Starbuck', 'Monsieur Lazhar', 'Les Boys', 'Elvis Gratton'] },
      { nom: 'Acteurs québécois', mots: ['Rémy Girard', 'Marc Messier', 'Patrick Huard', 'Karine Vanasse', 'Marc-André Grondin', 'Anne Dorval', 'Michel Côté', 'Pierre Lebeau'] },
      { nom: 'Cinéastes du monde', mots: ['Spielberg', 'Kubrick', 'Hitchcock', 'Tarantino', 'Scorsese', 'Nolan', 'Kurosawa', 'Fellini', 'Miyazaki', 'Bong Joon-ho'] },
      { nom: 'Films Pixar', mots: ['Histoire de jouets', 'Trouver Nemo', 'Les Incroyables', 'Sens dessus dessous', 'Là-haut', 'WALL-E', 'Ratatouille', 'Coco', 'Monstres, Inc.'] },
      { nom: 'Science-fiction', mots: ['Blade Runner', 'La Matrice', 'Interstellar', 'Premier contact', 'Retour vers le futur', 'Le Cinquième Élément', 'Gravité', 'Solaris'] },
      { nom: 'Films de Spielberg', mots: ['Les Dents de la mer', 'E.T.', 'Le Parc jurassique', 'La Liste de Schindler', 'Arrête-moi si tu peux', 'Indiana Jones', 'Minority Report', 'Duel', 'Hook', 'La Guerre des mondes', 'Les Fabelman'] },
      { nom: 'Films de Cameron', mots: ['Terminator', 'Aliens', 'Abyss', 'Titanic', 'Avatar', 'Vrais mensonges'] },
      { nom: 'Films de David Lynch', mots: ['Eraserhead', 'Elephant Man', 'Dune', 'Blue Velvet', 'Sailor et Lula', 'Lost Highway', 'Mulholland Drive', 'Une histoire vraie', 'Inland Empire'] },
      { nom: 'Films de Cronenberg', mots: ['Frissons', 'Scanners', 'Videodrome', 'La Mouche', 'Faux-semblants', 'Crash', 'eXistenZ', 'Spider', 'Une histoire de violence', "Les Promesses de l'ombre", 'Les Crimes du futur'] },
      { nom: 'Films de Tim Burton', mots: ['Beetlejuice', 'Batman', 'Ed Wood', 'Mars Attacks!', 'Sleepy Hollow', 'Big Fish', 'Les Noces funèbres', 'Sweeney Todd', 'Frankenweenie', 'Dark Shadows'] },
    ],
  },
  {
    id: 'geographie',
    nom: "Géographie d'ici",
    categories: [
      { nom: 'Provinces et territoires', mots: ['Ontario', 'Manitoba', 'Alberta', 'Saskatchewan', 'Nouveau-Brunswick', 'Nouvelle-Écosse', 'Terre-Neuve', 'Colombie-Britannique', 'Nunavut', 'Yukon'] },
      { nom: 'Régions du Québec', mots: ['Gaspésie', 'Laurentides', 'Charlevoix', 'Côte-Nord', 'Lanaudière', 'Mauricie', 'Outaouais', 'Montérégie', 'Bas-Saint-Laurent', 'Centre-du-Québec'] },
      { nom: 'Rivières du Québec', mots: ['Richelieu', 'Saint-Maurice', 'Chaudière', 'Yamaska', 'Manicouagan', 'Rivière des Outaouais', 'Rivière Rouge', 'Batiscan'] },
      { nom: 'Monts du Québec', mots: ['Mont Tremblant', 'Mont Royal', 'Mont Orford', 'Mont Sutton', 'Mont Sainte-Anne', 'Mont Jacques-Cartier', 'Mont Albert', 'Mont Saint-Hilaire'] },
    ],
  },
  {
    id: 'monde',
    nom: 'Géographie du monde',
    categories: [
      { nom: "Pays d'Amérique", mots: ['Canada', 'États-Unis', 'Mexique', 'Cuba', 'Haïti', 'Jamaïque', 'Honduras', 'Nicaragua', 'Costa Rica', 'Colombie', 'Venezuela', 'Équateur', 'Pérou', 'Brésil', 'Bolivie', 'Chili', 'Argentine', 'Uruguay', 'Paraguay'] },
      { nom: "Pays d'Europe", mots: ['France', 'Belgique', 'Suisse', 'Pays-Bas', 'Allemagne', 'Autriche', 'Italie', 'Espagne', 'Portugal', 'Irlande', 'Islande', 'Norvège', 'Suède', 'Finlande', 'Pologne', 'Hongrie', 'Croatie', 'Grèce'] },
      { nom: "Pays d'Afrique", mots: ['Maroc', 'Algérie', 'Tunisie', 'Égypte', 'Mali', 'Nigeria', 'Ghana', 'Cameroun', "Côte d'Ivoire", 'Éthiopie', 'Kenya', 'Tanzanie', 'Rwanda', 'Madagascar', 'Afrique du Sud'] },
      { nom: "Pays d'Asie", mots: ['Japon', 'Chine', 'Corée du Sud', 'Mongolie', 'Viêt Nam', 'Laos', 'Cambodge', 'Thaïlande', 'Malaisie', 'Indonésie', 'Philippines', 'Inde', 'Népal', 'Pakistan', 'Iran', 'Irak'] },
      { nom: 'Capitales', mots: ['Ottawa', 'La Havane', 'Bogota', 'Lima', 'Brasilia', 'Buenos Aires', 'Santiago', 'Paris', 'Madrid', 'Lisbonne', 'Rome', 'Berlin', 'Oslo', 'Athènes', 'Le Caire', 'Dakar', 'Nairobi', 'Téhéran', 'Pékin', 'Séoul', 'Tokyo', 'Hanoï', 'Bangkok', 'Canberra'] },
      { nom: 'Océans', mots: ['Atlantique', 'Pacifique', 'Indien', 'Arctique', 'Austral'] },
      { nom: 'Fleuves', mots: ['Saint-Laurent', 'Mackenzie', 'Fraser', 'Mississippi', 'Amazone', 'Nil', 'Zambèze', 'Seine', 'Loire', 'Rhône', 'Rhin', 'Danube', 'Tamise', 'Volga', 'Gange', 'Mékong', 'Yangtsé'] },
      { nom: 'Continents', mots: ['Afrique', 'Asie', 'Europe', 'Océanie', 'Amérique', 'Antarctique'] },
    ],
  },
  {
    id: 'jurons',
    nom: 'Jurons québécois',
    categories: [
      { nom: 'Sacres', mots: ['Tabarnak', 'Câlice', 'Crisse', 'Ostie', 'Ciboire', 'Sacrament', 'Viarge', 'Calvaire'] },
      { nom: 'Sacres adoucis', mots: ['Tabarnouche', 'Tabarouette', 'Câline', 'Mosus', 'Ciboulette', 'Torrieux', 'Batince', 'Cibole', 'Sacrifice', 'Maudit'] },
      { nom: 'Insultes d\'ici', mots: ['Niaiseux', 'Épais', 'Téteux', 'Colon', 'Nono', 'Gnochon', 'Nounoune', 'Grand slack', 'Twit'] },
    ],
  },
  {
    id: 'villes',
    nom: 'Villes du Québec',
    categories: [
      { nom: 'Grandes villes', mots: ['Montréal', 'Québec', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Lévis', 'Trois-Rivières', 'Terrebonne'] },
      { nom: "Villes de l'Est", mots: ['Rimouski', 'Matane', 'Gaspé', 'Percé', 'Rivière-du-Loup', 'Baie-Comeau', 'Sept-Îles', 'Carleton-sur-Mer'] },
      { nom: 'Villes de l\'Abitibi', mots: ['Rouyn-Noranda', "Val-d'Or", 'Amos', 'La Sarre', 'Ville-Marie', 'Senneterre', 'Malartic'] },
      { nom: 'Cantons-de-l\'Est', mots: ['Magog', 'Granby', 'Coaticook', 'Bromont', 'Lac-Mégantic', 'Val-des-Sources', 'North Hatley', 'Cowansville'] },
      { nom: 'Villes de saints', mots: ['Saint-Jérôme', 'Saint-Hyacinthe', 'Saint-Jean-sur-Richelieu', 'Saint-Eustache', 'Saint-Georges', 'Sainte-Julie', 'Saint-Sauveur', 'Sainte-Adèle'] },
      { nom: 'Quartiers de Montréal', mots: ['Plateau', 'Hochelaga', 'Rosemont', 'Verdun', 'Villeray', 'Outremont', 'Griffintown', 'Saint-Henri', 'Mile End'] },
    ],
  },
  {
    id: 'musique',
    nom: 'Musique franco',
    categories: [
      { nom: 'Auteurs-compositeurs', mots: ['Félix Leclerc', 'Gilles Vigneault', 'Robert Charlebois', 'Daniel Bélanger', 'Jean Leloup', 'Richard Desjardins', 'Michel Rivard', 'Paul Piché', 'Kevin Parent'] },
      { nom: 'Chanteuses québécoises', mots: ['Céline Dion', 'Ginette Reno', 'Diane Dufresne', 'Isabelle Boulay', 'Marjo', 'Cœur de pirate', 'Ariane Moffatt', 'Lynda Lemay', 'Klô Pelgag', 'Charlotte Cardin'] },
      { nom: 'Groupes québécois', mots: ['Les Cowboys Fringants', 'Harmonium', 'Beau Dommage', 'Kaïn', 'Les Colocs', 'Offenbach', 'Mes Aïeux', 'Karkwa', 'Les Trois Accords', 'Loco Locass'] },
      { nom: 'Chansons cultes', mots: ['Gens du pays', 'Mon pays', 'Lindberg', 'Dégénérations', 'La Manic', 'Le plus beau voyage', 'Les étoiles filantes', 'Le Blues du businessman'] },
      { nom: 'Francophonie d\'ailleurs', mots: ['Édith Piaf', 'Jacques Brel', 'Charles Aznavour', 'Serge Gainsbourg', 'Stromae', 'Angèle', 'Zaz', 'Johnny Hallyday'] },
      { nom: 'Musique trad', mots: ['Violon', 'Accordéon', 'Cuillères', 'Podorythmie', 'Harmonica', 'Guimbarde', 'Rigodon', 'Reel', 'Set carré'] },
    ],
  },
];
