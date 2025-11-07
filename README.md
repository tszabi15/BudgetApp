# 💰 BudgetApp - Full-Stack Transaction Tracker

This is a complete full-stack web application built with a React frontend and a Flask (Python) backend. It allows users to register, log in, and manage their personal finances by tracking income and expenses.

The application features a robust JWT authentication system, role-based access control (User vs. Admin), and a full-featured admin panel for managing users and viewing all system-wide transactions.

## ✨ Features

* **Authentication:** Full JWT Authentication (Register, Login, Logout).
* **Security:** Protected routes for logged-in users and separate protected routes for admins.
* **Responsive Layout:** Modern, responsive sidebar navigation.
* **404 Page:** A catch-all route for non-existent pages.

### 👤 User Features

* **Transaction Management:** Full CRUD (Create, Read, Update, Delete) for personal transactions.
* **Statistics Dashboard:**
    * View monthly or yearly summaries (Total Income, Expenses, Net Balance).
    * View advanced stats (Total Transactions, Biggest Expense, Average Expense).
* **Filtering:** Filter transactions by description and category on a dedicated "All Transactions" page.
* **Currency Selection:** Instantly change your preferred currency (e.g., USD, HUF, EUR) from the navigation bar.

### 🛡️ Admin Features

* **Admin-Only Panel:** Accessible via a secure dropdown menu in the navigation.
* **User Management (CRUD):**
    * View a list of all users in the system.
    * Edit any user's details (username, email, role).
    * Delete any user (and all their associated transactions).
* **Global Transaction View:**
    * View, search, and filter *all* transactions from *all* users.
    * Edit or Delete any transaction in the system.

## 🛠️ Tech Stack

### Backend (Flask)
* **Python 3**
* **Flask:** A micro web framework for the API.
* **SQLAlchemy:** ORM for database interaction.
* **SQLite:** Default database for simple setup.
* **Flask-Bcrypt:** For secure password hashing.
* **PyJWT:** For generating and verifying JSON Web Tokens.
* **Flask-CORS:** To handle cross-origin requests from the React frontend.

### Frontend (React)
* **React 18 (with Vite):** For a fast, modern UI.
* **React Router v6:** For all client-side routing.
* **React Context API:** For global state management (Authentication).
* **Axios:** For making API requests (configured with interceptors to auto-send JWTs).
* **Font Awesome:** For icons in the UI.
* **CSS:** Standard CSS files for component styling.

## 🚀 Installation and Setup

To run this project locally, you will need **Python 3.x** and **Node.js (with npm)** installed.

The project is split into two folders: `BudgetApp_backend` and `BudgetApp_frontend`. You will need to run them in **two separate terminals.**

### 1. Backend (Flask) Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd BudgetApp-backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the environment
# On Mac/Linux:
source venv/bin/activate
# On Windows (cmd):
.\venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the server
# This will also create the 'database.db' and seed the 'user'/'admin' roles
python run.py
```

Your backend is now running at [http://127.0.0.1:5000](http://127.0.0.1:5000)

### 2. Frontend (React) Setup

```bash
cd BudgetApp-frontend

npm install

npm run dev
```

Your frontend is now running at [http://localhost:5173](http://localhost:5173)

## 👨‍💻 Creating an Admin User

By default, all registered users have the 'user' role. To promote a user to 'admin', follow these steps:

1. Register a new user in the React application (e.g., admin@app.com).

2. Stop your Flask server (Ctrl+C).

3. Run the Flask Shell:
```bash
flask shell
```

4. Inside the shell, run the following Python commands to find your user and the admin role:
```python
from app.extensions import db
from app.models import User, Role

u = User.query.filter_by(email='admin@app.com').first()

r = Role.query.filter_by(name='admin').first()

u.role = r
db.session.commit()

print(f"User {u.username} is now an admin.")
exit()
```

5. Restart your Flask server:
```bash
python run.py
```

When you log in with your admin@app.com user, you will now see the "Admin" dropdown in the navigation.

## 🔌 API Endpoints

A quick reference for all available API endpoints.

### Authentication

#### POST /api/register
- **Protection:** Public
- **Body:** {"username", "email", "password"}
- **Description:** Creates a new user with the default 'user' role.

#### POST /api/login
- **Protection:** Public
- **Body:** {"email", "password"}
- **Description:** Authenticates a user and returns a JWT token and user object (including roles and currency).

### User Transactions & Stats

#### GET /api/transactions
- **Protection:** User (Token Required)
- **Query Params:** ?search=<term>&category=<term>
- **Description:** Gets all transactions for the logged-in user, with optional filtering.

#### POST /api/transactions
- **Protection:** User (Token Required)
- **Body:** {"description", "amount", "category" (opt), "date" (opt)}
- **Description:** Creates a new transaction for the logged-in user.

#### PUT /api/transactions/<id>
- **Protection:** User (Owner) or Admin
- **Body:** {"description", "amount", "category", "date"}
- **Description:** Updates an existing transaction.

#### DELETE /api/transactions/<id>
- **Protection:** User (Owner) or Admin
- **Description:** Deletes a specific transaction.

#### GET /api/categories
- **Protection:** User (Token Required)
- **Description:** Returns a list of all unique category names for the logged-in user.

#### GET /api/stats
- **Protection:** User (Token Required)
- **Query Params:** ?month=<num>&year=<num> (Note: month=0 returns stats for the whole year).
- **Description:** Calculates and returns a full statistics object (income, expense, net, avg, max) for the given period.

#### PUT /api/profile/settings
- **Protection:** User (Token Required)
- **Body:** {"currency": "USD"}
- **Description:** Updates the logged-in user's currency preference.

### Admin Panel

#### GET /api/transactions/all
- **Protection:** Admin
- **Description:** Gets all transactions from all users, including username and currency.

#### GET /api/admin/users
- **Protection:** Admin
- **Description:** Gets a list of all users and their roles/details.

#### PUT /api/admin/users/<id>
- **Protection:** Admin
- **Body:** {"username", "email", "role"}
- **Description:** Updates a specific user's details.

#### DELETE /api/admin/users/<id>
- **Protection:** Admin
- **Description:** Deletes a user and all their associated data. (Cannot delete self).

#### GET /api/roles
- **Protection:** Admin
- **Description:** Returns a list of all available role names (e.g., 'user', 'admin').
