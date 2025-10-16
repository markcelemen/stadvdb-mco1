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