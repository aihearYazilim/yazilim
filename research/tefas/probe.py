import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(proxy={"server": __import__('os').environ['HTTPS_PROXY']}, args=["--ignore-certificate-errors"])
        ctx = await b.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36", ignore_https_errors=True)
        pg = await ctx.new_page()
        pg.on("request", lambda r: print("REQ", r.method, r.url[:150], (r.post_data or "")[:200]) if r.resource_type in ("xhr","fetch","document") else None)
        await pg.goto(sys.argv[1], wait_until="networkidle", timeout=90000)
        await pg.wait_for_timeout(5000)
        print((await pg.content())[:3000])
        await b.close()
asyncio.run(main())
