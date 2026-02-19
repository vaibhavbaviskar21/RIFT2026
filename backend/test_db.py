import asyncio
from dotenv import load_dotenv
import os
from databases import Database

load_dotenv()

async def test():
    url = os.getenv("DATABASE_URL")
    print(f"Connecting to: {url[:40]}...")
    try:
        db = Database(url)
        await db.connect()
        print("SUCCESS: Database connected!")
        await db.disconnect()
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
