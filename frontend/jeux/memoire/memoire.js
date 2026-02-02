const images = [

    '/ours-polaire.png',
    'igloo.png',
    'pingouin.png',
    'renne.png',
    'baleine.png',
    'poisson.png',
    'esquimau.png',
    'aurore-boreale.png'

];

let cartes = [...images, ...images]; // on crée les 16 cartes (en 8 paires)


let cartesRetournees = []; // on peut retourner au max 2 cartes 
let cartesTrouvees= [];        

let coups = 0;                  
let temps= 0;        

let timerInterval= null;       
let jeuDemarre = false;         

const grilleCartes = document.getElementById('grilleCartes');
const coupsElement = document.getElementById('coups');
const tempsElement = document.getElementById('temps');
const btnRecommencer = document.getElementById('btnRecommencer');
const modalVictoire = document.getElementById('modalVictoire');
const btnRejouer = document.getElementById('btnRejouer');
const coupsFinaux = document.getElementById('coupsFinaux');
const tempsFinaux = document.getElementById('tempsFinaux');


function melangerCartes() {
    cartes.sort(()=> Math.random() - 0.5);
}

/* permet de créer la grille avec les 16 cartes */ 

function creerGrille() {
    grilleCartes.innerHTML = '';
    melangerCartes();
    
    cartes.forEach((nomImage, index) => {

        const carte = document.createElement('div');
        carte.classList.add('carte');
        carte.dataset.index = index;
        carte.dataset.image = nomImage;
        
        carte.innerHTML = `
            <div class="face face-avant">❄️</div>
            <div class="face face-arriere">
                <img src="./images/${nomImage}" alt="image arctique">
            </div>
        `;

        carte.addEventListener('click', retournerCarte);
        grilleCartes.appendChild(carte);
    });
}

/* au 1er clic, le timer est lance */ 

function demarrerTimer() {
    if (!jeuDemarre){

        jeuDemarre = true;
        timerInterval = setInterval(()=> {
            temps++;

            const minutes = Math.floor(temps / 60).toString().padStart(2, '0');
            const secondes = (temps % 60).toString().padStart(2, '0');

            tempsElement.textContent = `${minutes}:${secondes}`;

        },1000);
    }
}

function arreterTimer() {
    clearInterval(timerInterval);
    jeuDemarre = false;
}

function retournerCarte() {
    demarrerTimer();
    
    if (cartesRetournees.length === 2){
        return; // pas plus de 2 cartes 
    }

    if (this.classList.contains('retournee')) {
        return; // permet de ne pas recliquer sur la même carte 
    }
    
    if (this.classList.contains('trouvee')){
        return; //si la paire est déjà trouvé on ne peut pas la choisir de nouveau 
    }
    
    this.classList.add('retournee');
    cartesRetournees.push(this);
    
    //si 2 cartes sont retournées on vérifie si c'est une paire
    if (cartesRetournees.length === 2){
        coups++;
        coupsElement.textContent= coups;

        verifierPaire();
    }
}

/* vérifie si les 2 cartes retournées forment une paire */

function verifierPaire(){

    const [carte1, carte2]= cartesRetournees;
    const image1= carte1.dataset.image;
    const image2 = carte2.dataset.image;
    
    if (image1 === image2){

        setTimeout(() =>{
            carte1.classList.add('trouvee');
            carte2.classList.add('trouvee');
            cartesTrouvees.push(carte1, carte2);
            cartesRetournees = [];
            
            //si toutes les paires sont trouvées cest gagné 
            if (cartesTrouvees.length === cartes.length) {
                victoire();
            }
        }, 500);
    } 
    
    else{ //si ce n'est pas une paire on retourne les cartes
       
        setTimeout(() =>{
            carte1.classList.remove('retournee');
            carte2.classList.remove('retournee');
            cartesRetournees = [];
        }, 1000);
       }
}

/* victoire si toutes les paires sont bien trouvées */ 

function victoire() {
    arreterTimer();
    
    const score = {
        nomJeu: 'Mémoire arctique', 
        coups: coups,
        temps:temps,
        date: new Date().toISOString(),
        utilisateur: sessionStorage.getItem('userEmail') || 'Invité'
    };
    
    // enregistre dans sessionStorage
    let scores = JSON.parse(sessionStorage.getItem('scores')) || [];
    scores.push(score);
    sessionStorage.setItem('scores', JSON.stringify(scores));
    
    coupsFinaux.textContent = coups;
    const minutes = Math.floor(temps / 60).toString().padStart(2, '0');
    const secondes = (temps % 60).toString().padStart(2, '0');
    tempsFinaux.textContent = `${minutes}:${secondes}`;
    modalVictoire.classList.add('active');
}


function recommencer(){

    cartesRetournees =[];
    cartesTrouvees= [];
    coups= 0;
    temps= 0;
    jeuDemarre= false;
    arreterTimer();
    
    coupsElement.textContent= '0';
    tempsElement.textContent= '00:00';
    modalVictoire.classList.remove('active');
    
    creerGrille();// nouvelle grille avec nouvelles dispositions de cartes
}

btnRecommencer.addEventListener('click', recommencer);
btnRejouer.addEventListener('click', recommencer);

creerGrille();