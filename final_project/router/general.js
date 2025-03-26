const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const books = {
  "978-3-16-148410-0": { title: "Book One", author: "Author A", reviews: [] },
  "978-1-4028-9462-6": { title: "Book Two", author: "Author B", reviews: [] },
};

const users = [];
const SECRET_KEY = "your_secret_key";

const public_users = express.Router();
const regd_users = express.Router();

// Middleware de autenticación para rutas protegidas
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(403)
      .json({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Obtener la lista de libros
public_users.get("/", (req, res) => {
  res.json(books);
});

// Obtener detalles de un libro por ISBN
public_users.get("/isbn/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  book ? res.json(book) : res.status(404).json({ message: "Book not found" });
});

// Obtener todos los libros por Autor
public_users.get("/author/:author", (req, res) => {
  const filteredBooks = Object.values(books).filter(
    (book) => book.author === req.params.author
  );
  res.json(filteredBooks);
});

// Obtener todos los libros por Título
public_users.get("/title/:title", (req, res) => {
  const filteredBooks = Object.values(books).filter(
    (book) => book.title === req.params.title
  );
  res.json(filteredBooks);
});

// Obtener reseñas de un libro
public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  book
    ? res.json(book.reviews)
    : res.status(404).json({ message: "Book not found" });
});

// Registrar un nuevo usuario
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  if (users.some((user) => user.username === username)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword });
  res.json({ message: "User registered successfully" });
});

// Iniciar sesión
public_users.post("/customer/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// Aplicar autenticación a las rutas protegidas
regd_users.use(authMiddleware);

// Agregar o modificar una reseña
regd_users.post("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;
  const username = req.user.username;

  if (!books[isbn]) return res.status(404).json({ message: "Book not found" });

  const existingReview = books[isbn].reviews.find(
    (r) => r.username === username
  );
  existingReview
    ? (existingReview.review = review)
    : books[isbn].reviews.push({ username, review });

  res.json({ message: "Review added/updated successfully" });
});

// Eliminar una reseña
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const username = req.user.username;

  if (!books[isbn]) return res.status(404).json({ message: "Book not found" });

  books[isbn].reviews = books[isbn].reviews.filter(
    (r) => r.username !== username
  );
  res.json({ message: "Review deleted successfully" });
});

app.use("/api", public_users);
app.use("/api", regd_users);

module.exports = {
  general: public_users,
  authenticated: regd_users,
};
