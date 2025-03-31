const { response } = require('express');
const pool = require('../db');
const jsonwebtoken = require('jsonwebtoken');

const updateSettings = async (req, res = response) => {
    const { theme, language, detailLevel, autoSaveChats } = req.body;
    const { token } = req.cookies;

    if (!token) {
        return res.status(400).json({
            ok: false,
            message: 'Token es requerido'
        });
    }

    if (Object.keys(req.body).length < 1 || Object.keys(req.body).length > 4) {
        return res.status(400).json({
            ok: false,
            message: 'Se requiere al menos un campo a modificar y no más de cuatro. Estos son los campos a modificar: theme, language, detailLevel, autoSaveChats'
        });
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jsonwebtoken.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT id FROM user WHERE email = ?", [email]);

        if (user.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            });
        }
        if (theme) {
            await connection.query("UPDATE settings SET theme = ? WHERE userId = ?", [theme, user[0].id]);
        }
        if (language) {
            await connection.query("UPDATE settings SET language = ? WHERE userId = ?", [language, user[0].id]);
        }
        if (detailLevel) {
            await connection.query("UPDATE settings SET detailLevel = ? WHERE userId = ?", [detailLevel, user[0].id]);
        }
        if (autoSaveChats !== undefined) {
            await connection.query("UPDATE settings SET autoSaveChats = ? WHERE userId = ?", [autoSaveChats, user[0].id]);
        }

        connection.release();

        res.status(201).json({
            ok: true,
            message: 'Configuración actualizada correctamente'
        })


    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: 'Error en el servidor'
        });
    }
}

const getSettings = async (req, res = response) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(400).json({
            ok: false,
            message: 'Token es requerido'
        })
    }

    try {
        const connection = await pool.getConnection();

        const { email } = jsonwebtoken.verify(token, process.env.SECRET_JWT_SEED);

        const user = await connection.query("SELECT id FROM user WHERE email = ?", [email]);

        if (user.length === 0) {
            connection.release();
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            });
        }

        const settings = await connection.query("SELECT * FROM settings WHERE userId = ?", [user[0].id]);

        connection.release();

        res.status(200).json({
            ok: true,
            settings
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: 'Error en el servidor'
        });
    }
}



module.exports = {
    updateSettings,
    getSettings
}