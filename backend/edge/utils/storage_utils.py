from supabase import Client, create_client
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL= os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY= os.environ["SUPSBASE_SERVICE_ROLE_KEY"]
BUCKET_NAME= "evidence"

supabase: Client= create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def upload_snapshot(image_bytes: bytes, event_type: str) -> str:
    filename= f"{event_type}/{uuid.uuid4().hex}.jpg"

    supabase.storage.from_(BUCKET_NAME).upload(
        path=filename,
        file=image_bytes,
        file_options={"content-type": "image/jpeg"},
    )

    public_url= supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
    return public_url

