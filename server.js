const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Connexion à la base SQLite
const db = new sqlite3.Database('./database.db');

// Création de la table si elle n'existe pas
db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0
)`);

// Insérer deux tâches de base (si elles n'existent pas déjà)
db.serialize(() => {
    db.run(`INSERT OR IGNORE INTO tasks (id, title, completed) VALUES (1, 'Apprendre Express', 0)`);
    db.run(`INSERT OR IGNORE INTO tasks (id, title, completed) VALUES (2, 'Créer une API REST', 0)`);
});

// GET - récupérer toutes les tâches
app.get('/tasks', (req, res) => {
    db.all('SELECT * FROM tasks', [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send("Erreur lors de la récupération");
        } else {
            // Convertir le champ completed (0 ou 1) en booléen
            const formatted = rows.map(row => ({
                ...row,
                completed: Boolean(row.completed)
            }));
            res.json(formatted);
        }
    });
});

// POST - ajouter une nouvelle tâche
app.post('/tasks', (req, res) => {
    const { title, completed = false } = req.body;
    if (!title) return res.status(400).send("Champ 'title' requis");

    db.run('INSERT INTO tasks (title, completed) VALUES (?, ?)', [title, completed ? 1 : 0], function(err) {
        if (err) {
            console.error(err);
            res.status(500).send("Erreur lors de l'ajout");
        } else {
            res.status(201).json({ id: this.lastID, title, completed });
        }
    });
});

// DELETE - supprimer une tâche par ID
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) {
            console.error(err);
            res.status(500).send("Erreur lors de la suppression");
        } else if (this.changes === 0) {
            res.status(404).send("Tâche non trouvée");
        } else {
            res.status(200).send("Tâche supprimée");
        }
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur Express lancé sur http://localhost:${PORT}`);
});
