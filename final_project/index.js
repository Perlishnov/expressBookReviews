const express = require("express");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const customer_routes = require("./router/auth_users.js").authenticated;
const genl_routes = require("./router/general.js").general;

const app = express();

app.use(express.json());

app.use(
  "/customer",
  session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true,
  })
);

// Middleware de autenticación para rutas protegidas
app.use("/customer/auth/*", function auth(req, res, next) {
  // Se espera que el token se envíe en el header Authorization en el formato "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(403)
      .json({ message: "Acceso denegado. No se proporcionó token." });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(403)
      .json({ message: "Acceso denegado. Token no válido." });
  }
  try {
    // Reemplaza 'your_secret_key' por la misma clave utilizada en la generación del token
    const decoded = jwt.verify(token, "your_secret_key");
    req.user = decoded; // Agrega la información decodificada al objeto de la petición
    next(); // Continúa al siguiente middleware o ruta
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running on port", PORT));
