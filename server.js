const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Connexion à SQLite
const db = new sqlite3.Database('./database.db');

// Création de la table
db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0
)`);

// Insérer des tâches par défaut si elles n'existent pas
db.serialize(() => {
    db.run(`INSERT OR IGNORE INTO tasks (id, title, completed) VALUES (1, 'Apprendre Express', 0)`);
    db.run(`INSERT OR IGNORE INTO tasks (id, title, completed) VALUES (2, 'Créer une API REST', 0)`);
});

// 🔹 GET /api/tasks — toutes les tâches
app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM tasks', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erreur lors de la récupération");
        }

        const tasks = rows.map(row => ({
            ...row,
            completed: Boolean(row.completed)
        }));

        res.json(tasks);
    });
});

// 🔹 GET /api/tasks/:id — une tâche par ID
app.get('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);

    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur lors de la récupération' });
        } else if (!row) {
            return res.status(404).json({ error: 'Tâche non trouvée' });
        }

        row.completed = Boolean(row.completed);
        res.json(row);
    });
});

// 🔹 POST /api/tasks — ajouter une tâche
app.post('/api/tasks', (req, res) => {
    const { title, completed = false } = req.body;

    if (!title) {
        return res.status(400).json({ error: "Champ 'title' requis" });
    }

    db.run(
        'INSERT INTO tasks (title, completed) VALUES (?, ?)',
        [title, completed ? 1 : 0],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Erreur lors de l'ajout" });
            }

            res.status(201).json({ id: this.lastID, title, completed });
        }
    );
});

// 🔹 Serveur en écoute
app.listen(PORT, () => {
    console.log(`✅ Serveur Express lancé sur http://localhost:${PORT}`);
});
