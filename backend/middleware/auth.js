// middleware/auth.js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer TOKEN"
    if (!token) return res.status(401).json({ mensaje: "No autorizado, token faltante" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // Información del usuario disponible en req.usuario
        next();
    } catch (err) {
        res.status(401).json({ mensaje: "Token inválido" });
    }
}

module.exports = authMiddleware;