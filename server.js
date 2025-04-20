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
db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
)`);

// GET - récupérer tous les items
app.get('/items', (req, res) => {
    db.all('SELECT * FROM items', [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send("Erreur lors de la récupération");
        } else {
            res.json(rows);
        }
    });
});

// POST - ajouter un nouvel item
app.post('/items', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).send("Champ 'title' requis");

    db.run('INSERT INTO items (title) VALUES (?)', [title], function(err) {
        if (err) {
            console.error(err);
            res.status(500).send("Erreur lors de l'ajout");
        } else {
            res.status(201).json({ id: this.lastID, title });
        }
    });
});

// DELETE - supprimer un item par ID
app.delete('/items/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
        if (err) {
            console.error(err);
            res.status(500).send("Erreur lors de la suppression");
        } else if (this.changes === 0) {
            res.status(404).send("Item non trouvé");
        } else {
            res.status(200).send("Item supprimé");
        }
    });
});

app.listen(PORT, () => {
    console.log(`Serveur Express lancé sur http://localhost:${PORT}`);
});
