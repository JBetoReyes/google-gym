"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-02-18

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("plan", sa.String(20), nullable=False, server_default="free"),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "routines",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("exercises", postgresql.ARRAY(sa.String()), nullable=False,
                  server_default="{}"),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_routines_user_id", "routines", ["user_id"])

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("routine_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("routine_name", sa.String(255), nullable=False),
        sa.Column("started_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("finished_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("logs", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["routine_id"], ["routines.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])

    op.create_table(
        "custom_exercises",
        sa.Column("id", sa.String(100), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("muscle", sa.String(50), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_custom_exercises_user_id", "custom_exercises", ["user_id"])

    op.create_table(
        "user_preferences",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("weekly_goal", sa.Integer(), nullable=False, server_default="4"),
        sa.Column("lang", sa.String(5), nullable=False, server_default="es"),
        sa.Column("rest_timer_default", sa.Integer(), nullable=False, server_default="90"),
        sa.Column("theme", sa.String(50), nullable=False, server_default="dark"),
        sa.Column("exercise_buttons", postgresql.JSONB(), nullable=False,
                  server_default='{"routineForm":{"video":true,"image":false,"anatomy":false},'
                                 '"workoutView":{"video":true,"image":false,"anatomy":false}}'),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "app_config",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", postgresql.JSONB(), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )

    # Seed default config values
    op.execute(
        "INSERT INTO app_config (key, value) VALUES "
        "('ad_frequency', '{\"clicks_between_ads\": 5}'), "
        "('free_routine_limit', '{\"max_routines\": 3}'), "
        "('free_stats_limit', '{\"basic_only\": true}')"
    )

    # Row Level Security
    for table in ["routines", "sessions", "custom_exercises", "user_preferences"]:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(
            f"CREATE POLICY own_{table} ON {table} "
            f"FOR ALL USING (auth.uid() = user_id)"
        )


def downgrade() -> None:
    for table in ["routines", "sessions", "custom_exercises", "user_preferences"]:
        op.execute(f"DROP POLICY IF EXISTS own_{table} ON {table}")

    op.drop_table("app_config")
    op.drop_table("user_preferences")
    op.drop_index("ix_custom_exercises_user_id", "custom_exercises")
    op.drop_table("custom_exercises")
    op.drop_index("ix_sessions_user_id", "sessions")
    op.drop_table("sessions")
    op.drop_index("ix_routines_user_id", "routines")
    op.drop_table("routines")
    op.drop_table("profiles")
