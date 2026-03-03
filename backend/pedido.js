const mongoose = require("mongoose");

const pedidoSchema = new mongoose.Schema({
    usuario: { type: String, required: true }, // correo del usuario
    nombreCliente: { type: String, required: true },
    direccion: { type: String, required: true },
    productos: [
        {
            nombre: String,
            precio: Number,
            cantidad: Number
        }
    ],
    estado: { 
        type: String, 
        enum: ["Pendiente", "EnPreparacion", "Enviado", "Entregado", "Cancelado"], 
        default: "Pendiente" 
    },
    total: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Pedido", pedidoSchema);