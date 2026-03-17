from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from .database import Base
from sqlalchemy import LargeBinary, Boolean
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True)
    password = Column(String(128))
    roleId = Column(Integer, ForeignKey('roles.id'))
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    profileImage=Column(LargeBinary, nullable=True)

    role=relationship('Role', backref='users')

class Role(Base):
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True)
    name = Column(String(80), unique=True)
    canDeletePost = Column(Boolean, default=False)
    canDeleteUser = Column(Boolean, default=False)