require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Servir arquivos estáticos da pasta 'public' (caso o frontend esteja na mesma aplicação)
app.use(express.static('public'));

// Configuração da conexão com o PostgreSQL / Supabase
// Reutiliza conexões existentes em ambientes Serverless
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para conexões SSL com Supabase na nuvem
    }
});

// -------------------------------------------------------------
// ROTAS REST
// -------------------------------------------------------------

// GET /produtos - Listar todos os produtos
app.get('/produtos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ erro: 'Erro interno ao buscar produtos.' });
    }
});

// POST /produtos - Inserir novo produto
app.post('/produtos', async (req, res) => {
    const { nome, preco, quantidade } = req.body;

    const p = parseFloat(preco);
    const q = parseInt(quantidade, 10);

    if (!nome || isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
        return res.status(400).json({ erro: 'Dados inválidos enviados para o servidor.' });
    }

    try {
        const query = `
            INSERT INTO produtos (nome, preco, quantidade) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `;
        const values = [nome, p, q];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        res.status(500).json({ erro: 'Erro interno ao salvar produto.' });
    }
});

// PUT /produtos/:id - Atualizar um produto existente
app.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, preco, quantidade } = req.body;

    const p = parseFloat(preco);
    const q = parseInt(quantidade, 10);

    if (!nome || isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
        return res.status(400).json({ erro: 'Dados inválidos enviados para o servidor.' });
    }

    try {
        const query = `
            UPDATE produtos 
            SET nome = $1, preco = $2, quantidade = $3 
            WHERE id = $4 
            RETURNING *
        `;
        const values = [nome, p, q, id];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        // Retorna o produto atualizado
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ erro: 'Erro interno ao atualizar produto.' });
    }
});

// DELETE /produtos/:id - Apagar produto por ID
app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        res.status(500).json({ erro: 'Erro interno ao deletar produto.' });
    }
});

// DELETE /produtos - Apagar todos os produtos
app.delete('/produtos', async (req, res) => {
    try {
        await pool.query('DELETE FROM produtos');
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao limpar produtos:', error);
        res.status(500).json({ erro: 'Erro interno ao limpar produtos.' });
    }
});

// -------------------------------------------------------------
// EXECUÇÃO LOCAL E EXPORTAÇÃO PARA VERCEL
// -------------------------------------------------------------
// Em desenvolvimento local, inicia o servidor HTTP na porta 3000
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
    });
}

// Exporta a instância do Express para Serverless Functions na Vercel
module.exports = app;