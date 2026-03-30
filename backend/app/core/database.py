import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _make_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=False,
        )
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False,
    )


def _resolve_engine():
    primary_url = settings.DATABASE_URL
    fallback_url = settings.DATABASE_URL_FALLBACK

    try:
        engine = _make_engine(primary_url)
        with engine.connect():
            logger.info("Database connected: %s", primary_url.split("@")[-1] if "@" in primary_url else primary_url)
        return engine
    except Exception as exc:
        logger.warning("Primary DB failed (%s), trying fallback.", exc)
        if fallback_url:
            engine = _make_engine(fallback_url)
            with engine.connect():
                logger.info("Fallback DB connected.")
            return engine
        raise


engine = _resolve_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
    logger.info("All tables created / verified.")
