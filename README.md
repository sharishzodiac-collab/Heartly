# 🌸 Heartly — Premium Artisanal Gifting

> A full-stack artisanal e-commerce web application for curated gift experiences, built with HTML/CSS/JS on the frontend and Python Flask + MySQL on the backend.

---

## ✨ Features

- 🛍️ **Product Catalog** — Browse artisanal gifts by category
- 🎁 **Surprise Box** — Curated gift box builder experience
- 🔐 **User Authentication** — Register, login, and manage your profile
- 🛒 **Shopping Cart** — Add items and checkout seamlessly
- 📦 **Order Tracking** — Track your surprise box delivery
- 📱 **Responsive Design** — Works across all screen sizes
- 🔌 **REST API** — Flask backend with MySQL integration

---

## 🗂️ Project Structure

```
Heartly/
├── index.html              # Homepage
├── category.html           # Gift categories / collections
├── items.html              # All products listing
├── checkout.html           # Checkout page
├── auth.html               # Login & Register
├── profile.html            # User profile
├── track.html              # Order tracking
│
├── styles.css              # Global styles
├── auth.css                # Auth page styles
├── cart.css                # Cart styles
├── category.css            # Category page styles
├── checkout.css            # Checkout styles
│
├── products.js             # Product rendering & logic
├── cart.js                 # Cart management
├── auth.js                 # Authentication logic
│
├── server.py               # Flask API server
├── db.py                   # MySQL database connector
├── database.sql            # Database schema & seed data
├── product.json            # Static product data (fallback)
│
├── db_config.example.json  # ← Copy this to db_config.json and fill in your credentials
├── .gitignore
└── image/                  # Product images
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- MySQL 8.0+
- pip

### 1. Clone the Repository

```bash
git clone https://github.com/sharishzodiac-collab/Heartly.git
cd Heartly
```

### 2. Set Up the Database

```bash
mysql -u root -p < database.sql
```

### 3. Configure Database Credentials

```bash
cp db_config.example.json db_config.json
```

Edit `db_config.json` with your MySQL credentials:

```json
{
  "host": "localhost",
  "user": "your_db_user",
  "password": "your_password",
  "database": "heartly_db",
  "port": 3306
}
```

### 4. Install Python Dependencies

```bash
pip install flask mysql-connector-python
```

### 5. Run the Server

```bash
python server.py
```

The app will be available at **http://localhost:5000** 🎉

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Check database connection status |
| `GET` | `/api/products` | Fetch all products (optional `?category=` filter) |
| `POST` | `/api/orders` | Create a new order |

---

## 🛡️ Security Notes

- `db_config.json` is listed in `.gitignore` and **will never be committed**
- Always use `db_config.example.json` as a reference template
- Never hardcode credentials in source files

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python, Flask |
| Database | MySQL |
| API | REST (JSON) |

---

## 📄 License

This project is for educational and personal use.

---

<p align="center">Made with 🌸 by <a href="https://github.com/sharishzodiac-collab">sharishzodiac-collab</a></p>
