// ===== CONFIGURATION DE L'API =====
const API_URL = 'https://cv-portfolio-api-29ui.onrender.com';

// ===== FONCTIONS API =====

// Charger tous les CV depuis l'API
async function loadCVs() {
    try {
        const response = await fetch(`${API_URL}/cvs`);
        if (!response.ok) throw new Error('Erreur chargement');
        const data = await response.json();
        return { cvs: data };
    } catch (error) {
        console.error('Erreur chargement CV:', error);
        return { cvs: [] };
    }
}

// Ajouter un CV
async function addCV(cv) {
    try {
        const response = await fetch(`${API_URL}/cvs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cv)
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur ajout CV:', error);
        throw error;
    }
}

// Modifier un CV
async function updateCV(id, cv) {
    try {
        const response = await fetch(`${API_URL}/cvs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cv)
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur modification CV:', error);
        throw error;
    }
}

// Supprimer un CV
async function deleteCV(id) {
    try {
        await fetch(`${API_URL}/cvs/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Erreur suppression CV:', error);
        throw error;
    }
}

// ===== VARIABLES GLOBALES =====
let cvData = { cvs: [] };
let currentEditId = null;

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Page chargée, connexion à API:', API_URL);

    // Charger les données depuis l'API
    cvData = await loadCVs();
    console.log('Données chargées:', cvData);

    if (document.getElementById('liste-cv')) {
        afficherCVAccueil();
        setupFiltres();
    }

    if (document.getElementById('admin-liste-cv')) {
        afficherCVAdmin();
        setupFormulaire();
        setupDragAndDrop();
    }
});

// ===== FONCTIONS PAGE ACCUEIL =====
function afficherCVAccueil() {
    const container = document.getElementById('liste-cv');
    if (!container) return;

    container.innerHTML = '';

    if (!cvData.cvs || cvData.cvs.length === 0) {
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
                <h3 class="cv-name">${cv.nom || 'Nom inconnu'}</h3>
                <span class="cv-badge badge-${(cv.type || 'moderne').toLowerCase()}">${cv.type || 'Moderne'}</span>
            </div>
            <div class="cv-card-body">
                <div class="cv-company">
                    <i class="fas fa-building"></i>
                    <span>${cv.entreprise || 'Entreprise inconnue'}</span>
                </div>
                <p class="cv-description">${cv.description || 'Description non disponible'}</p>
            </div>
            <div class="cv-footer">
                <div class="cv-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Ajouté le ${formatDate(cv.date_ajout)}</span>
                </div>
                <button class="btn-view" onclick="window.open('${cv.fichier || '#'}', '_blank')">
                    <i class="fas fa-eye"></i> Voir le CV
                </button>
            </div>
        `;
        container.appendChild(cvCard);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch {
        return dateString;
    }
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

    if (!cvData.cvs) return;

    const cvsFiltres = cvData.cvs.filter(cv => {
        const matchType = type === 'tous' || cv.type === type;
        const matchRecherche = (cv.nom || '').toLowerCase().includes(recherche) ||
                              (cv.entreprise || '').toLowerCase().includes(recherche);
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

    if (!cvData.cvs || cvData.cvs.length === 0) {
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
        form.addEventListener('submit', async function(e) {
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

            // Simuler le chemin du fichier
            const fichierPath = fichier ? `uploads/${fichier.name}` : 'uploads/default.pdf';

            const cvDataToSave = {
                nom,
                type,
                entreprise,
                description,
                fichier: fichierPath,
                date_ajout: new Date().toISOString().split('T')[0]
            };

            try {
                if (currentEditId) {
                    // MODIFICATION
                    await updateCV(currentEditId, { ...cvDataToSave, id: currentEditId });
                    alert('✅ CV modifié avec succès !');
                } else {
                    // AJOUT
                    await addCV(cvDataToSave);
                    alert('✅ CV ajouté avec succès !');
                }

                // Recharger les données depuis l'API
                cvData = await loadCVs();

                // Réinitialiser et rafraîchir
                resetFormulaire();
                afficherCVAdmin();
                updateAllViews();

                document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un nouveau CV';
            } catch (error) {
                alert('❌ Erreur lors de l\'enregistrement');
                console.error(error);
            }
        });
    }

    if (btnAnnuler) {
        btnAnnuler.addEventListener('click', resetFormulaire);
    }
}

async function supprimerCV(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce CV ?')) {
        try {
            await deleteCV(id);

            // Recharger les données depuis l'API
            cvData = await loadCVs();

            // Mettre à jour les vues
            afficherCVAdmin();
            updateAllViews();

            alert('✅ CV supprimé avec succès !');
        } catch (error) {
            alert('❌ Erreur lors de la suppression');
            console.error(error);
        }
    }
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

function updateAllViews() {
    if (document.getElementById('liste-cv')) {
        if (document.getElementById('filtre-type')) {
            filtrerCV();
        } else {
            afficherCVAccueil();
        }
    }
}

// ===== DRAG & DROP =====
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fichier');
    const fileInfo = document.getElementById('file-info');

    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

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

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileInput.files = files;
            updateFileInfo(files[0]);
        }
    }

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