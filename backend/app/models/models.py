from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    display_name = Column(String(100))
    avatar_url = Column(String(500))
    role = Column(String(20), default="user")  # user, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CourseNode(Base):
    __tablename__ = "course_nodes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    summary = Column(Text)
    difficulty = Column(String(20))  # beginner, intermediate, advanced
    category = Column(String(50))  # cs_core, programming, ai_ml, communication, math, etc.
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    edges_from = relationship("CourseEdge", foreign_keys="CourseEdge.source_node_id", back_populates="source_node")
    edges_to = relationship("CourseEdge", foreign_keys="CourseEdge.target_node_id", back_populates="target_node")
    resource_mappings = relationship("ResourceCourseMapping", back_populates="course_node")


class CourseEdge(Base):
    __tablename__ = "course_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_node_id = Column(Integer, ForeignKey("course_nodes.id"), nullable=False, index=True)
    target_node_id = Column(Integer, ForeignKey("course_nodes.id"), nullable=False, index=True)
    relation_type = Column(String(30), default="prerequisite")  # prerequisite, corequisite, recommended
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source_node = relationship("CourseNode", foreign_keys=[source_node_id], back_populates="edges_from")
    target_node = relationship("CourseNode", foreign_keys=[target_node_id], back_populates="edges_to")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    url = Column(Text)
    resource_type = Column(String(30))  # video, article, book, course, lab, tool
    source = Column(String(100))
    summary = Column(Text)
    difficulty = Column(String(20))
    status = Column(String(20), default="pending")  # pending, approved, rejected
    submitted_by = Column(String(100))
    reviewed_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    resource_mappings = relationship("ResourceCourseMapping", back_populates="resource")


class ResourceCourseMapping(Base):
    __tablename__ = "resource_course_mappings"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False, index=True)
    course_node_id = Column(Integer, ForeignKey("course_nodes.id"), nullable=False, index=True)

    resource = relationship("Resource", back_populates="resource_mappings")
    course_node = relationship("CourseNode", back_populates="resource_mappings")


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_goal = Column(Text, nullable=False)
    mastered_slugs = Column(JSON, default=[])
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReviewLog(Base):
    __tablename__ = "review_logs"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False, index=True)
    reviewer = Column(String(100), nullable=False)
    action = Column(String(20), nullable=False)  # approve, reject
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
