const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour l'upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Route d'upload
server.post('/upload', upload.single('fichier'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier' });
    }

    // Retourner l'URL du fichier
    const fileUrl = `https://cv-portfolio-api-29ui.onrender.com/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
});

// Servir les fichiers statiques
server.use('/uploads', express.static('uploads'));

// Utiliser json-server pour le reste
server.use(router);

server.listen(3000, () => {
    console.log('Server ready');
});