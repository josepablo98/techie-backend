const pool = require("../db");

const createChat = async (req, res) => {
    const { email, message } = req.body;

    if (Object.keys(req.body).length !== 2) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba email y message",
        });
    }

    if (!email || !message) {
        return res.status(400).json({
            ok: false,
            message: "Falta email o mensaje",
        });
    }

    try {
        const connection = await pool.getConnection();

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
    const { email, message } = req.body;

    if (Object.keys(req.body).length !== 2) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba email y message",
        });
    }

    if (!message || !email) {
        return res.status(400).json({
            ok: false,
            message: "Falta mensaje o email",
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
    const { email } = req.body;

    if (Object.keys(req.body).length !== 1) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba email",
        });
    }

    if (!email) {
        return res.status(400).json({
            ok: false,
            message: "Falta email",
        });
    }

    try {
        const connection = await pool.getConnection();

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
            "SELECT * FROM chat WHERE userId = ?",
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
    const { email } = req.body;
    const { id } = req.params;

    if (Object.keys(req.body).length !== 1) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba email",
        });
    }

    if (!email || !id) {
        return res.status(400).json({
            ok: false,
            message: "Falta email o id",
        });
    }

    try {
        const connection = await pool.getConnection();

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
    const { email, title } = req.body;
    const { id } = req.params;

    if (Object.keys(req.body).length !== 2) {
        return res.status(400).json({
            ok: false,
            message: "Petición incorrecta. Se esperaba email y title",
        });
    }

    if (!email || !id || !title) {
        return res.status(400).json({
            ok: false,
            message: "Falta email, id o title",
        });
    }

    try {
        const connection = await pool.getConnection();

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

const fetchGeminiApi = async (req, res) => {

    const { text, context } = req.body;


    if (!text) {
        return res.status(400).json({
            ok: false,
            message: "Falta text",
        });
    }

    let textPromptingEngineering = `Debes responder únicamente preguntas sobre teoría de programación, sea el lenguaje de programación que sea.  
        Si la pregunta del usuario no está relacionada con este tema, responde de forma educada explicando que solo puedes ayudar con asuntos relacionados con la programación.  

        Tu respuesta debe sonar natural y bien estructurada, sin repetir frases innecesarias.  
        Si el usuario insiste en preguntar sobre otro tema, recuérdale amablemente que solo puedes responder sobre teoría de programación.
        Si el usuario te saluda o te agradece, responde de manera educada y amigable. Siempre debes ser simpático y educado, evitando respuestas cortantes o frías.
        Si el usuario te hace una pregunta que no entiendes, pide que la reformule de manera más clara y específica.
        Si el usuario insulta o hace comentarios inapropiados, responde de manera educada y profesional, diciendo que no puedes responder a ese tipo de comentarios.
        Si el usuario te pide información personal o información que puede ser usada para realizar actividades ilegales, responde de manera profesional y cortés, diciendo que no puedes proporcionar esa información.
        Si el usuario te pide generar código, no lo hagas. Recuerda que solo puedes responder preguntas sobre teoría de lenguajes de programación.
        Aunque tú sabes que es sobre la "teoría de programación", cuando lo menciones en tus respuestas, utiliza el término "programación" para que el usuario entienda mejor.

        Antes de responder, genera un título breve y natural que no supere las seis o siete palabras basado en la pregunta del usuario.  
        El título debe resumir la idea principal de la pregunta de manera clara y amigable.El formato sería el siguiente: titulo//mensaje, siendo "título" el título que tú des, y "mensaje" el mensaje
        de respuesta en si. No uses títulos genéricos como "Lenguaje Teoría" siendo el "Lenguaje" el lenguaje de programación sobre el que
        te está preguntando el usuario.  
        Te repito que separes el título del mensaje con "//".

        La pregunta o solicitud que el usuario ha hecho es la siguiente: "${text}".`;

    if (context) {
        const formattedContext = context
            .map(({ index, message }) => (index % 2 === 0 ? `Usuario: ${message}` : `Tú: ${message}`))
            .join("\n");

        textPromptingEngineering = `
            Antes de esta pregunta, la conversación ha sido la siguiente:
            ${formattedContext}

            Teniendo en cuenta este contexto, responde de manera coherente y natural a la pregunta actual:
            ${textPromptingEngineering}`;
    }

    console.log(textPromptingEngineering);

    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`;
    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "contents": [{
                    "parts": [{ "text": textPromptingEngineering }]
                }]
            })
        })
        const data = await resp.json()
        return res.status(200).json({
            ok: true,
            response: data.candidates[0].content.parts[0].text
        })
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
    fetchGeminiApi
};
