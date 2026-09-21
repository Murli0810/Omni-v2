from app.core.ws_manager import manager

async def dispatch_event(event_out: dict):
    if event_out.get("priority")=="critical":
        await manager.broadcast(event_out)
    