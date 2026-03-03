// backend/db.js

const mongoose = require("mongoose");

// URI de conexión a MongoDB
// Si usas MongoDB Atlas (cloud), reemplaza <usuario>, <password>, <cluster> y <dbname>
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pasteleria";

// Función para conectar
const conectarDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Conexión a MongoDB exitosa");
    } catch (error) {
        console.error("❌ Error al conectar a MongoDB:", error.message);
        process.exit(1); // Sale del proceso si no conecta
    }
};

// Exportamos la función para usarla en server.js
module.exports = conectarDB;