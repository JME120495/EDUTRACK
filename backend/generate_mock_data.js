const xlsx = require('xlsx');
const fs = require('fs');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomGauss(mean, stdev) {
    let u = 1 - Math.random(); 
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
}

const num_students = 1000;
const num_teachers = 60;

const classes_list = [
    "SIL", "CP", "CE1", "CE2", "CM1", "CM2", 
    "6ème", "5ème", "4ème", "3ème", 
    "2nde A", "2nde C", "1ère A", "1ère C", "1ère D", 
    "Terminale A", "Terminale C", "Terminale D"
];

const matieres = [
    ["Mathématiques", "Mathematics", "MATH", 4, 6],
    ["Français", "French", "FRAN", 4, 4],
    ["Anglais", "English", "ANGL", 3, 4],
    ["Physique", "Physics", "PHYS", 3, 4],
    ["Chimie", "Chemistry", "CHIM", 2, 3],
    ["SVT", "Biology", "SVT", 3, 4],
    ["Histoire", "History", "HIST", 2, 2],
    ["Géographie", "Geography", "GEOG", 2, 2],
    ["Philosophie", "Philosophy", "PHIL", 2, 4],
    ["EPS", "Sports", "EPS", 2, 2],
    ["Informatique", "Computer Science", "INFO", 2, 2],
    ["Allemand", "German", "ALL", 2, 2],
    ["Espagnol", "Spanish", "ESP", 2, 2],
    ["ECM", "Citizenship", "ECM", 1, 1],
    ["Comptabilité", "Accounting", "COMP", 3, 4],
    ["Économie", "Economics", "ECON", 3, 4]
];

const villes = ["Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Buea", "Kribi", "Limbe", "Dschang", "Kumba", "Edea"];
const quartiers = ["Bastos", "Akwa", "Bonanjo", "Deido", "Mokolo", "Biyem-Assi", "Tsinga", "Bonamoussadi", "Makepe", "Odza", "Ngousso"];

const first_names_m = ["Jean", "Paul", "Pierre", "Marc", "Luc", "Jacques", "Michel", "Alain", "Bernard", "Christian", "Daniel", "Emmanuel", "François", "Georges", "Henri", "Joseph", "Louis", "Marcel", "Nicolas", "Patrick", "Richard", "Serge", "Thierry", "Vincent", "Yves", "Boris", "Cédric", "Eric", "Fabrice", "Gilles", "Hervé", "Joël", "Lionel", "Martial", "Olivier", "Patrice", "René", "Stéphane", "Victor", "William"];
const first_names_f = ["Marie", "Jeanne", "Anne", "Jacqueline", "Catherine", "Monique", "Sylvie", "Martine", "Suzanne", "Chantal", "Brigitte", "Nicole", "Céline", "Isabelle", "Valérie", "Christine", "Sophie", "Nathalie", "Véronique", "Sandrine", "Béatrice", "Florence", "Patricia", "Corinne", "Laurence", "Cécile", "Françoise", "Annie", "Caroline", "Evelyne", "Geneviève", "Hélène", "Juliette", "Lucie", "Madeleine", "Odile", "Pauline", "Rosalie", "Thérèse", "Yvonne"];
const last_names = ["Kamga", "Fotsing", "Talla", "Mvondo", "Ndi", "Awono", "Ondoa", "Mba", "Biya", "Fouda", "Mbia", "Eto'o", "Song", "Njitap", "Geremi", "Aboubakar", "Choupo", "Moting", "Onana", "Zambo", "Anguissa", "Ngadeu", "Fai", "Nouhou", "Tolo", "Castelleto", "Oum", "Gouet", "Hongla", "Kunde", "Malong", "Toko", "Ekambi", "Ngapandouetnbu", "Epassy", "Ondoa", "Nkoulou", "Mbaizo", "Wooh", "Tchato", "Mba", "Njie", "Tchuente", "Fotso", "Pouaty", "Ndoumbe", "Mboma", "Kalla", "Wome", "Lauren"];

function generateName(gender) {
    if (!gender) gender = randomChoice(['M', 'F']);
    const fn = gender === 'M' ? randomChoice(first_names_m) : randomChoice(first_names_f);
    const ln = randomChoice(last_names);
    return `${fn} ${ln}`;
}

function generatePhone() {
    const prefixes = ["67", "69", "65", "68"];
    let num = randomChoice(prefixes);
    for(let i=0; i<7; i++) num += randomInt(0,9).toString();
    return num;
}

const wb = xlsx.utils.book_new();

// 1. CLASSES
let extended_classes = [];
for (let c of classes_list) {
    extended_classes.push(c.includes("A") || c.includes("C") || c.includes("D") ? c : `${c} A`);
    extended_classes.push(c.includes("A") || c.includes("C") || c.includes("D") ? c : `${c} B`);
}
extended_classes = [...new Set(extended_classes)];

const wsClassesData = [["Nom de la Classe"]];
for (let c of extended_classes) wsClassesData.push([c]);
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(wsClassesData), "Classes");

// 2. ENSEIGNANTS
const wsTeachersData = [["Nom complet", "Email", "Téléphone", "Ville", "Quartier"]];
for(let i=0; i<num_teachers; i++) {
    const name = generateName();
    const email = `${name.toLowerCase().replace(/ /g, '.').replace(/'/g, '')}@ecole.cm`;
    wsTeachersData.push([name, email, generatePhone(), randomChoice(villes), randomChoice(quartiers)]);
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(wsTeachersData), "Enseignants");

// 3. MATIERES
const wsMatieresData = [["Nom (FR)", "Nom (EN)", "Code", "Coefficient", "Heures par semaine"]];
for (let m of matieres) wsMatieresData.push(m);
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(wsMatieresData), "Matieres");

// 4. ELEVES
const wsElevesData = [[
    "Nom complet", "Matricule", "Classe", "Sexe (M/F)", 
    "Date Naissance", "Lieu Naissance", "Adresse", "Statut (ACTIVE/INACTIVE)", 
    "Malade (Oui/Non)", "Handicap (Oui/Non)", "Notes Médicales", 
    "Nom Parent", "Tel Parent", "Relation (FATHER/MOTHER/GUARDIAN)"
]];

const parents_list = [];
const parent_dict = {};
for(let i=0; i<650; i++) {
    const pName = generateName();
    parent_dict[pName] = generatePhone();
    parents_list.push(pName);
}

const students = [];
let matriculeCounter = 1000;

for(let i=0; i<num_students; i++) {
    const gender = randomChoice(['M', 'F']);
    const name = generateName(gender);
    const matricule = `MAT${matriculeCounter++}`;
    const student_class = randomChoice(extended_classes);
    
    let age = 12;
    if (student_class.includes("Terminale")) age = 18;
    else if (student_class.includes("1ère")) age = 17;
    else if (student_class.includes("2nde")) age = 16;
    else if (student_class.includes("3ème")) age = 15;
    else if (student_class.includes("4ème")) age = 14;
    else if (student_class.includes("5ème")) age = 13;
    else if (student_class.includes("6ème")) age = 12;
    else if (student_class.includes("CM2")) age = 11;
    else if (student_class.includes("CM1")) age = 10;
    else if (student_class.includes("CE2")) age = 9;
    else if (student_class.includes("CE1")) age = 8;
    else if (student_class.includes("CP")) age = 7;
    else if (student_class.includes("SIL")) age = 6;
    
    age += randomChoice([-1, 0, 0, 0, 1]);
    
    const birth_year = 2026 - age;
    const birth_month = randomInt(1, 12);
    const birth_day = randomInt(1, 28);
    const dob = `${birth_day.toString().padStart(2,'0')}/${birth_month.toString().padStart(2,'0')}/${birth_year}`;
    
    const lieu_naissance = randomChoice(villes);
    const adresse = `${randomChoice(quartiers)}, ${lieu_naissance}`;
    
    const malade = Math.random() < 0.05 ? "Oui" : "Non";
    const handicap = Math.random() < 0.02 ? "Oui" : "Non";
    
    let notes_med = "";
    if (malade === "Oui") notes_med = randomChoice(["Asthme sévère", "Allergie alimentaire", "Paludisme fréquent"]);
    if (handicap === "Oui") notes_med = randomChoice(["Léger handicap moteur", "Trouble de la vision"]);
    
    const parent_name = randomChoice(parents_list);
    const parent_phone = parent_dict[parent_name];
    const relation = randomChoice(["FATHER", "MOTHER", "FATHER", "MOTHER", "GUARDIAN"]);
    
    students.push({matricule, class: student_class, name});
    wsElevesData.push([name, matricule, student_class, gender, dob, lieu_naissance, adresse, "ACTIVE", malade, handicap, notes_med, parent_name, parent_phone, relation]);
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(wsElevesData), "Eleves");

// 5. NOTES
const wsNotesData = [["Matricule Eleve", "Code Matière", "Séquence (ex: Séquence 1)", "Trimestre (1, 2 ou 3)", "Note (/20)", "Remarque"]];
const sequences = [["Séquence 1", 1], ["Séquence 3", 2]];
const core_subjects = matieres.map(m => m[2]);

for (let s of students) {
    let base_score = randomGauss(11.5, 3.5);
    base_score = Math.max(3, Math.min(18, base_score));
    
    // Shuffle and pick 7
    let shuffled = core_subjects.sort(() => 0.5 - Math.random());
    let student_subjects = shuffled.slice(0, 7);
    
    for (let subj of student_subjects) {
        for (let seq of sequences) {
            let score = base_score + randomGauss(0, 2);
            score = Math.round(Math.max(0, Math.min(20, score)) * 100) / 100;
            
            let remarque = "Faible";
            if (score >= 16) remarque = "Excellent";
            else if (score >= 14) remarque = "Très Bien";
            else if (score >= 12) remarque = "Bien";
            else if (score >= 10) remarque = "Passable";
            else if (score >= 8) remarque = "Insuffisant";
            
            wsNotesData.push([s.matricule, subj, seq[0], seq[1], score, remarque]);
        }
    }
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(wsNotesData), "Notes");

// 6. ABSENCES
const wsAbsencesData = [["Matricule Eleve", "Date (JJ/MM/AAAA)", "Heures", "Justifiée (Oui/Non)", "Motif", "Retard (Oui/Non)", "Séquence (ex: Séquence 1)"]];
for (let i=0; i<5000; i++) {
    const student = randomChoice(students);
    const month = Math.random() < 0.5 ? randomInt(9,12) : randomInt(1,3);
    const day = randomInt(1,28);
    const year = month >= 9 ? 2025 : 2026;
    const date_str = `${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')}/${year}`;
    
    const heures = randomChoice([1, 2, 4, 8]);
    const justifie = Math.random() < 0.7 ? "Oui" : "Non";
    const motif = justifie === "Oui" ? randomChoice(["Maladie", "Problème familial", "Intempéries", ""]) : "";
    const retard = Math.random() < 0.3 ? "Oui" : "Non";
    const seq = month >= 9 && month <= 10 ? "Séquence 1" : month >= 11 && month <= 12 ? "Séquence 2" : "Séquence 3";
    
    wsAbsencesData.push([student.matricule, date_str, heures, justifie, motif, retard, seq]);
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(wsAbsencesData), "Absences");

// 7. PAIEMENTS
const wsPaiementsData = [["Matricule Eleve", "Montant", "Méthode (CASH/MOBILE_MONEY/WAVE/BANK)", "Date", "Référence Transaction", "Téléphone Payeur", "Remarque"]];
for (let s of students) {
    wsPaiementsData.push([s.matricule, 25000, "CASH", "05/09/2025", `REC-INS-${s.matricule}`, generatePhone(), "Inscription"]);
    if (Math.random() < 0.98) {
        wsPaiementsData.push([s.matricule, 50000, randomChoice(["MOBILE_MONEY", "CASH"]), "15/10/2025", `REC-TR1-${s.matricule}`, generatePhone(), "Première tranche"]);
    }
    if (Math.random() < 0.92) {
        wsPaiementsData.push([s.matricule, 45000, randomChoice(["MOBILE_MONEY", "WAVE", "BANK"]), "10/01/2026", `REC-TR2-${s.matricule}`, generatePhone(), "Deuxième tranche"]);
    }
    if (Math.random() < 0.60) {
        wsPaiementsData.push([s.matricule, 40000, randomChoice(["MOBILE_MONEY", "WAVE"]), "05/04/2026", `REC-TR3-${s.matricule}`, generatePhone(), "Troisième tranche"]);
    }
}
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(wsPaiementsData), "Paiements");

xlsx.writeFile(wb, "EduTrac_Demo_1000.xlsx");
console.log("Fichier EduTrac_Demo_1000.xlsx généré avec succès dans backend/");
