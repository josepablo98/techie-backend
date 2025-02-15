const mariadb = require("mariadb");



const createChat = async (req, res) => {
    const { email, message } = req.body;

    if (Object.keys(req.body).length !== 2) {
        return res.status(400).json({
            ok: false,
            message: 'Petición incorrecta'
        })
    }

    if (!email || !message) {
        return res.status(400).json({
            ok: false,
            message: 'Falta email o mensaje'
        })
    }

    try {
        const pool = mariadb.createPool({
            host: "localhost",
            user: "root",
            password: "root",
            database: "techie",
            port: 3306,
            connectionLimit: 20,
            acquireTimeout: 10000
        })

        const connection = await pool.getConnection();

        const rows = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            })
        }

        const userId = rows[0].id;
        const date = new Date();
        const messages = JSON.stringify([{ "index": 0, "message": message }]);

        const result = await connection.query("INSERT INTO chat (userId, date, messages) VALUES (?, ?, ?)", [userId, date, messages]);

        connection.release();

        res.status(201).json({
            ok: true,
            message: 'Chat creado correctamente'
        })
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: 'Error en el servidor',
            error
        })
    }
}

const updateChat = async (req, res) => {
    const { id } = req.params;
    const { email, message } = req.body;

    if (Object.keys(req.body).length !== 2) {
        return res.status(400).json({
            ok: false,
            message: 'Petición incorrecta'
        })
    }

    if (!message || !email) {
        return res.status(400).json({
            ok: false,
            message: 'Falta mensaje o email'
        })
    }

    if (!id) {
        return res.status(400).json({
            ok: false,
            message: 'Falta id'
        })
    }

    try {
        const pool = mariadb.createPool({
            host: "localhost",
            user: "root",
            password: "root",
            database: "techie",
            port: 3306,
            connectionLimit: 20,
            acquireTimeout: 10000
        })

        const connection = await pool.getConnection();

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

        if (user.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            })
        }

        const chat = await connection.query("SELECT * FROM chat WHERE id = ? AND userId = ?", [id, user[0].id]);

        if (chat.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Chat no encontrado o no pertenece al usuario'
            })
        }

        



        const messages = Array.isArray(chat[0].messages) ? chat[0].messages : JSON.parse(chat[0].messages);
        const newIndex = chat[0].messages.length;
        messages.push({ "index": newIndex, "message": message });

        await connection.query("UPDATE chat SET messages = ? WHERE id = ?", [JSON.stringify(messages), id]);

        connection.release();

        res.status(200).json({
            ok: true,
            message: 'Mensaje añadido correctamente'
        })

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: 'Error en el servidor',
            error
        })
    }
}

module.exports = {
    createChat,
    updateChat
};