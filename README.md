# Steam Analytics Dashboard (stadvdb-mco1)

This project is a full-stack web application that performs the following:

1.  **ETL (Extract, Transform, Load):** A Python script (`etl_steamdata.ipynb`) fetches Steam datasets, cleans and transforms them, and loads the data into a MySQL database.
2.  **Backend:** A Node.js server (`backend/server.js`) connects to the database and provides a REST API for the data.
3.  **Frontend:** A single-page application (`index.html`) visualizes the data from the API in a series of charts and graphs.

---

## Table of Contents

1.  [Prerequisites](#1-prerequisites)
2.  [Environment Setup (Python)](#2-environment-setup-python)
3.  [Database and ETL Setup](#3-database-and-etl-setup)
4.  [Backend Setup (Node.js)](#4-backend-setup-nodejs)
5.  [Running the Application](#5-running-the-application)
6.  [Stopping the Application](#6-stopping-the-application)
7.  [Troubleshooting Guide](#7-troubleshooting-guide)

---

## 1. Prerequisites

Before you begin, ensure you have the following installed and **running** on your system:

- **Python:** Version **3.13.1** is recommended. _(The ETL script itself may also work with 3.11.9)_.
- **`pyenv`:** (Optional but highly recommended for managing Python versions).
- **Node.js:** Version **20.x** or later recommended.
- **npm:** Comes with Node.js.
- **MySQL Server:** A local installation of MySQL. **➡️ IMPORTANT: Ensure your MySQL server is running before proceeding.** See [Database and ETL Setup](#3-database-and-etl-setup) for start commands.
- **MySQL Workbench:** (Or another SQL client) for database management and initial setup.
- **Git:** For cloning the repository (if applicable).
- **VS Code:** (Or your preferred code editor).

---

## 2. Environment Setup (Python)

This project requires a specific Python environment to run the data loading script.

1.  **Install Python 3.13.1 (Recommended)**
    If using `pyenv`:

    ```bash
    pyenv install 3.13.1
    ```

2.  **Set Local Python Version**
    Navigate to your project's root directory in the terminal and set the version for this folder. Replace `/path/to/your/project/` with the actual path.

    ```bash
    cd /path/to/your/project/stadvdb-mco1
    pyenv local 3.13.1
    ```

    _(This creates a `.python-version` file.)_

3.  **Troubleshooting: Fix Stuck Python Version (If using `pyenv`)**

    - If new terminals still show an old Python version (e.g., 3.11.9), you need to remove an overriding setting.
    - Open your shell configuration file (e.g., `~/.zshrc` for Zsh or `~/.bash_profile` for Bash) in your editor:
      ```bash
      # For Zsh
      code ~/.zshrc
      # For Bash
      code ~/.bash_profile
      ```
    - In the file, find and **delete any line** that looks like `pyenv shell <old_version_number>`.
    - Save and close the file.

4.  **Restart Your Terminal**
    You **must** restart your VS Code terminal (or any terminal session) for the new Python version or the shell configuration changes to become active. Click the "trash can" icon in the VS Code terminal panel and open a new one. Verify the version:

    ```bash
    python --version
    # Should output: Python 3.13.1
    ```

5.  **Install Python Dependencies**
    Install all required libraries for the ETL script. The timeout flag helps prevent errors on slow connections. This includes libraries for data handling, connecting to MySQL, and running the notebook.
    ```bash
    pip install --default-timeout=100 --upgrade pandas datasets requests beautifulsoup4 sqlalchemy mysql-connector-python ipykernel
    ```

---

## 3. Database and ETL Setup

This step creates the database and fills it with data.

1.  **Start Your MySQL Server**

    - Ensure your local MySQL server is **running**. Open a terminal and use the appropriate command:
    - **If installed via Homebrew (most likely on Mac):**
      ```bash
      brew services start mysql
      ```
      _(If it's already running, this command will state that.)_
    - **If installed via official installer:**
      ```bash
      sudo /usr/local/mysql/bin/mysql.server start
      ```

2.  **Create the Database**

    - In MySQL Workbench (or your SQL client), connect to your running local server.
    - Run the following commands to create a fresh, empty database. Replace `<dbname>` with your desired database name (e.g., `dimgame`).
      ```sql
      CREATE DATABASE IF NOT EXISTS <dbname>;
      USE <dbname>;
      ```
    - **IMPORTANT:** Do **NOT** run the `schema.sql` file. The Python script in the next step will create and manage all the tables for you.

3.  **Run the ETL Script**
    - In VS Code, open the file `etl_steamdata.ipynb`.
    - When prompted to "Select a Kernel", choose the **Python 3.13.1** environment you set up.
    - Scroll to the **very last code cell** in the notebook.
    - Find the line starting with `engine = create_engine(...)`.
    - Replace it with your specific database credentials. **These credentials must match what you will put in the `.env` file later.**
      ```python
      # Use your actual MySQL username, password, and database name
      # Example: engine = create_engine('mysql+mysqlconnector://root:MySecretPass@localhost/dimgame')
      engine = create_engine('mysql+mysqlconnector://<your_user>:<your_password>@localhost/<dbname>')
      ```
    - Click the **"Run All"** button (`>>`) at the top of the notebook editor.
    - Wait for the script to finish (it may take a few minutes). You must see the final success message in the output: `🎉 All tables successfully created and loaded into MySQL!`

---

## 4. Backend Setup (Node.js)

This configures the Node.js server that will act as our API.

1.  **Navigate to the Backend Folder**

    ```bash
    cd /path/to/your/project/stadvdb-mco1/backend
    ```

2.  **Create `.env` File**
    Create a new file named `.env` inside the `backend` folder. Add your database credentials. **These must match the credentials you used in the Python script.** Replace placeholders with your actual values.

    ```dotenv
    DB_HOST=localhost
    DB_USER=root # Or your specific MySQL user
    DB_PASSWORD=<your password>
    DB_NAME=<dbname> # e.g., dimgame
    PORT=5000
    ```

3.  **Install Node.js Dependencies**
    This will install all required packages listed in `package.json`, including Express, MySQL connector, CORS, and dotenv.
    ```bash
    npm install
    ```
    _(If `package.json` is missing dependencies, you might need: `npm install dotenv express mysql2 cors`)_
    _(Note: This project's `package.json` must include `"type": "module"` for `import` statements to work.)_

---

## 5. Running the Application

The application requires two separate terminals running simultaneously.

1.  **Start the Backend Server (Terminal 1)**

    - In your first terminal, make sure you are in the `backend` directory.
    - Run the start command:
      ```bash
      npm start
      ```
    - The terminal should display: `Server running on port 5000`.
    - **Keep this terminal running.** (If you get an `EADDRINUSE` error, see the [Troubleshooting Guide](#7-troubleshooting-guide)).

2.  **Start the Frontend Server (Terminal 2)**

    - Open a **second, new terminal**.
    - Navigate to the **root project folder** (NOT the `backend` folder).
      ```bash
      cd /path/to/your/project/stadvdb-mco1
      ```
    - Run this command to start a simple web server for the `index.html` file:
      ```bash
      python3 -m http.server 8000
      ```
      _(Explicitly using port 8000)_
    - **Keep this terminal running.**

3.  **View the Dashboard**
    - Open your web browser and go to this address:
      ```
      http://localhost:8000
      ```
    - The dashboard should load and display the charts.

---

## 6. Stopping the Application

To shut down all parts of the application properly:

1.  **Stop Backend Server:**
    - Go to the terminal where the backend (`npm start`) is running.
    - Press `Control + C`.
2.  **Stop Frontend Server:**
    - Go to the terminal where the frontend (`python3 -m http.server`) is running.
    - Press `Control + C`.
3.  **Stop MySQL Server (Optional):**
    - If you want to stop the database server itself (not always necessary), open a new terminal and use the appropriate command for your installation method:
    - **If installed via Homebrew (most likely on Mac):**
      ```bash
      brew services stop mysql
      ```
    - **If installed via official installer:**
      ```bash
      sudo /usr/local/mysql/bin/mysql.server stop
      ```

---

## 7. Troubleshooting Guide

- **Error:** `EADDRINUSE: address already in use :::5000` **(Backend)**

  - **Cause:** Another process is using port 5000. On macOS, this is often the **AirPlay Receiver** service.
  - **Solution 1 (macOS - Permanent):** Disable AirPlay Receiver.
    1.  Go to **System Settings > General > AirDrop & Handoff**.
    2.  Find the **AirPlay Receiver** setting and turn it **OFF**.
    3.  Try `npm start` again.
  - **Solution 2 (General):** Find and stop the conflicting process.
    1.  Run `lsof -i :5000` to find the Process ID (PID) using the port.
    2.  Run `kill -9 <PID>` (replace `<PID>` with the actual number).
    3.  Try `npm start` again.

- **Error:** `Cannot find module ... server.js` **(Backend)**

  - **Cause:** Node.js modules are not installed, or you are not in the correct (`backend`) directory.
  - **Solution:** Make sure you are in the `backend` directory and run `npm install`. Verify `node_modules` folder exists.

- **Error:** Connection refused / Cannot connect to database **(Python ETL or Backend)**
  - **Cause 1:** MySQL Server is not running.
  - **Solution 1:** Start your MySQL server using the commands in [Step 3.1](#3-database-and-etl-setup).
  - **Cause 2:** Incorrect credentials in Python script (`create_engine`) or `.env` file.
  - **Solution 2:** Double-check `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_HOST` in both places. Ensure they match exactly.
  - **Cause 3:** Firewall blocking connection (less common for localhost).
  - **Solution 3:** Check system firewall settings.

_(Add more common errors and solutions here as needed)_
