
const NIVEAUX = [

    
    { id: 1, nbPaires: 4,  cols: 4, classe: 'niveau-1' },
    { id: 2, nbPaires: 6,  cols: 4, classe: 'niveau-2' },
    { id: 3, nbPaires: 10, cols: 5, classe: 'niveau-3' }
];

const IMAGES_CARTES = [


    './images/ours.png',
    './images/phoque.png',
    './images/pingouin.png',
    './images/renard.png',
    './images/baleine.png',
    './images/chouette.png',
    './images/caribou.png',
    './images/morse.png',
    './images/loup.png',
    './images/lapin.png'
];


let niveauIndex      = 0;
let cartesRetournees = [];
let cartesTrouvees   = 0;
let coups            = 0;
let secondes         = 0;
let timerInterval    = null;
let peutCliquer      = true;


const pageAccueil   = document.getElementById('pageAccueil');
const pageJeu       = document.getElementById('pageJeu');
const grilleCartes  = document.getElementById('grilleCartes');
const modalVictoire = document.getElementById('modalVictoire');
const modalFin      = document.getElementById('modalFin');

const elNiveau      = document.getElementById('niveauActuel');
const elCoups       = document.getElementById('coups');
const elTemps       = document.getElementById('temps');
const elCoupsFinaux = document.getElementById('coupsFinaux');
const elTempsFinaux = document.getElementById('tempsFinaux');


function melangerTableau(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function formaterTemps(s) {
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
}

function afficherAccueil() {


    pageAccueil.style.display  = 'flex';
    pageJeu.style.display      = 'none';
    modalVictoire.classList.remove('active');
    modalFin.classList.remove('active');
    clearInterval(timerInterval);
}


function initNiveau() {


    const niv    = NIVEAUX[niveauIndex];
    const paires = IMAGES_CARTES.slice(0, niv.nbPaires);
    const jeu    = melangerTableau([...paires, ...paires]);

    coups          = 0;
    secondes       = 0;
    cartesTrouvees = 0;
    cartesRetournees = [];
    peutCliquer    = true;

    elNiveau.textContent = niv.id;
    elCoups.textContent  = '0';
    elTemps.textContent  = '00:00';

    // Afficher page jeu
    pageAccueil.style.display = 'none';
    pageJeu.style.display     = 'flex';
    modalVictoire.classList.remove('active');
    modalFin.classList.remove('active');

    // Construire la grille
    grilleCartes.innerHTML = '';
    grilleCartes.className = `grille-cartes ${niv.classe}`;

    jeu.forEach(src => {
        const carte = document.createElement('div');
        carte.classList.add('carte');

        const faceAvant = document.createElement('div');
        faceAvant.classList.add('face', 'face-avant');

        const faceArriere = document.createElement('div');
        faceArriere.classList.add('face', 'face-arriere');

        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Animal arctique';
        faceArriere.appendChild(img);

        carte.appendChild(faceAvant);
        carte.appendChild(faceArriere);
        carte.dataset.src = src;

        carte.addEventListener('click', () => clicCarte(carte));
        grilleCartes.appendChild(carte);
    });

    // Timer
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        secondes++;
        elTemps.textContent = formaterTemps(secondes);
    }, 1000);
}


function clicCarte(carte) {

    if (!peutCliquer) return;
    if (carte.classList.contains('retournee')) return;
    if (carte.classList.contains('trouvee')) return;
    if (cartesRetournees.length >= 2) return;

    carte.classList.add('retournee');
    cartesRetournees.push(carte);

    if (cartesRetournees.length === 2) {
        coups++;
        elCoups.textContent = coups;
        peutCliquer = false;

        const [c1, c2] = cartesRetournees;

        if (c1.dataset.src === c2.dataset.src) {
            // Paire trouvée
            
            setTimeout(() => {

                c1.classList.add('trouvee');
                c2.classList.add('trouvee');
                cartesTrouvees += 2;
                cartesRetournees = [];
                peutCliquer = true;

                const totalCartes = NIVEAUX[niveauIndex].nbPaires * 2;
                
                if (cartesTrouvees === totalCartes) {
                    clearInterval(timerInterval);
                    setTimeout(() => afficherVictoire(), 500);
                }
            }, 400);
        } 
        
        else {

            // Pas une paire
            setTimeout(() => {
                c1.classList.remove('retournee');
                c2.classList.remove('retournee');
                cartesRetournees = [];
                peutCliquer      = true;
            }, 1000);
        }
    }


}


function afficherVictoire() {
    elCoupsFinaux.textContent = coups;
    elTempsFinaux.textContent = formaterTemps(secondes);

    const btnSuivant = document.getElementById('btnSuivant');

    if (niveauIndex < NIVEAUX.length - 1) {
        btnSuivant.textContent = `Niveau ${NIVEAUX[niveauIndex].id + 1} →`;
        btnSuivant.style.display = 'block';
    } else {
        btnSuivant.style.display = 'none';
    }

    modalVictoire.classList.add('active');
}



// Jouer
document.getElementById('btnJouer').addEventListener('click', () => {
    niveauIndex = 0;
    initNiveau();
});

// Titre → retour accueil
document.getElementById('titrePrincipal').addEventListener('click', () => {
    afficherAccueil();
});

// Recommencer
document.getElementById('btnRecommencer').addEventListener('click', () => {
    initNiveau();
});

// Menu
document.getElementById('btnMenu').addEventListener('click', () => {
    afficherAccueil();
});

// Niveau suivant
document.getElementById('btnSuivant').addEventListener('click', () => {
    if (niveauIndex < NIVEAUX.length - 1) {
        niveauIndex++;
        initNiveau();
    } else {
        modalVictoire.classList.remove('active');
        modalFin.classList.add('active');
    }
});

// Rejouer ce niveau
document.getElementById('btnRejouer').addEventListener('click', () => {
    modalVictoire.classList.remove('active');
    initNiveau();
});

// Rejouer depuis le début
document.getElementById('btnDebut').addEventListener('click', () => {
    niveauIndex = 0;
    modalFin.classList.remove('active');
    afficherAccueil();
});


document.addEventListener('keydown', e => {
    if (e.code === 'Space' && pageAccueil.style.display !== 'none') {
        e.preventDefault();
        niveauIndex = 0;
        initNiveau();
    }
    if (e.code === 'Escape' && pageJeu.style.display !== 'none') {
        afficherAccueil();
    }
});



const conteneurNeige = document.getElementById('neige-container');
for (let i = 0; i < 30; i++) {
    const flocon   = document.createElement('div');
    const tailles  = ['petit', 'moyen', 'grand'];
    flocon.classList.add('flocon', tailles[Math.floor(Math.random() * 3)]);
    flocon.textContent             = '❄';
    flocon.style.left              = `${Math.random() * 100}%`;
    flocon.style.animationDuration = `${6 + Math.random() * 12}s`;
    flocon.style.animationDelay    = `${Math.random() * 10}s`;
    conteneurNeige.appendChild(flocon);
}