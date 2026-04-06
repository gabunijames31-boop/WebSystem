#  SET UP GUIDE

### Prerequisites
- **node.js** (v14.x or higher)
- **npm** (v6.x or higher)
- **SQLite3** (automatically handled by the project dependencies)

# Installation
- **clone the Repository**
   ```bash
   git clone https://github.com/gabunijames31-boop/WebSystem.git
   cd WebSystem
   ```

- **Install Dependencies**
   ```bash
   npm install
   ```

- **Environment Setup**
   Create a `.env` file in the root directory (refer to the **Configuration** section below).

---

# .env configuration

this project implemented .env files to access admin features make sure your `.env` file contains the following:

| Variable         | Description                             | Example Value               |
| :--------------- | :-------------------------------------- | :-------------------------- |
| `PORT`           | The port the server will listen on      | `3000`                      |
| `SESSION_SECRET` | Secret key for session encryption       | `your_secure_random_string` |
| `ADMIN_USERNAME` | Master login for the admin dashboard    | `admin@example.com`         |
| `ADMIN_PASSWORD` | Master password for the admin dashboard | `secure_password_123`       |
| `DB_PATH`        | Path to the SQLite database file        | `./library.db`              |

## alternative .env set up
- you can use the .env.sample provided by this repo just simply copy this command 
```bash
cp .env.sample .env
```


>[!REMINDER]
>if you chose the alternative (ez way) of setting up your .env file the default username is `frtzhahn@com` and the default password is `liohamn`



---

# Building/Running

- use `nodemon` to automatically restart the server on file changes:
```bash
npm run dev
```

- start the standard Node.js server:
```bash
npm start
```

- once running, access the login page at `http://localhost:3000`.

- to access other pages manually change the URL based on what page you want to navigate (e.g: `http://localhost:3000/homepage.html`)

- to access admin features, login with the admin credentials in the `.env` file

---
# testing


currently, the project uses manual verification for UI and API flows since this was a rushed fix to verify the backend integrity:
- Ensure the server starts without errors.
- Verify that `library.db` is created/accessed correctly upon boot.
- Check the logs for `Server running on port 3000. WAL mode active.`
