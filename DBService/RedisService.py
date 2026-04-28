import redis
import os
import logging
import json


logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.host = os.getenv('REDIS_HOST')
        self.port = int(os.getenv('REDIS_PORT', '6379'))
        self.db = int(os.getenv('REDIS_DB','0'))
        self.redis_pool = None
        self.redis = None
        try:
            self.redis_pool = redis.ConnectionPool(
                host=self.host,
                port=self.port,
                db=self.db,
                decode_responses=True,
                socket_keepalive=True
                )
            self.redis = redis.Redis(connection_pool=self.redis_pool)
            self.redis.ping()
            logger.info("Connected to Redis successfully!")
        except Exception as e:
            logger.error("Failed to connect to Redis: %s", str(e))
            raise

    def close(self):
        try:
            self.redis_pool.disconnect()
            logger.info("Redis connection pool closed successfully!")
        except Exception as e:
            logger.error("Failed to close Redis connection pool: %s", str(e))

    def set(self, key, value):
        self.redis.set(key, json.dumps(value))

    def get(self, key):
        value = self.redis.get(key)
        return json.loads(value) if value else None

    def delete(self, key):
        try:
            deleted = self.redis.delete(key)
            logger.info(f"Deleted key {key} from Redis (deleted: {deleted})")
        except Exception as e:
            logger.error(f"Failed to delete key {key} from Redis: {e}")
            raise