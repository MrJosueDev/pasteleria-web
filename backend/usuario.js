const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fotoPerfil: { type: String, default: "" } // opcional para tu frontend
}, { timestamps: true });

module.exports = mongoose.model("Usuario", usuarioSchema);