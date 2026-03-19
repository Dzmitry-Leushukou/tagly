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
            cursor = conn.cursor()
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