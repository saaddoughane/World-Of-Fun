const NIVEAUX= {
    1:{ paires: 4, images: ['ours-polaire.png', 'igloo.png', 'pingouin.png', 'renne.png'] },
    2:{ paires: 6, images: ['ours-polaire.png', 'igloo.png', 'pingouin.png', 'renne.png', 'baleine.png', 'poisson.png'] },

    3: { paires: 10, images: ['ours-polaire.png', 'igloo.png', 'pingouin.png', 'renne.png', 'baleine.png', 'poisson.png', 'esquimau.png', 'aurore-boreale.png', 'otarie.png', 'elf.png'] }
};

let niveauActuel= 1;
let cartes = [];
let cartesRetournees = [];

let cartesTrouvees= [];
let coups = 0;
let temps= 0;

let timerInterval = null;
let jeuDemarre = false;


const selectionNiveau = document.getElementById('selectionNiveau');
const zoneJeu = document.getElementById('zoneJeu');

const grilleCartes = document.getElementById('grilleCartes');
const niveauActuelElement = document.getElementById('niveauActuel');
const coupsElement = document.getElementById('coups');
const tempsElement = document.getElementById('temps');
const btnRecommencer = document.getElementById('btnRecommencer');

const btnChangerNiveau = document.getElementById('btnChangerNiveau');
const modalVictoire = document.getElementById('modalVictoire');
const btnNiveauSuivant = document.getElementById('btnNiveauSuivant');
const btnRejouer = document.getElementById('btnRejouer');

const btnMenuNiveaux = document.getElementById('btnMenuNiveaux');
const coupsFinaux = document.getElementById('coupsFinaux');
const tempsFinaux = document.getElementById('tempsFinaux');


document.querySelectorAll('.niveau-card').forEach(card =>{
    card.addEventListener('click', () => {
        niveauActuel = parseInt(card.dataset.niveau);
        demarrerNiveau(niveauActuel);
    });
});

function demarrerNiveau(niveau) {
    niveauActuel = niveau;
    selectionNiveau.style.display = 'none';
    zoneJeu.style.display = 'block';
    niveauActuelElement.textContent = niveau;
    

    grilleCartes.className = 'grille-cartes niveau-' + niveau;
    
    reinitialiser();
    creerGrille();
}

function melangerCartes() {
    cartes.sort(() => Math.random() - 0.5);
}

function creerGrille() {
    grilleCartes.innerHTML = '';
    
    const imagesNiveau = NIVEAUX[niveauActuel].images;
    cartes = [...imagesNiveau, ...imagesNiveau]; // Dupliquer
    melangerCartes();
    
    cartes.forEach((nomImage, index) => {
        const carte = document.createElement('div');
        carte.classList.add('carte');
        carte.dataset.index = index;
        carte.dataset.image = nomImage;
        
        carte.innerHTML = `
            <div class="face face-avant"></div>
            <div class="face face-arriere">
                <img src="./images/${nomImage}" alt="image arctique">
            </div>
        `;
        
        carte.addEventListener('click', retournerCarte);
        grilleCartes.appendChild(carte);
    });
}

function demarrerTimer() {
    if (!jeuDemarre) {
        jeuDemarre = true;
        timerInterval = setInterval(() => {
            temps++;
            const minutes = Math.floor(temps / 60).toString().padStart(2, '0');
            const secondes = (temps % 60).toString().padStart(2, '0');
            tempsElement.textContent = `${minutes}:${secondes}`;
        }, 1000);
    }
}

function arreterTimer() {
    clearInterval(timerInterval);
    jeuDemarre = false;
}

function retournerCarte() {
    demarrerTimer();
    
    if (cartesRetournees.length === 2) return;
    if (this.classList.contains('retournee')) return;
    if (this.classList.contains('trouvee')) return;
    
    this.classList.add('retournee');
    cartesRetournees.push(this);
    
    if (cartesRetournees.length === 2) {
        coups++;
        coupsElement.textContent = coups;
        verifierPaire();
    }
}

function verifierPaire() {
    const [carte1, carte2] = cartesRetournees;
    const image1 = carte1.dataset.image;
    const image2 = carte2.dataset.image;
    
    if (image1 === image2) {
        setTimeout(() => {
            // IMPORTANT : On garde les cartes retournées (côté image)
            // et on ajoute juste la classe "trouvee" pour griser
            carte1.classList.add('trouvee');
            carte2.classList.add('trouvee');
            cartesTrouvees.push(carte1, carte2);
            cartesRetournees = [];
            
            if (cartesTrouvees.length === cartes.length) {
                victoire();
            }
        }, 500);
    } else {
        setTimeout(() => {
            carte1.classList.remove('retournee');
            carte2.classList.remove('retournee');
            cartesRetournees = [];
        }, 1000);
    }
}

function victoire() {
    arreterTimer();
    
    const score = {
        nomJeu: 'Mémoire arctique',
        niveau: niveauActuel,
        coups: coups,
        temps: temps,
        date: new Date().toISOString(),
        utilisateur: sessionStorage.getItem('userEmail') || 'Invité'
    };
    
    let scores = JSON.parse(sessionStorage.getItem('scores')) || [];
    scores.push(score);
    sessionStorage.setItem('scores', JSON.stringify(scores));
    
    coupsFinaux.textContent = coups;
    const minutes = Math.floor(temps / 60).toString().padStart(2, '0');
    const secondes = (temps % 60).toString().padStart(2, '0');
    tempsFinaux.textContent = `${minutes}:${secondes}`;
    

    if (niveauActuel === 3) {
        btnNiveauSuivant.style.display = 'none';
    } 
    
    else {
        btnNiveauSuivant.style.display = 'block';
    }
    
    modalVictoire.classList.add('active');
}

function reinitialiser() {
    cartesRetournees = [];
    cartesTrouvees = [];
    coups = 0;
    temps = 0;
    jeuDemarre = false;
    arreterTimer();
    
    coupsElement.textContent = '0';
    tempsElement.textContent = '00:00';
}

function recommencer() {
    modalVictoire.classList.remove('active');
    reinitialiser();
    creerGrille();
}

function retourMenuNiveaux() {
    modalVictoire.classList.remove('active');
    zoneJeu.style.display = 'none';
    selectionNiveau.style.display = 'grid';
    reinitialiser();
}

function niveauSuivant() {
    if (niveauActuel < 3) {
        niveauActuel++;
        modalVictoire.classList.remove('active');
        demarrerNiveau(niveauActuel);
    }
}


btnRecommencer.addEventListener('click', recommencer);
btnChangerNiveau.addEventListener('click', retourMenuNiveaux);
btnRejouer.addEventListener('click', recommencer);
btnMenuNiveaux.addEventListener('click', retourMenuNiveaux);
btnNiveauSuivant.addEventListener('click', niveauSuivant);


function creerFlocons() {
    const container = document.getElementById('neige-container');
    const nombreFlocons = 35;
    
    for (let i = 0; i < nombreFlocons; i++) {
        const flocon = document.createElement('div');
        flocon.classList.add('flocon');
        flocon.textContent = '❄️';
        
        const tailles = ['petit', 'moyen', 'grand'];
        flocon.classList.add(tailles[Math.floor(Math.random() * tailles.length)]);
        
        flocon.style.left = Math.random() * 100 + '%';
        flocon.style.animationDuration = (Math.random() * 13 + 12) + 's';
        flocon.style.animationDelay = (Math.random() * 8) + 's';
        
        container.appendChild(flocon);
    }
}

if (window.innerWidth > 768) {
    creerFlocons();
}