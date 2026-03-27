import logging
import os
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager


logger=logging.getLogger(__name__)


class PostgreService:
    def __init__(self):
        logger.info("PostgreService initialized successfully!")
        self.host=os.getenv('DB_HOST')
        self.port=int(os.getenv('DB_PORT'))
        self.dbname=os.getenv('DB_NAME')
        self.user=os.getenv('DB_USER')
        self.password=os.getenv('DB_PASSWORD')
        self.pool=None
        self.min_conn = int(os.getenv('DB_MIN_CONN', 1))
        self.max_conn = int(os.getenv('DB_MAX_CONN', 100))

        try:
            self.pool=ThreadedConnectionPool(
                minconn=self.min_conn,
                maxconn=self.max_conn,
                host=self.host,
                port=self.port,
                dbname=self.dbname,
                user=self.user,
                password=self.password
            )
            conn = self.pool.getconn()
            self.pool.putconn(conn)
            logger.info("Connected to PostgreSQL successfully!")
            
            self.init_tables()
            
            logger.info("PostgreService initialized successfully")

        except Exception as e:
            logger.error("Failed to connect to PostgreService: %s", str(e))
            raise

    @contextmanager
    def get_connection(self):
        if self.pool is None:
            raise RuntimeError("Pool not available")
        conn = self.pool.getconn()
        try:
            yield conn
        finally:
            self.pool.putconn(conn)

    @contextmanager
    def get_cursor(self, commit_on_exit=False):
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            try:
                yield cursor
                if commit_on_exit:
                    conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cursor.close()

    def execute_query(self, query, params=None, fetch_one=False, fetch_all=False, commit=False):
        with self.get_cursor(commit_on_exit=commit) as cursor:
            cursor.execute(query, params)
            if fetch_one:
                return cursor.fetchone()
            if fetch_all:
                return cursor.fetchall()
            return None

    def close(self):
        if self.pool:
            self.pool.closeall()
            logger.info("PostgreSQL connection pool closed")


    def get_user(self,login):
        result = None
        try:
            result = self.execute_query("SELECT * FROM users WHERE login = %s LIMIT 1",
                                        (login,),
                                        fetch_one=True)
            
            return result
        except Exception as e:
            logger.info(f"User {login} not found: {e}")
            return None
    
    def init_tables(self):
        logger.info("Checking if users table exists...")
        try:
            result = self.execute_query("SELECT 1 FROM users LIMIT 1", fetch_one=True)
            logger.info("Table 'users' already exists")
        except Exception as e:
            logger.info(f"Table 'users' does not exist, creating... (error: {e})")
            try:
                self.execute_query("""
                    CREATE TABLE users (
                        login VARCHAR(255) UNIQUE PRIMARY KEY,
                        hashed_password VARCHAR(255),
                        description VARCHAR(255)
                    )
                """, commit=True)
                logger.info("Table 'users' created successfully")
            except Exception as e:
                logger.error(f"Error creating table 'users': {e}")
                raise

        logger.info("All tables initialized")
  

    def create_user(self, login, hashed_password, description):
        try:
            logger.info(f"Creating user with login = {login}")
            if self.get_user(login) is not None:
                raise Exception(f"User with login {login} already exists")
            self.execute_query("""
                INSERT INTO users (login, hashed_password, description)
                VALUES (%s, %s, %s)
            """, (login, hashed_password, description), commit=True)
            logger.info(f"User {login} created successfully")
            return login
        except Exception as e:
            logger.error(f"Error creating user with login = {login}: {e}")
            raise