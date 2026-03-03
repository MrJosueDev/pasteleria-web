// server.js - Versión final para Render con frontend en public y rutas HTML explícitas
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 5000;

/* ========================
   🔥 MIDDLEWARES
======================== */
app.use(cors());
app.use(express.json());

/* ========================
   📂 CONFIGURAR FRONTEND
======================== */
const FRONTEND_PATH = path.join(__dirname, "..", "public");
app.use(express.static(FRONTEND_PATH));

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

// Rutas explícitas para cada HTML
const htmlPages = ["login", "register", "admin", "carrito", "mis-pedidos", "pagos", "perfil"];
htmlPages.forEach(page => {
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, `${page}.html`));
  });
});

/* ========================
   🗄 CONEXIÓN MONGODB
======================== */
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pasteleria";
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error MongoDB:", err));

/* ========================
   📦 MODELOS
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
   👤 RUTAS USUARIOS
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
    console.error(err);
    res.status(500).json({ mensaje: "Error al crear usuario" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { correo, password } = req.body;
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(400).json({ mensaje: "Correo no encontrado" });
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    res.json({ mensaje: "Login exitoso", usuario: { nombre: usuario.nombre, correo: usuario.correo, role: usuario.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error en login" });
  }
});

/* ========================
   🛒 RUTAS PEDIDOS
======================== */
app.post("/api/pedidos", async (req, res) => {
  try {
    const { usuario, nombreCliente, direccion, productos, total } = req.body;
    const nuevoPedido = new Pedido({ usuario, nombreCliente, direccion, productos, total });
    await nuevoPedido.save();
    res.status(201).json({ mensaje: "Pedido creado", pedido: nuevoPedido });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al crear pedido" });
  }
});

app.get("/api/pedidos/:correo", async (req, res) => {
  try {
    const pedidos = await Pedido.find({ usuario: req.params.correo }).sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener pedidos" });
  }
});

app.get("/api/pedidos", async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al obtener pedidos" });
  }
});

app.put("/api/pedidos/:id", async (req, res) => {
  try {
    const { estado } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });
    res.json({ mensaje: "Estado actualizado", pedido });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al actualizar estado" });
  }
});

app.delete("/api/pedidos/:id", async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });
    res.json({ mensaje: "Pedido eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al eliminar pedido" });
  }
});

/* ========================
   🔥 SERVIDOR
======================== */
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});