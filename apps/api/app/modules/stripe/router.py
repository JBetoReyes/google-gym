"""
Stripe webhook handler.
Listens for subscription events and updates profile.plan accordingly.
"""
import stripe
from fastapi import APIRouter, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.config import settings
from app.database import get_db
from app.models.profile import Profile

router = APIRouter(prefix="/stripe", tags=["stripe"])

stripe.api_key = settings.stripe_secret_key


@router.post("/webhook", status_code=200)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if event["type"] == "customer.subscription.created":
        sub = event["data"]["object"]
        customer_id: str = sub["customer"]
        await _set_plan(db, customer_id, "premium")

    elif event["type"] in (
        "customer.subscription.deleted",
        "customer.subscription.paused",
    ):
        sub = event["data"]["object"]
        customer_id = sub["customer"]
        await _set_plan(db, customer_id, "free")

    elif event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_id = session.get("customer", "")
        user_id: str = session.get("client_reference_id", "")
        if user_id and customer_id:
            result = await db.execute(select(Profile).where(Profile.id == user_id))
            profile = result.scalar_one_or_none()
            if profile:
                profile.stripe_customer_id = customer_id
                await db.commit()

    return {"received": True}


async def _set_plan(db: AsyncSession, customer_id: str, plan: str) -> None:
    result = await db.execute(
        select(Profile).where(Profile.stripe_customer_id == customer_id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile.plan = plan
        await db.commit()
