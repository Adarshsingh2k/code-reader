from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database

# Update the URL with your PostgreSQL database details
DATABASE_URL = "postgresql://codeuser:root1234@localhost:5432/code_reader"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Define the table schema
files_table = Table(
    "files",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("filename", String, index=True),
    Column("filepath", String),
    Column("content_type", String),
    Column("size", Integer),
    Column("analysis", Text),
)

# Create the table in the database
metadata.create_all(engine)

# Async database connection
database = Database(DATABASE_URL)

# SQLAlchemy session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
