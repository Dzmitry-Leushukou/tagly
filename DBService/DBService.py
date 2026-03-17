from asyncpg import connect
from models import User, Role

class DBService:
    def __init__(self, db_url: str):
        self.db_url = db_url

    async def get_db(self):
        return await asyncpg.connect(self.db_url)