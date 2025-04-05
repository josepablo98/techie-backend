const pool = require("../db");
const jwt = require("jsonwebtoken");

const createChat = async (req, res) => {
    const { message } = req.body;
    const acceptedLanguage = req.headers["accept-language"] || "es";
    const { token } = req.cookies;

    if (Object.keys(req.body).length !== 1) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Petición incorrecta: Se esperaba únicamente el mensaje" : "Bad request: Only message expected",
        });
    }

    if (!token || !message) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Falta token o mensaje" : "Missing token or message",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const rows = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (rows.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
            });
        }
        const userId = rows[0].id;


        const autoSaveChats = await connection.query("SELECT autoSaveChats FROM settings WHERE userId = ?", [userId]);
        const tempChats = !autoSaveChats[0].autoSaveChats;

        if (tempChats) {
            connection.release();
            return res.status(403).json({
                ok: false,
                message: acceptedLanguage === "es" ? "No se puede crear un chat si la opción de guardado automático está desactivada" : "Cannot create a chat if the auto-save option is disabled",
            })
        }

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
            message: acceptedLanguage === "es" ? "Chat creado correctamente" : "Chat created successfully",
            chatId
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Error en el servidor" : "Server error",
            error,
        });
    }
};

const updateChat = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const { token } = req.cookies;
    const acceptedLanguage = req.headers["accept-language"] || "es";

    if (Object.keys(req.body).length !== 1) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Petición incorrecta: Se esperaba únicamente el mensaje" : "Bad request: Only message expected",
        });
    }

    if (!message || !token) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Falta token o mensaje" : "Missing token or message",
        });
    }

    if (!id) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Falta id" : "Missing id",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
            });
        }

        const chat = await connection.query(
            "SELECT * FROM chat WHERE id = ? AND userId = ?",
            [id, user[0].id]
        );

        if (chat.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Chat no encontrado o no pertenece al usuario" : "Chat not found or does not belong to the user",
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
            message: acceptedLanguage === "es" ? "Mensaje añadido correctamente" : "Message added successfully",
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Error en el servidor" : "Server error",
            error,
        });
    }
};

const getChatsByUserId = async (req, res) => {
    const { token } = req.cookies;
    const acceptedLanguage = req.headers["accept-language"] || "es";

    if (!token) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Falta token" : "Missing token",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
            });
        }

        const chats = await connection.query(
            "SELECT id, title FROM chat WHERE userId = ?",
            [user[0].id]
        );

        if (chats.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "No se han encontrado chats" : "No chats found",
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
            message: acceptedLanguage === "es" ? "Error en el servidor" : "Server error",
            error,
        });
    }
};

const getChatsByUserIdAndChatId = async (req, res) => {
    const { token } = req.cookies;
    const { id } = req.params;
    const acceptedLanguage = req.headers["accept-language"] || "es";

    if (!token || !id) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Falta token o id" : "Missing token or id",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
            });
        }

        const chat = await connection.query(
            "SELECT * FROM chat WHERE id = ? AND userId = ?",
            [id, user[0].id]
        );

        if (chat.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Chat no encontrado o no pertenece al usuario" : "Chat not found or does not belong to the user",
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
            message: acceptedLanguage === "es" ? "Error en el servidor" : "Server error",
            error,
        });
    }
}

const updateTitle = async (req, res) => {
    const { title } = req.body;
    const { token } = req.cookies;
    const { id } = req.params;
    const acceptedLanguage = req.headers["accept-language"] || "es";

    if (Object.keys(req.body).length !== 1) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Petición incorrecta: Se esperaba únicamente el título" : "Bad request: Only title expected",
        });
    }

    if (!token || !id || !title) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Falta token, id o título" : "Missing token, id or title",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
            });
        }

        const chat = await connection.query(
            "SELECT * FROM chat WHERE id = ? AND userId = ?",
            [id, user[0].id]
        );

        if (chat.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Chat no encontrado o no pertenece al usuario" : "Chat not found or does not belong to the user",
            });
        }

        await connection.query("UPDATE chat SET title = ? WHERE id = ?", [
            title,
            id,
        ]);

        connection.release();

        res.status(200).json({
            ok: true,
            message: acceptedLanguage === "es" ? "Título actualizado correctamente" : "Title updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Error en el servidor" : "Server error",
            error,
        });
    }
}

const deleteChat = async (req, res) => {
    const { token } = req.cookies;
    const { id } = req.params;
    const acceptedLanguage = req.headers["accept-language"] || "es";

    if (!token || !id) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Falta token o id" : "Missing token or id",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);

        if (user.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
            });
        }

        const chat = await connection.query(
            "SELECT * FROM chat WHERE id = ? AND userId = ?",
            [id, user[0].id]
        );

        if (chat.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Chat no encontrado o no pertenece al usuario" : "Chat not found or does not belong to the user",
            });
        }

        await connection.query("DELETE FROM chat WHERE id = ?", [id]);

        connection.release();

        res.status(200).json({
            ok: true,
            message: acceptedLanguage === "es" ? "Chat eliminado correctamente" : "Chat deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Error en el servidor" : "Server error",
            error,
        });
    }
}

const deleteAllChats = async (req, res) => {
    const { token } = req.cookies;
    const acceptedLanguage = req.headers["accept-language"] || "es";

    if (!token) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Falta token" : "Missing token",
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jwt.verify(token, process.env.SECRET_JWT_SEED);
        const user = await connection.query("SELECT * FROM user WHERE email = ?", [
            email,
        ]);
        if (user.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
            });
        }
        const chats = await connection.query(
            "SELECT * FROM chat WHERE userId = ?",
            [user[0].id]
        );

        if (chats.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: acceptedLanguage === "es" ? "No se han encontrado chats" : "No chats found",
            });
        }
        await connection.query("DELETE FROM chat WHERE userId = ?", [user[0].id]);
        connection.release();
        res.status(200).json({
            ok: true,
            message: acceptedLanguage === "es" ? "Chats eliminados correctamente" : "Chats deleted successfully",
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: acceptedLanguage === "es" ? "Error en el servidor" : "Server error",
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
    deleteChat,
    deleteAllChats
};
