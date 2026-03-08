// server.js - Versión corregida para Render (sin PathError y path correcto)
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");  // para verificar archivos
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 5000;

console.log("Iniciando servidor en Render...");

/* ========================
   🔥 MIDDLEWARES
======================== */
app.use(cors());
app.use(express.json());

/* ========================
   📂 CONFIGURAR FRONTEND (public en raíz)
======================== */
const FRONTEND_PATH = path.join(__dirname, '..', 'public');
console.log("Ruta frontend configurada:", FRONTEND_PATH);

// Verificar si la carpeta existe
if (!fs.existsSync(FRONTEND_PATH)) {
  console.error("❌ Carpeta public NO encontrada en:", FRONTEND_PATH);
} else {
  console.log("✅ Carpeta public encontrada");
}

app.use(express.static(FRONTEND_PATH));

// Ruta raíz: sirve index.html
app.get("/", (req, res) => {
  const file = path.join(FRONTEND_PATH, "index.html");
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).send("index.html no encontrado");
  }
});

// Rutas explícitas para cada HTML
const htmlPages = ["login", "register", "admin", "carrito", "mis-pedidos", "pagos", "perfil"];
htmlPages.forEach(page => {
  app.get(`/${page}.html`, (req, res) => {
    const file = path.join(FRONTEND_PATH, `${page}.html`);
    if (fs.existsSync(file)) {
      res.sendFile(file);
    } else {
      res.status(404).send(`${page}.html no encontrado`);
    }
  });
});

// Catch-all middleware para fallback (sin usar app.get("*"))
app.use((req, res, next) => {
  const file = path.join(FRONTEND_PATH, "index.html");
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).send("Página no encontrada - fallback falló");
  }
});

/* ========================
   🗄 CONEXIÓN MONGODB
======================== */
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pasteleria";
console.log("Intentando conectar a MongoDB...");

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB conectado exitosamente"))
  .catch(err => {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    // NO process.exit(1);  // para que el server siga corriendo y veamos el frontend
  });

/* ========================
   📦 MODELOS (sin cambios)
======================== */
const usuarioSchema = new mongoose.Schema({
  nombre: String,
  correo: { type: String, unique: true },
  password: String,
  role: { type: String, default: "cliente" }
});
const Usuario = mongoose.model("Usuario", usuarioSchema);

const pedidoSchema = new mongoose.Schema({
  usuario: String,
  nombreCliente: String,
  direccion: String,
  productos: [{ nombre: String, precio: Number, cantidad: Number }],
  total: Number,
  estado: { type: String, default: "Pendiente" },
  createdAt: { type: Date, default: Date.now }
});
const Pedido = mongoose.model("Pedido", pedidoSchema);

/* ========================
   RUTAS USUARIOS y PEDIDOS (sin cambios, pero con logs)
======================== */
// ... (copia todas tus rutas de usuarios y pedidos del código original aquí, solo agrega console.error si quieres más debug)

// Ejemplo para /api/usuarios:
app.post("/api/usuarios", async (req, res) => {
  try {
    // tu código original...
  } catch (err) {
    console.error("Error en /api/usuarios:", err.message);
    res.status(500).json({ mensaje: "Error al crear usuario" });
  }
});

// (pega el resto igual)

/* ========================
   🔥 SERVIDOR
======================== */
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});