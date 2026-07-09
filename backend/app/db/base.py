# Import all models so that SQLAlchemy declarative base (Base) can register them
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.watchlist import Watchlist, WatchlistItem  # noqa
from app.models.trade import Trade  # noqa
