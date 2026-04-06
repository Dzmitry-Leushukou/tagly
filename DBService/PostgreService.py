import json
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
        logger.info("Initializing database tables...")
        
        try:
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    login VARCHAR(255) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    description TEXT
                )
            """, commit=True)
            logger.info("Table 'users' created or already exists")
        except Exception as e:
            logger.error(f"Error creating table 'users': {e}")
            raise

        try:
            self.execute_query("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS preference_vector JSONB DEFAULT '{}'
            """, commit=True)
            logger.info("Column 'preference_vector' added to users")
        except Exception as e:
            logger.error(f"Error adding preference_vector: {e}")
            raise

        try:
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS posts (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    author_id INT REFERENCES users(id) ON DELETE CASCADE
                )
            """, commit=True)
            logger.info("Table 'posts' created or already exists")
        except Exception as e:
            logger.error(f"Error creating table 'posts': {e}")
            raise

        try:
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS tags (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL
                )
            """, commit=True)
            logger.info("Table 'tags' created or already exists")
        except Exception as e:
            logger.error(f"Error creating table 'tags': {e}")
            raise

        try:
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS post_tags (
                    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
                    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
                    PRIMARY KEY (post_id, tag_id)
                )
            """, commit=True)
            logger.info("Table 'post_tags' created or already exists")
        except Exception as e:
            logger.error(f"Error creating table 'post_tags': {e}")
            raise

        try:
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS user_feedback (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
                    feedback_type VARCHAR(10) CHECK (feedback_type IN ('like', 'dislike')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (user_id, post_id)
                )
            """, commit=True)
            logger.info("Table 'user_feedback' created or already exists")
        except Exception as e:
            logger.error(f"Error creating table 'user_feedback': {e}")
            raise

        try:
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS shown_posts (
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
                    batch_number INT,
                    shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, post_id)
                )
            """, commit=True)
            logger.info("Table 'shown_posts' created or already exists")
        except Exception as e:
            logger.error(f"Error creating table 'shown_posts': {e}")
            raise

        logger.info("All tables initialized successfully")
    

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

    def create_post(self, content: str, author_id: int) -> dict:
        try:
            logger.info(f"Creating post for author_id={author_id}")
            result = self.execute_query("""
                INSERT INTO posts (content, author_id)
                VALUES (%s, %s)
                RETURNING id, content, created_at, author_id
            """, (content, author_id), fetch_one=True, commit=True)
            logger.info(f"Post created with id={result['id']}")
            return dict(result)
        except Exception as e:
            logger.error(f"Error creating post: {e}")
            raise

    def get_tag_by_name(self, name: str) -> dict | None:
        try:
            result = self.execute_query("""
                SELECT id, name FROM tags WHERE name = %s LIMIT 1
            """, (name,), fetch_one=True)
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error getting tag by name: {e}")
            return None

    def create_tag(self, name: str) -> int:
        try:
            logger.info(f"Creating tag with name={name}")
            result = self.execute_query("""
                INSERT INTO tags (name)
                VALUES (%s)
                RETURNING id
            """, (name,), fetch_one=True, commit=True)
            logger.info(f"Tag created with id={result['id']}")
            return result['id']
        except Exception as e:
            logger.error(f"Error creating tag: {e}")
            raise

    def add_post_tag(self, post_id: int, tag_id: int) -> None:
        try:
            logger.info(f"Linking post_id={post_id} with tag_id={tag_id}")
            self.execute_query("""
                INSERT INTO post_tags (post_id, tag_id)
                VALUES (%s, %s)
            """, (post_id, tag_id), commit=True)
            logger.info(f"Post-tag link created")
        except Exception as e:
            logger.error(f"Error creating post_tag link: {e}")
            raise

    def get_all_posts_with_tags(self) -> list:
        try:
            posts = self.execute_query("""
                SELECT p.id, p.content, p.created_at, p.author_id, u.login as author_login
                FROM posts p
                JOIN users u ON p.author_id = u.id
                ORDER BY p.created_at DESC
            """, fetch_all=True)
            
            result = []
            for post in posts:
                tags = self.execute_query("""
                    SELECT t.id, t.name
                    FROM tags t
                    JOIN post_tags pt ON t.id = pt.tag_id
                    WHERE pt.post_id = %s
                """, (post["id"],), fetch_all=True)
                
                post_dict = dict(post)
                post_dict["tags"] = [dict(tag) for tag in tags] if tags else []
                result.append(post_dict)
            
            logger.info(f"Retrieved {len(result)} posts with tags")
            return result
        except Exception as e:
            logger.error(f"Error getting all posts with tags: {e}")
            raise

    def get_post_tags(self, post_id: int) -> list:
        try:
            tags = self.execute_query("""
                SELECT t.id, t.name
                FROM tags t
                JOIN post_tags pt ON t.id = pt.tag_id
                WHERE pt.post_id = %s
            """, (post_id,), fetch_all=True)
            return [dict(tag) for tag in tags] if tags else []
        except Exception as e:
            logger.error(f"Error getting post tags: {e}")
            raise

    def add_shown_post(self, user_id: int, post_id: int, batch_number: int) -> None:
        try:
            self.execute_query("""
                INSERT INTO shown_posts (user_id, post_id, batch_number)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id, post_id) DO UPDATE SET batch_number = %s
            """, (user_id, post_id, batch_number, batch_number), commit=True)
            logger.info(f"Recorded shown post: user_id={user_id}, post_id={post_id}, batch={batch_number}")
        except Exception as e:
            logger.error(f"Error adding shown post: {e}")
            raise

    def get_shown_posts_batch_numbers(self, user_id: int) -> dict:
        try:
            shown = self.execute_query("""
                SELECT post_id, batch_number
                FROM shown_posts
                WHERE user_id = %s
            """, (user_id,), fetch_all=True)
            return {row["post_id"]: row["batch_number"] for row in shown} if shown else {}
        except Exception as e:
            logger.error(f"Error getting shown posts: {e}")
            raise

    def update_user_preference_vector(self, login: str, preference_vector: dict) -> None:
        try:
            self.execute_query("""
                UPDATE users
                SET preference_vector = %s::jsonb
                WHERE login = %s
            """, (json.dumps(preference_vector), login), commit=True)
            logger.info(f"Updated preference_vector for user {login}")
        except Exception as e:
            logger.error(f"Error updating preference_vector: {e}")
            raise

    def add_user_feedback(self, user_id: int, post_id: int, feedback_type: str) -> None:
        try:
            self.execute_query("""
                INSERT INTO user_feedback (user_id, post_id, feedback_type)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id, post_id) DO UPDATE SET feedback_type = %s, created_at = CURRENT_TIMESTAMP
            """, (user_id, post_id, feedback_type, feedback_type), commit=True)
            logger.info(f"Recorded feedback: user_id={user_id}, post_id={post_id}, type={feedback_type}")
        except Exception as e:
            logger.error(f"Error adding user feedback: {e}")
            raise

    def get_user_feedback(self, user_id: int, post_id: int) -> dict | None:
        try:
            feedback = self.execute_query("""
                SELECT id, user_id, post_id, feedback_type, created_at
                FROM user_feedback
                WHERE user_id = %s AND post_id = %s
            """, (user_id, post_id), fetch_one=True)
            return dict(feedback) if feedback else None
        except Exception as e:
            logger.error(f"Error getting user feedback: {e}")
            raise

    def get_max_batch_number(self, user_id: int) -> int:
        try:
            result = self.execute_query("""
                SELECT MAX(batch_number) as max_batch
                FROM shown_posts
                WHERE user_id = %s
            """, (user_id,), fetch_one=True)
            return result["max_batch"] if result and result["max_batch"] is not None else 0
        except Exception as e:
            logger.error(f"Error getting max batch number: {e}")
            return 0

    def get_user_shown_posts(self, user_id: int) -> dict:
        try:
            shown = self.execute_query("""
                SELECT post_id, batch_number
                FROM shown_posts
                WHERE user_id = %s
            """, (user_id,), fetch_all=True)
            return {row["post_id"]: row["batch_number"] for row in shown} if shown else {}
        except Exception as e:
            logger.error(f"Error getting user shown posts: {e}")
            return {}

    def get_all_tags(self, limit: int = 50, offset: int = 0) -> list:
        try:
            tags = self.execute_query("""
                SELECT DISTINCT t.id, t.name
                FROM tags t
                INNER JOIN post_tags pt ON t.id = pt.tag_id
                ORDER BY t.name
                LIMIT %s OFFSET %s
            """, (limit, offset), fetch_all=True)
            return [dict(tag) for tag in tags] if tags else []
        except Exception as e:
            logger.error(f"Error getting all tags: {e}")
            raise

    def get_user_posts_with_tags(self, author_id: int, limit: int = 20, offset: int = 0) -> tuple[list, int]:
        """Get posts by author with tags, sorted by created_at DESC (newest first).
        Returns tuple of (posts_list, total_count)"""
        try:
            # Get total count
            count_result = self.execute_query("""
                SELECT COUNT(*) as total
                FROM posts
                WHERE author_id = %s
            """, (author_id,), fetch_one=True)
            total_count = count_result["total"] if count_result else 0

            # Get posts with pagination
            posts = self.execute_query("""
                SELECT p.id, p.content, p.created_at, p.author_id, u.login as author_login
                FROM posts p
                JOIN users u ON p.author_id = u.id
                WHERE p.author_id = %s
                ORDER BY p.created_at DESC
                LIMIT %s OFFSET %s
            """, (author_id, limit, offset), fetch_all=True)

            result = []
            for post in posts:
                tags = self.execute_query("""
                    SELECT t.id, t.name
                    FROM tags t
                    JOIN post_tags pt ON t.id = pt.tag_id
                    WHERE pt.post_id = %s
                """, (post["id"],), fetch_all=True)

                post_dict = dict(post)
                post_dict["tags"] = [dict(tag) for tag in tags] if tags else []
                result.append(post_dict)

            logger.info(f"Retrieved {len(result)} posts for author_id={author_id} (total={total_count})")
            return result, total_count
        except Exception as e:
            logger.error(f"Error getting user posts with tags: {e}")
            raise