// server.js - Versión fija para Render (no PathError, path correcto, fallback middleware)
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 5000;

console.log("Iniciando servidor en Render...");

/* ========================
   🔥 MIDDLEWARES
======================== */
app.use(cors({ origin: '*' })); // Permite CORS desde cualquier origen (temporal para pruebas)
app.use(express.json());

/* ========================
   📂 CONFIGURAR FRONTEND (public en raíz)
======================== */
const FRONTEND_PATH = path.join(__dirname, '..', 'public');
console.log("Ruta frontend configurada:", FRONTEND_PATH);

app.use(express.static(FRONTEND_PATH));

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

// Rutas explícitas para páginas HTML
const htmlPages = ["login", "register", "admin", "carrito", "mis-pedidos", "pagos", "perfil"];
htmlPages.forEach(page => {
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, `${page}.html`));
  });
});

// Fallback seguro (middleware, no app.get("*"))
app.use((req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

/* ========================
   🗄 CONEXIÓN MONGODB - No crashea si falla
======================== */
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pasteleria";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error MongoDB:", err.message));  // No exit

/* ========================
   📦 MODELOS (igual)
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
   RUTAS (igual, con logs extra)
======================== */
app.post("/api/usuarios", async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;
    const existe = await Usuario.findOne({ correo });
    if (existe) return res.status(400).json({ mensaje: "Correo ya registrado" });
    const hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({ nombre, correo, password: hash });
    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario creado", usuario: { nombre, correo, role: nuevoUsuario.role } });
  } catch (err) {
    console.error("Error /api/usuarios:", err.message);
    res.status(500).json({ mensaje: "Error al crear usuario" });
  }
});

// (pega el resto de rutas de login y pedidos igual que en tu original)

app.listen(PORT, () => {
  console.log(`🔥 Servidor en puerto ${PORT}`);
});