const { response } = require('express');
const pool = require('../db');
const jsonwebtoken = require('jsonwebtoken');

const updateSettings = async (req, res = response) => {
    const { theme, language, detailLevel, autoSaveChats, globalContext } = req.body;
    const acceptedLanguage = req.headers['accept-language'] || 'es';
    const { token } = req.cookies;

    if (!token) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === 'es' ? 'Token es requerido' : 'Token is required',
        });
    }

    if (Object.keys(req.body).length < 1 || Object.keys(req.body).length > 5) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === 'es' ? 'Se requiere al menos un campo a modificar y no más de cinco. Estos son los campos a modificar: theme, language, detailLevel, autoSaveChats, globalContext' : 'At least one field to modify is required and no more than five. These are the fields to modify: theme, language, detailLevel, autoSaveChats, globalContext',
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
                message: acceptedLanguage === 'es' ? 'Usuario no encontrado' : 'User not found',
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

        if (globalContext) {
            if (globalContext.length > 500) {
                connection.release();
                return res.status(400).json({
                    ok: false,
                    message: acceptedLanguage === 'es' ? 'El contexto global no puede tener más de 500 caracteres' : 'Global context cannot be more than 500 characters',
                });
            }
            await connection.query("UPDATE settings SET globalContext = ? WHERE userId = ?", [globalContext, user[0].id]);
        } else {
            await connection.query("UPDATE settings SET globalContext = NULL WHERE userId= ?", [user[0].id]);
        }

        connection.release();

        res.status(201).json({
            ok: true,
            message: acceptedLanguage === 'es' ? 'Configuración actualizada correctamente' : 'Settings updated successfully',
        })


    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: acceptedLanguage === 'es' ? 'Error en el servidor' : 'Server error',
        });
    }
}

const getSettings = async (req, res = response) => {
    const { token } = req.cookies;
    const acceptedLanguage = req.headers['accept-language'] || 'es';

    if (!token) {
        return res.status(400).json({
            ok: false,
            message: acceptedLanguage === 'es' ? 'Token es requerido' : 'Token is required',
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
                message: acceptedLanguage === 'es' ? 'Usuario no encontrado' : 'User not found',
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
            message: acceptedLanguage === 'es' ? 'Error en el servidor' : 'Server error',
        });
    }
}



module.exports = {
    updateSettings,
    getSettings
}