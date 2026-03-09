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
   🔥 MIDDLEWARES (primero)
======================== */
app.use(cors({ origin: '*' }));  // Permite cualquier origen (temporal para pruebas)
app.use(express.json());

/* ========================
   RUTAS API (antes de static y fallback)
======================== */
app.post("/api/usuarios", async (req, res) => {
  console.log("POST /api/usuarios recibido:", req.body);
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

app.post("/api/login", async (req, res) => {
  console.log("POST /api/login recibido:", req.body);
  try {
    const { correo, password } = req.body;
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(400).json({ mensaje: "Correo no encontrado" });
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    res.json({ mensaje: "Login exitoso", usuario: { nombre: usuario.nombre, correo: usuario.correo, role: usuario.role } });
  } catch (err) {
    console.error("Error /api/login:", err.message);
    res.status(500).json({ mensaje: "Error en login" });
  }
});

// POST para crear pedido (desde pagos.html)
app.post("/api/pedidos", async (req, res) => {
  console.log("POST /api/pedidos recibido:", req.body);
  try {
    const { usuario, nombreCliente, direccion, productos, total } = req.body;
    const nuevoPedido = new Pedido({ usuario, nombreCliente, direccion, productos, total });
    await nuevoPedido.save();
    res.status(201).json({ mensaje: "Pedido creado", pedido: nuevoPedido });
  } catch (err) {
    console.error("Error /api/pedidos POST:", err.message);
    res.status(500).json({ mensaje: "Error al crear pedido" });
  }
});

// GET para listar TODOS los pedidos (para admin.html)
app.get("/api/pedidos", async (req, res) => {
  console.log("GET /api/pedidos recibido - cargando todos los pedidos para admin");
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    console.error("Error /api/pedidos GET:", err.message);
    res.status(500).json({ mensaje: "Error al obtener pedidos" });
  }
});

// GET para pedidos del usuario actual (para mis-pedidos.html)
app.get("/api/pedidos/usuario/:correo", async (req, res) => {
  console.log("GET /api/pedidos/usuario recibido:", req.params.correo);
  try {
    const pedidos = await Pedido.find({ usuario: req.params.correo }).sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    console.error("Error /api/pedidos/usuario:", err.message);
    res.status(500).json({ mensaje: "Error al obtener pedidos del usuario" });
  }
});

// PUT para actualizar el estado de un pedido (desde admin.html)
app.put("/api/pedidos/:id", async (req, res) => {
  console.log("PUT /api/pedidos/:id recibido:", req.params.id, req.body);
  try {
    const { estado } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });
    res.json({ mensaje: "Estado actualizado", pedido });
  } catch (err) {
    console.error("Error /api/pedidos/:id:", err.message);
    res.status(500).json({ mensaje: "Error al actualizar estado" });
  }
});

// DELETE para eliminar un pedido (desde admin.html)
app.delete("/api/pedidos/:id", async (req, res) => {
  console.log("DELETE /api/pedidos/:id recibido:", req.params.id);
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });
    res.json({ mensaje: "Pedido eliminado correctamente" });
  } catch (err) {
    console.error("Error /api/pedidos/:id DELETE:", err.message);
    res.status(500).json({ mensaje: "Error al eliminar pedido" });
  }
});

/* ========================
   📂 CONFIGURAR FRONTEND (después de API)
======================== */
const FRONTEND_PATH = path.join(__dirname, '..', 'public');
console.log("Ruta frontend:", FRONTEND_PATH);

app.use(express.static(FRONTEND_PATH));

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

// Rutas explícitas para HTML
const htmlPages = ["login", "register", "admin", "carrito", "mis-pedidos", "pagos", "perfil"];
htmlPages.forEach(page => {
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, `${page}.html`));
  });
});

// Fallback (solo para frontend, al final)
app.use((req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

/* ========================
   🗄 CONEXIÓN MONGODB
======================== */
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error MongoDB:", err.message));

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
   🔥 SERVIDOR
======================== */
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});