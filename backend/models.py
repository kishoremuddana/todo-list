from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # Tasks created by this user
    created_tasks = relationship(
        "Task",
        foreign_keys="Task.created_by_id",
        back_populates="creator"
    )

    # Tasks assigned to this user
    assigned_tasks = relationship(
        "Task",
        foreign_keys="Task.assigned_user_id",
        back_populates="assigned_user"
    )

    # Comments written by this user
    comments = relationship(
        "Comment",
        back_populates="user"
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)

    description = Column(Text, nullable=True)

    created_by_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    assigned_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    status = Column(
        String(20),
        default="To Do",
        nullable=False
    )

    priority = Column(
        String(20),
        default="Medium",
        nullable=False
    )

    due_date = Column(DateTime, nullable=True)

    percentage = Column(
        Integer,
        default=0,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Creator
    creator = relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_tasks"
    )

    # Assigned user
    assigned_user = relationship(
        "User",
        foreign_keys=[assigned_user_id],
        back_populates="assigned_tasks"
    )

    # Comments
    comments = relationship(
        "Comment",
        back_populates="task",
        cascade="all, delete-orphan"
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(
        Integer,
        ForeignKey("tasks.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    comment = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    task = relationship(
        "Task",
        back_populates="comments"
    )

    user = relationship(
        "User",
        back_populates="comments"
    )