from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models

from schemas import UserCreate, UserLogin, TaskCreate, TaskUpdate
from auth import hash_password, verify_password, create_access_token
from dependencies import get_current_user

app = FastAPI(title="TUDO API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://todo-list-steel-pi-59.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {
        "message": "TUDO API is running"
    }


@app.get("/test-db")
def test_db():
    try:
        with engine.connect():
            return {
                "message": "PostgreSQL connected successfully"
            }
    except Exception as e:
        return {
            "error": str(e)
        }


# =========================
# REGISTER
# =========================

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # Check if email already exists
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = hash_password(user.password)

    # Create user
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }

# =========================
# LOGIN
# =========================

@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    # Find user by email
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    password_correct = verify_password(
        user.password,
        existing_user.password_hash
    )

    if not password_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create JWT
    access_token = create_access_token(
        existing_user.id
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email
        }
    }

# =========================
# CURRENT USER
# =========================

@app.get("/me")
def get_me(
    current_user: models.User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }

# =========================
# CREATE TASK
# =========================

@app.post("/tasks")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # Find assigned user by email
    assigned_user = (
        db.query(models.User)
        .filter(models.User.email == task.assigned_user)
        .first()
    )

    if not assigned_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned user not found"
        )

    # Create task
    new_task = models.Task(
        title=task.title,
        description=task.description,

        created_by_id=current_user.id,
        assigned_user_id=assigned_user.id,

        status=task.status,
        priority=task.priority,

        due_date=task.due_date,
        percentage=task.percentage
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return {
        "message": "Task created successfully",
        "task": {
            "id": new_task.id,
            "title": new_task.title,
            "description": new_task.description,

            "created_by_id": new_task.created_by_id,
            "assigned_user_id": new_task.assigned_user_id,

            "status": new_task.status,
            "priority": new_task.priority,

            "due_date": new_task.due_date,
            "percentage": new_task.percentage
        }
    }

# =========================
# GET ALL TASKS
# =========================

@app.get("/tasks")
def get_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    tasks = db.query(models.Task).all()

    result = []

    for task in tasks:

        creator = (
            db.query(models.User)
            .filter(models.User.id == task.created_by_id)
            .first()
        )

        assigned_user = (
            db.query(models.User)
            .filter(models.User.id == task.assigned_user_id)
            .first()
        )

        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,

            "created_by": {
                "id": creator.id,
                "name": creator.name,
                "email": creator.email
            } if creator else None,

            "assigned_user": {
                "id": assigned_user.id,
                "name": assigned_user.name,
                "email": assigned_user.email
            } if assigned_user else None,

            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "percentage": task.percentage,
            "created_at": task.created_at,
            "updated_at": task.updated_at
        })

    return {
        "tasks": result
    }

# =========================
# GET ALL USERS
# =========================

@app.get("/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    users = db.query(models.User).all()

    return {
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
            for user in users
        ]
    }


# =========================
# GET SINGLE TASK
# =========================

@app.get("/tasks/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "created_by_id": task.created_by_id,
        "assigned_user_id": task.assigned_user_id,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date,
        "percentage": task.percentage,
        "created_at": task.created_at,
        "updated_at": task.updated_at
    }

# =========================
# DELETE TASK
# =========================

@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }

# =========================
# UPDATE TASK
# =========================

@app.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    # Find task
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Check whether current user is creator
    is_creator = task.created_by_id == current_user.id

    # Check whether current user is assigned user
    is_assigned_user = task.assigned_user_id == current_user.id

    # =====================================
    # STATUS / PERCENTAGE
    # Only assigned user can update these
    # =====================================

    if task_data.status is not None:

        if not is_assigned_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned user can update task status"
            )

        allowed_statuses = [
            "To Do",
            "In Progress",
            "Completed"
        ]

        if task_data.status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status"
            )

        task.status = task_data.status

    if task_data.percentage is not None:

        if not is_assigned_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned user can update task percentage"
            )

        task.percentage = task_data.percentage

    # =====================================
    # TASK DETAILS
    # Only creator can update these
    # =====================================

    if task_data.title is not None:

        if not is_creator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the task creator can edit the task"
            )

        task.title = task_data.title

    if task_data.description is not None:

        if not is_creator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the task creator can edit the task"
            )

        task.description = task_data.description

    if task_data.assigned_user is not None:

        if not is_creator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the task creator can change assigned user"
            )

        # Find new assigned user
        assigned_user = (
            db.query(models.User)
            .filter(models.User.email == task_data.assigned_user)
            .first()
        )

        if not assigned_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )

        task.assigned_user_id = assigned_user.id

    if task_data.priority is not None:

        if not is_creator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the task creator can change priority"
            )

        allowed_priorities = [
            "Low",
            "Medium",
            "High"
        ]

        if task_data.priority not in allowed_priorities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid priority"
            )

        task.priority = task_data.priority

    if task_data.due_date is not None:

        if not is_creator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the task creator can change due date"
            )

        task.due_date = task_data.due_date

    # Update timestamp
    task.updated_at = datetime.now()

    db.commit()
    db.refresh(task)

    return {
        "message": "Task updated successfully",
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "created_by_id": task.created_by_id,
            "assigned_user_id": task.assigned_user_id,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "percentage": task.percentage,
            "created_at": task.created_at,
            "updated_at": task.updated_at
        }
    }