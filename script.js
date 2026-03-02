// ===== CONFIGURATION DE L'API =====
const API_URL = 'https://cv-portfolio-api-29ui.onrender.com';

// ===== VARIABLES GLOBALES =====
let cvData = { cvs: [] };
let currentEditId = null;
let currentPage = 1;
const itemsPerPage = 9;
let formModifie = false;  // Pour détecter les modifications non sauvegardées

// ===== FONCTIONS API =====
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

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Page chargée, connexion à API:', API_URL);

    // Charger les données depuis l'API
    cvData = await loadCVs();
    console.log('Données chargées:', cvData);

    if (document.getElementById('liste-cv')) {
        afficherCVAccueil();
        setupFiltresEtTri();
    }

    if (document.getElementById('admin-liste-cv')) {
        afficherCVAdmin();
        setupFormulaire();
        setupDragAndDrop();

        // Détection des modifications non sauvegardées
        document.querySelectorAll('#cv-form input, #cv-form select, #cv-form textarea').forEach(input => {
            input.addEventListener('change', () => { formModifie = true; });
            input.addEventListener('input', () => { formModifie = true; });
        });
    }
});

// ===== FONCTIONS PAGE ACCUEIL =====
function afficherCVAccueil(page = 1) {
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

    // Pagination
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedCVs = cvData.cvs.slice(start, end);

    paginatedCVs.forEach(cv => {
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
                <button class="btn-view" onclick="ouvrirPDF('${cv.fichier}')">
                    <i class="fas fa-eye"></i> Voir le CV
                </button>
            </div>
        `;
        container.appendChild(cvCard);
    });

    afficherPagination();
}

function ouvrirPDF(url) {
    if (!url || url === '#') {
        alert('Fichier PDF non disponible');
        return;
    }
    window.open(url, '_blank');
}

function afficherPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(cvData.cvs.length / itemsPerPage);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-controls">';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="btn-page ${i === currentPage ? 'active' : ''}" onclick="changerPage(${i})">${i}</button>`;
    }
    html += '</div>';
    paginationContainer.innerHTML = html;
}

function changerPage(page) {
    currentPage = page;
    afficherCVAccueil(page);
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

function setupFiltresEtTri() {
    const filtreType = document.getElementById('filtre-type');
    const tri = document.getElementById('tri');
    const recherche = document.getElementById('recherche');

    if (filtreType) {
        filtreType.addEventListener('change', appliquerFiltresEtTri);
    }
    if (tri) {
        tri.addEventListener('change', appliquerFiltresEtTri);
    }
    if (recherche) {
        recherche.addEventListener('input', appliquerFiltresEtTri);
    }
}

function appliquerFiltresEtTri() {
    const type = document.getElementById('filtre-type').value;
    const tri = document.getElementById('tri').value;
    const recherche = document.getElementById('recherche').value.toLowerCase();

    // Filtrer
    let cvsFiltres = cvData.cvs.filter(cv => {
        const matchType = type === 'tous' || cv.type === type;
        const matchRecherche = (cv.nom || '').toLowerCase().includes(recherche) ||
                              (cv.entreprise || '').toLowerCase().includes(recherche);
        return matchType && matchRecherche;
    });

    // Trier
    if (tri === 'date_desc') {
        cvsFiltres.sort((a, b) => new Date(b.date_ajout) - new Date(a.date_ajout));
    } else if (tri === 'date_asc') {
        cvsFiltres.sort((a, b) => new Date(a.date_ajout) - new Date(b.date_ajout));
    } else if (tri === 'nom_asc') {
        cvsFiltres.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
    } else if (tri === 'nom_desc') {
        cvsFiltres.sort((a, b) => (b.nom || '').localeCompare(a.nom || ''));
    }

    // Afficher
    const container = document.getElementById('liste-cv');
    container.innerHTML = '';

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
                    await updateCV(currentEditId, { ...cvDataToSave, id: currentEditId });
                    alert('✅ CV modifié avec succès !');
                } else {
                    await addCV(cvDataToSave);
                    alert('✅ CV ajouté avec succès !');
                }

                cvData = await loadCVs();
                resetFormulaire();
                afficherCVAdmin();
                updateAllViews();

                formModifie = false;
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
            cvData = await loadCVs();
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
    formModifie = true;

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
    formModifie = false;
}

function updateAllViews() {
    if (document.getElementById('liste-cv')) {
        if (document.getElementById('filtre-type')) {
            appliquerFiltresEtTri();
        } else {
            afficherCVAccueil(currentPage);
        }
    }
}

// Protection avant de quitter avec modifications non sauvegardées
window.addEventListener('beforeunload', function(e) {
    if (formModifie) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter ?';
        return e.returnValue;
    }
});

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
            formModifie = true;
        }
    }

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            updateFileInfo(fileInput.files[0]);
            formModifie = true;
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

// Styles pour la pagination (à ajouter dans style.css)
const paginationStyles = `
.pagination {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
}
.pagination-controls {
    display: flex;
    gap: 0.5rem;
}
.btn-page {
    padding: 0.5rem 1rem;
    border: 2px solid var(--primary);
    background: white;
    color: var(--primary);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
}
.btn-page:hover,
.btn-page.active {
    background: var(--gradient);
    color: white;
    border-color: transparent;
}
`;

// Ajouter les styles de pagination
const styleSheet = document.createElement("style");
styleSheet.innerText = paginationStyles;
document.head.appendChild(styleSheet);