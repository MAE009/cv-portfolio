// ===== GESTION DE LA PERSISTANCE DES DONNÉES =====
// Remplacez la variable cvData par des appels API
const API_URL = 'https://cv-portfolio-api.onrender.com';

// Charger les données depuis le localStorage ou utiliser les données par défaut
function loadCVData() {
    const savedData = localStorage.getItem('cvData');
    if (savedData) {
        return JSON.parse(savedData);
    } else {
        // Données par défaut depuis cv.json
        return {
            cvs: [
                {
                    id: 1,
                    nom: "MAYALA Armand Emmanuel",
                    type: "Moderne",
                    entreprise: "TechCorp",
                    description: "CV moderne avec une approche design et des compétences techniques.",
                    fichier: "uploads/MAYALA_CV_cv_etudiant.pdf",
                    date_ajout: "2025-06-15"
                },
                {
                    id: 2,
                    nom: "MAYALA Armand Emmanuel",
                    type: "ATS",
                    entreprise: "FinancePlus",
                    description: "CV optimisé pour les systèmes ATS, parfait pour les grandes entreprises.",
                    fichier: "uploads/MAYALA_CV_cv_etudiant_ats.pdf",
                    date_ajout: "2025-06-16"
                }
            ]
        };
    }
}

// Sauvegarder les données dans le localStorage
function saveCVData() {
    localStorage.setItem('cvData', JSON.stringify(cvData));
    console.log('Données sauvegardées:', cvData); // Pour déboguer
}

// Initialiser les données
let cvData = loadCVData();
let currentEditId = null;

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page chargée, données chargées:', cvData);

    if (document.getElementById('liste-cv')) {
        afficherCVAccueil();
        setupFiltres();
    }

    if (document.getElementById('admin-liste-cv')) {
        afficherCVAdmin();
        setupFormulaire();
        setupDragAndDrop();
    }

    // Pour déboguer : afficher les données dans la console
    console.log('CV disponibles:', cvData.cvs.length);
});


// Charger les CV
async function loadCVs() {
  const response = await fetch(`${API_URL}/cvs`);
  return await response.json();
}

// Ajouter un CV
async function addCV(cv) {
  const response = await fetch(`${API_URL}/cvs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cv)
  });
  return await response.json();
}

// Modifier un CV
async function updateCV(id, cv) {
  const response = await fetch(`${API_URL}/cvs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cv)
  });
  return await response.json();
}

// Supprimer un CV
async function deleteCV(id) {
  await fetch(`${API_URL}/cvs/${id}`, {
    method: 'DELETE'
  });
}

// ===== FONCTIONS PAGE ACCUEIL =====
function afficherCVAccueil() {
    const container = document.getElementById('liste-cv');
    if (!container) return;

    container.innerHTML = '';

    if (cvData.cvs.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-file-alt"></i>
                <p>Aucun CV disponible pour le moment</p>
            </div>
        `;
        return;
    }

    cvData.cvs.forEach(cv => {
        const cvCard = document.createElement('div');
        cvCard.className = 'cv-card';
        cvCard.innerHTML = `
            <div class="cv-card-header">
                <h3 class="cv-name">${cv.nom}</h3>
                <span class="cv-badge badge-${cv.type.toLowerCase()}">${cv.type}</span>
            </div>
            <div class="cv-card-body">
                <div class="cv-company">
                    <i class="fas fa-building"></i>
                    <span>${cv.entreprise}</span>
                </div>
                <p class="cv-description">${cv.description}</p>
            </div>
            <div class="cv-footer">
                <div class="cv-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Ajouté le ${formatDate(cv.date_ajout)}</span>
                </div>
                <button class="btn-view" onclick="window.open('${cv.fichier}', '_blank')">
                    <i class="fas fa-eye"></i> Voir le CV
                </button>
            </div>
        `;
        container.appendChild(cvCard);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

function setupFiltres() {
    const filtreType = document.getElementById('filtre-type');
    const recherche = document.getElementById('recherche');

    if (filtreType) {
        filtreType.addEventListener('change', filtrerCV);
    }

    if (recherche) {
        recherche.addEventListener('input', filtrerCV);
    }
}

function filtrerCV() {
    const type = document.getElementById('filtre-type').value;
    const recherche = document.getElementById('recherche').value.toLowerCase();

    const container = document.getElementById('liste-cv');
    container.innerHTML = '';

    const cvsFiltres = cvData.cvs.filter(cv => {
        const matchType = type === 'tous' || cv.type === type;
        const matchRecherche = cv.nom.toLowerCase().includes(recherche) ||
                              cv.entreprise.toLowerCase().includes(recherche);
        return matchType && matchRecherche;
    });

    if (cvsFiltres.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Aucun CV trouvé</p>
            </div>
        `;
        return;
    }

    cvsFiltres.forEach(cv => {
        const cvCard = document.createElement('div');
        cvCard.className = 'cv-card';
        cvCard.innerHTML = `
            <div class="cv-card-header">
                <h3 class="cv-name">${cv.nom}</h3>
                <span class="cv-badge badge-${cv.type.toLowerCase()}">${cv.type}</span>
            </div>
            <div class="cv-card-body">
                <div class="cv-company">
                    <i class="fas fa-building"></i>
                    <span>${cv.entreprise}</span>
                </div>
                <p class="cv-description">${cv.description}</p>
            </div>
            <div class="cv-footer">
                <div class="cv-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Ajouté le ${formatDate(cv.date_ajout)}</span>
                </div>
                <button class="btn-view" onclick="window.open('${cv.fichier}', '_blank')">
                    <i class="fas fa-eye"></i> Voir
                </button>
            </div>
        `;
        container.appendChild(cvCard);
    });
}

// ===== FONCTIONS ADMIN =====
function afficherCVAdmin() {
    const container = document.getElementById('admin-liste-cv');
    if (!container) return;

    container.innerHTML = '';

    if (cvData.cvs.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-folder-open"></i>
                <p>Aucun CV dans la base de données</p>
            </div>
        `;
        return;
    }

    cvData.cvs.forEach(cv => {
        const item = document.createElement('div');
        item.className = 'admin-cv-item';
        item.innerHTML = `
            <div class="admin-cv-info">
                <h4>${cv.nom}</h4>
                <p>
                    <span><i class="fas fa-tag"></i> ${cv.type}</span>
                    <span><i class="fas fa-building"></i> ${cv.entreprise}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(cv.date_ajout)}</span>
                </p>
            </div>
            <div class="admin-cv-actions">
                <button class="btn-edit" onclick="modifierCV(${cv.id})">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn-delete" onclick="supprimerCV(${cv.id})">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

function setupFormulaire() {
    const form = document.getElementById('cv-form');
    const btnAnnuler = document.getElementById('btn-annuler');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const nom = document.getElementById('nom').value.trim();
            const type = document.getElementById('type').value;
            const entreprise = document.getElementById('entreprise').value.trim();
            const description = document.getElementById('description').value.trim();
            const fichier = document.getElementById('fichier').files[0];

            if (!nom || !type || !entreprise || !description) {
                alert('❌ Veuillez remplir tous les champs');
                return;
            }

            if (!type) {
                alert('❌ Veuillez sélectionner un type de CV');
                return;
            }

            // Simuler le chemin du fichier
            const fichierPath = fichier ? `uploads/${fichier.name}` : 'uploads/default.pdf';

            if (currentEditId) {
                // MODIFICATION
                const index = cvData.cvs.findIndex(cv => cv.id === currentEditId);
                if (index !== -1) {
                    cvData.cvs[index] = {
                        id: currentEditId,
                        nom: nom,
                        type: type,
                        entreprise: entreprise,
                        description: description,
                        fichier: fichier ? fichierPath : cvData.cvs[index].fichier,
                        date_ajout: new Date().toISOString().split('T')[0]
                    };

                    // Sauvegarder immédiatement
                    saveCVData();

                    alert('✅ CV modifié avec succès !');
                    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un nouveau CV';
                }
            } else {
                // AJOUT
                const newId = cvData.cvs.length > 0 ? Math.max(...cvData.cvs.map(c => c.id)) + 1 : 1;
                const newCV = {
                    id: newId,
                    nom: nom,
                    type: type,
                    entreprise: entreprise,
                    description: description,
                    fichier: fichierPath,
                    date_ajout: new Date().toISOString().split('T')[0]
                };

                cvData.cvs.push(newCV);

                // Sauvegarder immédiatement
                saveCVData();

                alert('✅ CV ajouté avec succès !');
            }

            // Réinitialiser et rafraîchir
            resetFormulaire();

            // Mettre à jour les deux vues
            if (document.getElementById('admin-liste-cv')) {
                afficherCVAdmin();
            }

            // Vérifier si on est sur la page d'accueil via une autre fonction
            updateAllViews();
        });
    }

    if (btnAnnuler) {
        btnAnnuler.addEventListener('click', resetFormulaire);
    }
}

// Nouvelle fonction pour mettre à jour toutes les vues
function updateAllViews() {
    // Mettre à jour la page d'accueil si on y est
    if (document.getElementById('liste-cv')) {
        if (document.getElementById('filtre-type')) {
            filtrerCV();
        } else {
            afficherCVAccueil();
        }
    }

    // Mettre à jour la page admin si on y est
    if (document.getElementById('admin-liste-cv')) {
        afficherCVAdmin();
    }

    console.log('Vues mises à jour, données actuelles:', cvData);
}

function resetFormulaire() {
    document.getElementById('cv-form').reset();
    document.getElementById('cv-id').value = '';
    document.getElementById('fichier').value = '';

    const formTitle = document.getElementById('form-title');
    if (formTitle) {
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un nouveau CV';
    }

    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
        fileInfo.classList.remove('active');
        fileInfo.innerHTML = '';
    }

    currentEditId = null;
}

function modifierCV(id) {
    const cv = cvData.cvs.find(cv => cv.id === id);
    if (!cv) return;

    document.getElementById('cv-id').value = cv.id;
    document.getElementById('nom').value = cv.nom;
    document.getElementById('type').value = cv.type;
    document.getElementById('entreprise').value = cv.entreprise;
    document.getElementById('description').value = cv.description;

    const formTitle = document.getElementById('form-title');
    if (formTitle) {
        formTitle.innerHTML = '<i class="fas fa-edit"></i> Modifier le CV';
    }

    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
        fileInfo.classList.add('active');
        fileInfo.innerHTML = `<i class="fas fa-file-pdf"></i> Fichier actuel: ${cv.fichier.split('/').pop()}`;
    }

    currentEditId = id;

    // Scroll vers le formulaire
    const formCard = document.querySelector('.form-card');
    if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth' });
    }
}

function supprimerCV(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce CV ?')) {
        cvData.cvs = cvData.cvs.filter(cv => cv.id !== id);

        // Sauvegarder après suppression
        saveCVData();

        // Mettre à jour les vues
        if (document.getElementById('admin-liste-cv')) {
            afficherCVAdmin();
        }

        updateAllViews();

        alert('✅ CV supprimé avec succès !');
    }
}

// ===== DRAG & DROP =====
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fichier');
    const fileInfo = document.getElementById('file-info');

    if (!dropZone || !fileInput) return;

    // Empêcher le comportement par défaut
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Surligner la zone
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('dragover');
    }

    function unhighlight() {
        dropZone.classList.remove('dragover');
    }

    // Gérer le drop
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileInput.files = files;
            updateFileInfo(files[0]);
        }
    }

    // Gérer la sélection par clic
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            updateFileInfo(fileInput.files[0]);
        }
    });

    function updateFileInfo(file) {
        if (fileInfo) {
            fileInfo.classList.add('active');
            fileInfo.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Fichier sélectionné: ${file.name} (${(file.size / 1024).toFixed(2)} KB)
            `;
        }
    }
}

// ===== BOUTON POUR EXPORTER LES DONNÉES (optionnel) =====
function exporterDonnees() {
    const dataStr = JSON.stringify(cvData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'cv_data_export.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ===== BOUTON POUR RÉINITIALISER (optionnel) =====
function resetToDefault() {
    if (confirm('Réinitialiser avec les CV par défaut ? Toutes vos modifications seront perdues.')) {
        localStorage.removeItem('cvData');
        cvData = loadCVData();
        updateAllViews();
        alert('Données réinitialisées !');
    }
}

// Ajouter des boutons d'export/réinitialisation dans la console pour les tests
console.log('Fonctions disponibles: exporterDonnees(), resetToDefault()');