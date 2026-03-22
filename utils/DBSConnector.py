import os
import aiohttp
import asyncio

async def call_DBService(data, endpoint_address, method, tries=6, interval=5):
    url_base = os.getenv('DBService_Address')
    if not url_base:
        raise ValueError("DBService_Address environment variable is not set")
    
    url = f"{url_base}/{endpoint_address.lstrip('/')}"
    timeout = aiohttp.ClientTimeout(total=5.0)

    for attempt in range(1, tries + 1):
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                if method.upper() == "GET":
                    async with session.get(url, headers={"Content-Type": "application/json"}) as response:
                        response.raise_for_status()
                        return await response.json()
                elif method.upper() == "POST":
                    async with session.post(url, json=data, headers={"Content-Type": "application/json"}) as response:
                        response.raise_for_status()
                        return await response.json()
                elif method.upper() == "PUT":
                    async with session.put(url, json=data, headers={"Content-Type": "application/json"}) as response:
                        response.raise_for_status()
                        return await response.json()
                elif method.upper() == "DELETE":
                    async with session.delete(url, headers={"Content-Type": "application/json"}) as response:
                        response.raise_for_status()
                        return await response.json()
                else:
                    raise ValueError(f"Unsupported method: {method}")
        except aiohttp.ClientError as e:
            if attempt == tries:
                raise Exception(f"Service call failed after {tries} attempts: {e}")
            await asyncio.sleep(interval)