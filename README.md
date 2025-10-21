# stadvdb-mco1

Use Python 3.11.9 environment to run etl_steamdata. Install needed libraries.

To run mysql convertion (last cell),
Run:
pip install sqlalchemy
pip install mysql-connector-python
and setup in mysql workbench:
Make a connection and set the credentials in the code.
Then execute:
CREATE DATABASE <dbname>;
USE <dbname>;

Dependencies for running backend:
npm install dotenv express mysql2 cors

Change the .env file to:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<your password>
DB_NAME=<dbname>

Run backend on local port 5000 using:
node server.js
