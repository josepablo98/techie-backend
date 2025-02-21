const pool = require("../db");
const jwt = require("jsonwebtoken");

const createChat = async (req, res) => {
    const { token, message } = req.body;

    if (Object.keys(req.body).length !== 2) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba token y message",
        });
    }

    if (!token || !message) {
        return res.status(400).json({
            ok: false,
            message: "Falta token o mensaje",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const rows = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado",
            });
        }

        const userId = rows[0].id;
        const date = new Date();
        const messages = JSON.stringify([{ index: 0, message: message }]);

        const result = await connection.query(
            "INSERT INTO chat (userId, date, messages) VALUES (?, ?, ?)",
            [userId, date, messages]
        );
        const chatId = Number(result.insertId);
        connection.release();
        res.status(201).json({
            ok: true,
            message: "Chat creado correctamente",
            chatId
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error en el servidor",
            error,
        });
    }
};

const updateChat = async (req, res) => {
    const { id } = req.params;
    const { token, message } = req.body;

    if (Object.keys(req.body).length !== 2) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba token y message",
        });
    }

    if (!message || !token) {
        return res.status(400).json({
            ok: false,
            message: "Falta mensaje o token",
        });
    }

    if (!id) {
        return res.status(400).json({
            ok: false,
            message: "Falta id",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado",
            });
        }

        const chat = await connection.query(
            "SELECT * FROM chat WHERE id = ? AND userId = ?",
            [id, user[0].id]
        );

        if (chat.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Chat no encontrado o no pertenece al usuario",
            });
        }

        const messages = Array.isArray(chat[0].messages)
            ? chat[0].messages
            : JSON.parse(chat[0].messages);
        const newIndex = chat[0].messages.length;
        messages.push({ index: newIndex, message: message });

        await connection.query("UPDATE chat SET messages = ? WHERE id = ?", [
            JSON.stringify(messages),
            id,
        ]);

        connection.release();

        res.status(200).json({
            ok: true,
            message: "Mensaje añadido correctamente",
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error en el servidor",
            error,
        });
    }
};

const getChatsByUserId = async (req, res) => {
    const { token } = req.body;

    if (Object.keys(req.body).length !== 1) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba token",
        });
    }

    if (!token) {
        return res.status(400).json({
            ok: false,
            message: "Falta token",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado",
            });
        }

        const chats = await connection.query(
            "SELECT id, title FROM chat WHERE userId = ?",
            [user[0].id]
        );

        if (chats.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No se han encontrado chats",
            });
        }

        connection.release();

        res.status(200).json({
            ok: true,
            chats,
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error en el servidor",
            error,
        });
    }
};

const getChatsByUserIdAndChatId = async (req, res) => {
    const { token } = req.body;
    const { id } = req.params;

    if (Object.keys(req.body).length !== 1) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba token",
        });
    }

    if (!token || !id) {
        return res.status(400).json({
            ok: false,
            message: "Falta token o id",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado",
            });
        }

        const chat = await connection.query(
            "SELECT * FROM chat WHERE id = ? AND userId = ?",
            [id, user[0].id]
        );

        if (chat.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Chat no encontrado o no pertenece al usuario",
            });
        }

        connection.release();

        res.status(200).json({
            ok: true,
            chat,
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error en el servidor",
            error,
        });
    }
}

const updateTitle = async (req, res) => {
    const { token, title } = req.body;
    const { id } = req.params;

    if (Object.keys(req.body).length !== 2) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba token y title",
        });
    }

    if (!token || !id || !title) {
        return res.status(400).json({
            ok: false,
            message: "Falta token, id o title",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado",
            });
        }

        const chat = await connection.query(
            "SELECT * FROM chat WHERE id = ? AND userId = ?",
            [id, user[0].id]
        );

        if (chat.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Chat no encontrado o no pertenece al usuario",
            });
        }

        await connection.query("UPDATE chat SET title = ? WHERE id = ?", [
            title,
            id,
        ]);

        connection.release();

        res.status(200).json({
            ok: true,
            message: "Título actualizado correctamente",
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error en el servidor",
            error,
        });
    }
}

const deleteChat = async (req, res) => {
    const { token } = req.body;
    const { id } = req.params;

    if (Object.keys(req.body).length !== 1) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba token",
        });
    }

    if (!token || !id) {
        return res.status(400).json({
            ok: false,
            message: "Falta token o id",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Usuario no encontrado",
            });
        }

        const chat = await connection.query(
            "SELECT * FROM chat WHERE id = ? AND userId = ?",
            [id, user[0].id]
        );

        if (chat.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "Chat no encontrado o no pertenece al usuario",
            });
        }

        await connection.query("DELETE FROM chat WHERE id = ?", [id]);

        connection.release();

        res.status(200).json({
            ok: true,
            message: "Chat eliminado correctamente",
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error en el servidor",
            error,
        });
    }
}

module.exports = {
    createChat,
    updateChat,
    getChatsByUserId,
    getChatsByUserIdAndChatId,
    updateTitle,
    deleteChat
};
