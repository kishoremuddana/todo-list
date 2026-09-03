from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


class UserCreate(BaseModel):

    name: str

    email: EmailStr

    password: str

    confirm_password: str

    @model_validator(mode="after")
    def check_passwords(self):

        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")

        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str



class TaskCreate(BaseModel):

    title: str
    description: Optional[str] = None
    assigned_user: EmailStr

    status: str = "To Do"
    priority: str = "Medium"

    due_date: Optional[datetime] = None

    percentage: int = Field(
        default=0,
        ge=0,
        le=100
    )


class TaskUpdate(BaseModel):

    title: Optional[str] = None
    description: Optional[str] = None
    assigned_user: Optional[EmailStr] = None

    status: Optional[str] = None
    priority: Optional[str] = None

    due_date: Optional[datetime] = None

    percentage: Optional[int] = Field(
        default=None,
        ge=0,
        le=100
    )