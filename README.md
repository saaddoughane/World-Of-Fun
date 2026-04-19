# 🎮 World Of Fun - Présentation du projet

On a créé World Of Fun, un site web avec trois jeux interactifs développés en HTML5, CSS3 et JavaScript. L'idée était de faire un tour du monde ludique : chaque jeu se passe dans une région différente (Alaska, Amazonie, Sahara) avec son propre univers visuel et ses spécificités. 

La page d'accueil représente la planète Terre vue depuis l'espace, depuis laquelle nous pouvons naviguer pour accéder aux trois régions du monde comportant nos différents jeux.

## 🌍 Page d'Accueil

![Page d'accueil World Of Fun](./frontend/assets/preview-accueil.png)

La page d'accueil est le point central de navigation de notre projet. Elle présente un globe terrestre interactif avec trois pins positionnés sur les différentes régions du monde :

- **📍 Alaska** : Accès à Mémoire Arctique
- **📍 Amazonie** : Accès à Chasse Bananes  
- **📍 Sahara** : Accès à Charming Dunes

--- 

Le projet explore deux approches du développement web :

- **Manipulation du DOM** pour Mémoire Arctique (création dynamique d'éléments, gestion d'événements)

- **Canvas 2D** pour Chasse Bananes et Charming Dunes (rendu graphique, animations fluides)

---

**🔗 Site hébergé :**  https://worldoffun.vercel.app/index.html

**📂 Repository GitHub :** https://github.com/saaddoughane/World-Of-Fun

**📃 Rapport de Conception** : [RAPPORT_CONCEPTION.pdf](./RAPPORT_CONCEPTION.pdf)


## 🎥 Vidéos de Démonstration

- **Vidéo complète de démo** : https://www.youtube.com/watch?v=yub8oF7P0x4
- **Démo page d'accueil** : https://www.youtube.com/watch?v=hIHrrkX4-1E

- **Mémoire Arctique** : https://www.youtube.com/watch?v=n4Khp1uuw6s
- **Chasse Bananes** : https://www.youtube.com/watch?v=lYFzsrVpDlw
- **Charming Dunes** : https://www.youtube.com/watch?v=6Tx2PTfS9Ko


## 🚀 Installation et Lancement

### Prérequis
Aucune dépendance à installer.

### Instructions

1. **Cloner le repository :**
```bash
git clone https://github.com/saaddoughane/World-Of-Fun.git
cd World-Of-Fun
```

2. **Lancer un serveur local :**

**Option A** — Avec Live Server (extension VS Code) :
- Clic droit sur `frontend/index.html` → "Open with Live Server"

**Option B** — Avec Python :
```bash
cd frontend
python -m http.server 8000
```

---

3. **Accéder au site :**
- Ouvrir `http://localhost:8000` dans le navigateur

## 📁 Structure du Projet
 
```
World-Of-Fun
│
├── README.md                          # Ce fichier
├── RAPPORT_CONCEPTION.pdf             # Rapport technique (6 pages)
│
└── frontend/
    │
    ├── index.html                     # Page d'accueil (globe interactif)
    ├── auth.html                      # Authentification
    ├── dashboard.html                 # Tableau des scores
    ├── account.html                   # Gestion du compte
    │
    ├── css/                           # Styles globaux
    │   ├── main.css
    │   ├── home.css
    │   └── ...
    │
    ├── js/                            # Scripts globaux
    │   ├── main.js
    │   ├── home.js
    │   └── ...
    │
    ├── jeux/                          # Les trois jeux
    │   │
    │   ├── memoire/                   # Mémoire Arctique (DOM)
    │   │   ├── memoire.html
    │   │   ├── memoire.css
    │   │   ├── memoire.js
    │   │   ├── sounds/                # Musique + effets sonores (5 fichiers)
    │   │   └── images/                # Cartes animaux + favicon (11 fichiers)
    │   │
    │   ├── chasse-banane/             # Chasse Bananes (Canvas POO)
    │   │   ├── chasse.html
    │   │   ├── css/
    │   │   │   └── style.css
    │   │   ├── js/                    # Architecture modulaire
    │   │   │   ├── script.js          # Game loop principal
    │   │   │   ├── banana.js          # Classe Banana
    │   │   │   ├── handler.js         # Gestion inputs
    │   │   │   └── particle.js        # 
    │   │   └── assets/                # 
    │   │
    │   └── sandy-snake/               # Charming Dunes (Canvas)
    │       ├── snake.html
    │       ├── snake.css
    │       ├── snake.js
    │       └── assets/                # Décors désert, mascotte (4 fichiers)
    │
    └── assets/                        # Assets partagés (logo, globe, previews)
```

**Séparation par jeu :**  
Chaque jeu dispose de son propre dossier contenant tous ses fichiers (HTML, CSS, JS) et ses ressources organisées dans des sous-dossiers dédiés (`sounds/`, `images/`, `assets/`).
 
On a choisi cette organisation en appliquant les principes vus en cours : chaque jeu est autonome, ce qui facilite la maintenance et permet de travailler sur un jeu sans toucher aux autres.


## 🎲 Les Trois Jeux

### 🧊 Mémoire Arctique (Alaska)

![Aperçu Mémoire Arctique](./frontend/assets/preview-memoire.png)

Un jeu de memory revisité où le joueur doit retrouver des paires d'éléments arctiques en un minimum de coups.

**Technologie :** Manipulation du DOM + CSS 3D  
**Progression :** 3 niveaux de difficulté croissante (8, 12, puis 20 cartes)

**Fonctionnalités :**

- Animation 3D de retournement des cartes
- Grille adaptative des cartes selon le niveau
- Musique d'ambiance, effets sonores, design entièrement personnalisé selon le thème
- Timer et compteur de coups

**🎮 [Jouer à Mémoire Arctique](https://worldoffun.vercel.app/jeux/memoire/memoire.html)**

---

### 🍌 Chasse Bananes (Amazonie)

![Aperçu Chasse Bananes](./frontend/assets/preview-chasse.png)

Un jeu de réflexes et de rapidité où le joueur doit attraper des fruits qui tombent du haut de l'écran en cliquant dessus.

**Technologie :** Canvas 2D + Architecture POO  
**Système de points :** Banane jaune (50), verte (100), régime (200), ananas (500)

**Fonctionnalités :**

- 4 types de fruits avec propriétés différentes
- Système de confettis animés lors du clic
- Architecture orientée objet (classes)
- Détection de collision adaptée selon le fruit
- Chargement asynchrone des images

**🎮 [Jouer à Chasse Bananes](https://worldoffun.vercel.app/jeux/chasse-banane/chasse.html)**

---

### 🐍 Charming Dunes (Sahara)

![Aperçu Charming Dunes](./frontend/assets/preview-snake.png)

Un jeu de type Snake dans un environnement désertique. Le serpent grandit au fur et à mesure qu'il mange, et le joueur doit éviter les obstacles et les bords de l'écran.


**Technologie :** Canvas 2D + Contrôles multiples  
**Éléments :** Scarabée (+1), Cactus (-1 vie), Oasis (+1 vie), Relique (invincibilité)

**Fonctionnalités :**

- Logique Snake avec mécaniques personnalisées
- Contrôles souris, clavier, joystick tactile
- Système de vies et invincibilité
- Thème désertique entièrement personnalisé

**🎮 [Jouer à Charming Dunes](https://worldoffun.vercel.app/jeux/sandy-snake/snake.html)**


## 👥 Répartition du Travail (50/50)

### Acile EL DADA - 50%

**Développement complet de Mémoire Arctique :**
- Implémentation de la logique de jeu (détection des paires, gestion de l'état)
- Création des animations 3D pour le retournement des cartes
- Développement du système de niveaux progressifs avec grilles adaptatives
- Intégration de la musique d'ambiance et des effets sonores
- Mise en place du système anti-spam pour les clics
- Création de l'effet de neige animé

**Développement complet de Chasse Bananes :**

- Conception de l'architecture orientée objet (classes Banana, Particle, Handler)
- Développement du système de rendu Canvas 2D
- Implémentation des algorithmes de détection de collision
- Création du système de confettis lors de la capture
- Mise en place du chargement asynchrone des ressources
- Gestion des inputs utilisateur (souris et clavier)

**Contributions transversales :**

- Création des favicons spécifiques à chaque jeu
- Amélioration éléments visuels de la page d'accueil (Cartes de prévisualisation qui s'affichent au survol des pins, animations pins avec noms)
- Tests et débogage des deux jeux


--- 

### Saadeddine DOUGHANE — 50%

**Développement de la page d'accueil :**

- Système de navigation avec globe interactif
- Pins positionnés sur les régions (Alaska, Amazonie, Sahara)
- Robot mascotte avec effet de flottement animé
- Bulle de dialogue d'accueil
- Design responsive et animations fluides


**Développement complet de Charming Dunes (Snake du Sahara) :**

- Implémentation de la logique Snake complète (mouvement, croissance)
- Système de rendu Canvas 2D avec thème désertique
- Gestion des contrôles multiples (souris, clavier WASD/flèches, joystick tactile)
- Création du joystick virtuel qui s'affiche automatiquement sur mobile
- Intégration des 4 types d'éléments de gameplay :
  - Scarabée : +1 score
  - Cactus : -1 vie
  - Oasis : +1 vie
  - Relique : invincibilité temporaire (3 secondes)
- Système de vies et gestion de l'invincibilité
- Design visuel complet (curseur flûte personnalisé, mascotte suricate)

**Système d'authentification :**
- Pages inscription et connexion (`auth.html`)
- Gestion des comptes utilisateurs (`account.html`)
- Intégration avec le système de scores

**Dashboard des scores :**
- Affichage du top 10 par jeu
- Score global cumulé
- Interface de classement avec design cohérent

**Contributions transversales :**
- Architecture générale du site (navigation entre les pages)
- Design global et cohérence visuelle
- Déploiement sur Vercel avec configuration automatique
- Gestion du repository GitHub (commits, branches)


## 🔧 Difficultés Rencontrées et Solutions

### Mémoire Arctique

#### 1. Gestion des clics concurrents

**Problème :** Sans système de contrôle, le joueur pouvait cliquer sur plusieurs cartes en même temps, ce qui provoquait des incohérences lors de la partie.

**Solution :** Pour ce faire, j'ai créé une variable booléenne `peutCliquer` qui agit comme un verrou. Lorsque deux cartes sont retournées, cette variable passe à `false` et bloque tous les nouveaux clics pendant la durée de vérification qui est de 1 seconde. Une fois la vérification terminée, le verrou est levé.

#### 2. Animation 3D des cartes

**Problème :** Les deux faces de la carte (avant et arrière) étaient visibles simultanément lors du retournement, cela rendait l'affichage moins esthétique.

**Solution :** Pour améliorer le rendu visuel, j'ai utilisé la propriété CSS `backface-visibility: hidden` pour masquer la face non visible. Elle consiste en deux `<div>` : un pour la face avant (verso de la carte) et un pour la face arrière (recto de la carte), cette dernière étant pré-retournée à 180°. Donc maintenant, lors de la rotation, seulement la face concernée est visible.

#### 3. Adaptation de la grille aux différents niveaux

**Problème :** Au niveau 3, le jeu passe à 20 cartes au total. Donc conserver la même disposition que les niveaux précédents rendait l'interface chargée et moins intuitive.

**Solution :** Pour rendre la partie plus harmonieuse, j'ai utilisé un système de classes CSS dynamiques appliquées selon le niveau. Le niveau 3 utilise une grille à 5 colonnes au lieu de 4 pour optimiser l'utilisation de l'espace disponible sur l'écran.

--- 

### Chasse Bananes

#### 1. Chargement asynchrone des ressources

**Problème :** Si le jeu démarre avant que toutes les images soient chargées, le Canvas tente de dessiner des ressources qui n'existent pas, ce qui provoquait des erreurs.

**Solution :** J'ai implémenté une méthode statique `loadImages()`. Cette fonction charge les quatre images en parallèle et utilise un compteur pour vérifier que toutes les ressources sont disponibles. Le jeu n'est initialisé seulement après cette étape.

#### 2. Détection de collision précise

**Problème :** Les bananes ont une forme allongée tandis que l'ananas est circulaire. Une seule méthode de détection ne convenait pas à tous les objets lors du clic pour les attraper.

**Solution :** Donc il a fallu implémenter deux algorithmes différents, qui soient adaptés à chaque situation.

- **Collision rectangulaire** pour les bananes : vérification que les coordonnées du clic se situent dans les limites de la box de l'objet

- **Collision circulaire** pour l'ananas : calcul de la distance entre le point de clic et le centre de l'objet puis comparaison avec le rayon

#### 3. Architecture du code

**Problème :** Avec quatre types de fruits ayant des propriétés différentes, une approche procédurale aurait généré un code avec de nombreuses lignes répétées.

**Solution :** J'ai alors adopté une architecture orientée objet avec une classe `Banana` que j'ai pu réutilisée. 

Chaque fruit est une instance de cette classe, puis la méthode `setPropertiesByType()` configure automatiquement les propriétés du fruit (vitesse, points, taille, image) selon le type passé au constructeur. 

Cette approche rend le code :
- Réutilisable (création d'un fruit = une ligne)
- Maintenable (modification d'un type = un seul endroit dans le code)
- Extensible (ajout d'un nouveau fruit = ajout d'un cas dans le switch)


---

### Page d'accueil 

#### Effet de flottement du personnage

**Problème :** Créer un effet de flottement réaliste pour le robot mascotte sur la page d'accueil.

**Solution :** Utilisation d'animations CSS avec `@keyframes` pour simuler un mouvement vertical fluide avec un effet de flottement. L'animation alterne entre une position haute et basse avec une courbe d'accélération (`ease-in-out`) pour un effet naturel.

---

### Charming Dunes

#### Gestion des collisions

**Problème :** Au départ, la détection de collision utilisait un simple compteur pour savoir combien de segments avait le serpent.

Le problème, c'est que ce compteur ne représentait pas la vraie forme du serpent à l'écran. Alors parfois, le serpent mourait sans qu'on le voie toucher quoi que ce soit, et parfois il passait à travers son propre corps sans mourir. C'était frustrant et le jeu ne semblait pas cohérent.

**Solution :** J'ai complètement changé la manière de détecter les collisions. Maintenant, j'utilise la vraie trajectoire du serpent (le `trail`), c'est-à-dire toutes les positions par lesquelles il est passé. 

J'ai créé une fonction qui calcule la distance entre la tête du serpent et chaque partie de son corps. Les quelques segments juste derrière la tête sont ignorés, sinon le serpent mourrait dès qu'il tourne. Maintenant, quand le joueur voit le serpent se toucher, il meurt vraiment. 


## 🎯 Justification des Choix Techniques

### Choix des jeux

Nous avons voulu développer un trio de jeux qui ait un sens, et pas le même genre. Après un temps de réflexion, nous avons convenu de trois jeux qui soient différents en terme de type : pas uniquement des jeux d'arcade,ni uniquement de jeux intellectuels et finalement nous avons réussi à trouver le combo parfait en combinant jeu de mémoire, jeu de rapidité et jeu de réflexion.

Le tout, organisé autour d'un tour du monde dynamique avec chaque jeu personnalisé selon son thème (sons, fond, animations...).


## Technologies et Outils

**Langages et APIs :**
- HTML5 (structure)
- CSS3 (styles, animations, transforms 3D)
- JavaScript ES6+ (logique, POO, modules)
- Canvas API (rendu 2D pour Chasse Bananes et Snake)
- Free Sound (musique et effets sonores)

**Outils de développement :**
- Visual Studio Code (éditeur de code)
- Live Server (tests en local)
- GitHub (versionning et collaboration)

**Déploiement :**
- Vercel (hébergement et déploiement continu)


## 🤖 Utilisation d'Assistants IA

Nous avons utilisé Claude AI et ChatGPT comme outils pour :

- Déboguer des erreurs spécifiques
- Aide pour les concepts techniques et calculs complexes
- Optimiser des parties du code 
- Générer les éléments visuels comme les mascottes
- Obtenir des explications sur les bonnes pratiques


## 📧 Contact

**Acile EL DADA** : acile.eldada@etu.univ-cotedazur.fr  
**Saadeddine DOUGHANE** : saadeddine.doughane@etu.univ-cotedazur.fr

---

**World Of Fun © 2026 — Projet Pédagogique L3 MIASHS**

