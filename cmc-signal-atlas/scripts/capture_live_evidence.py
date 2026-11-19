#!/usr/bin/env python3
"""Reproducible REAL source evidence; refuses to generate false evidence.
No API key is used or stored. This script runs on GitHub Actions runners.
"""
import datetime as dt
import hashlib
import json
import os
import pathlib
import time
import urllib.error
import urllib.request

BASE = "https://pro-api.coinmarketcap.com/public-api"
SOURCES = {
    "listings": "/v3/cryptocurrency/listings/latest?start=1&limit=100&convert=USD",
    "global": "/v1/global-metrics/quotes/latest?convert=USD",
    "sentiment": "/v3/fear-and-greed/latest",
}
APP_URL = os.environ.get("SIGNAL_ATLAS_URL", "https://signal-atlas-cmc-2026.vercel.app")
OUTPUT = pathlib.Path(__file__).resolve().parent.parent / "evidence" / "live-response.json"

def fetch(url, retries=4):
    last_error = None
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"Accept":"application/json","User-Agent":"SignalAtlas-Hackathon-Probe/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=22) as response:
                raw = response.read(1_500_000)
                status = response.status
                value = json.loads(raw)
            return status, value, hashlib.sha256(raw).hexdigest()
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
            last_error = str(exc)
            if isinstance(exc, urllib.error.HTTPError) and exc.code not in (429,500,502,503,504):
                break
            if attempt < retries-1:
                time.sleep(2 ** attempt)
    raise RuntimeError("Upstream failed after retries: " + url.split("?")[0] + " - " + str(last_error))

def sample(name,payload):
    data = payload.get("data")
    if name=="listings":
        if not isinstance(data,list) or not data:
            raise RuntimeError("Listings returned no array")
        records = []
        for asset in data[:2]:
            q=(asset.get("quote") or {}).get("USD") or {}
            records.append({"id":asset.get("id"),"symbol":asset.get("symbol"),"rank":asset.get("cmc_rank"),
                            "price":q.get("price"),"market_cap":q.get("market_cap"),"percent_change_24h":q.get("percent_change_24h"),
                            "last_updated":q.get("last_updated")})
        return {"sample_assets":records,"total_records":len(data)}
    if name=="global":
        q=((data or {}).get("quote") or {}).get("USD") or {}
        return {"btc_dominance":(data or {}).get("btc_dominance"),"total_market_cap":q.get("total_market_cap"),"total_volume_24h":q.get("total_volume_24h")}
    if name=="sentiment":
        return {"value":(data or {}).get("value"),"value_classification":(data or {}).get("value_classification"),"timestamp":(data or {}).get("timestamp")}
    return {"present":data is not None}

def main():
    now=dt.datetime.now(dt.timezone.utc).isoformat()
    evidence={"provenance":"Unmodified live CoinMarketCap Public API data sampled by GitHub Actions runner","retrieved_at_utc":now,
              "command":"python3 scripts/capture_live_evidence.py","mocked":False,"endpoints":[],"app":None}
    errors=[]
    for name, path in SOURCES.items():
        url=BASE+path
        try:
            http, data, digest=fetch(url)
            status=data.get("status") or {}
            if http != 200 or str(status.get("error_code", "")) not in ("0", "0.0"):
                raise RuntimeError(f"CMC status {http}, code {status.get('error_code')}")
            entry={"name":name,"request_method":"GET","request_url":url,
                   "http_status":http,"cmc_status":{k:status.get(k) for k in ("timestamp","error_code","credit_count")},
                   "response_sha256":digest,"response_excerpt":sample(name,data)}
            evidence["endpoints"].append(entry)
            print(f"CONFIRMED REAL CMC HTTP 200: {name} timestamp={status.get('timestamp')} sha256={digest[:12]}",flush=True)
        except Exception as exc:
            errors.append(str(exc))
            print("CMC request FAILED: "+str(exc),flush=True)
    # Application probe asserts the actual Vercel project is connected to CMC.
    try:
        http, app, digest=fetch(APP_URL+"/api/market?view=overview")
        if http!=200 or app.get("mode")!="live" or not app.get("evidence") or not app.get("coins"):
            raise RuntimeError(f"App response not LIVE (HTTP {http}, mode={app.get('mode')}, error={app.get('error')})")
        evidence["app"]={"url":APP_URL+"/api/market?view=overview","http_status":http,"mode":app.get("mode"),
                         "source":app.get("source"),"snapshot_at":app.get("at"),"asset_count":len(app.get("coins")),
                         "source_endpoints":[e.get("endpoint") for e in app.get("evidence",[])],
                         "response_sha256":digest}
        print(f"CONFIRMED LIVE APP HTTP 200 assets={len(app.get('coins'))} at {app.get('at')}",flush=True)
    except Exception as exc:
        evidence["app"]={"url":APP_URL+"/api/market?view=overview","http_status":"unverified","mode":"unverified","error":str(exc)}
        errors.append("App: "+str(exc))
        print("APP request FAILED: "+str(exc),flush=True)
    evidence["errors"]=errors
    evidence["verified_provider_calls"]=len(evidence["endpoints"])
    evidence["verified_app"]=evidence["app"].get("mode")=="live"
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(evidence,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("Evidence saved to "+str(OUTPUT),flush=True)
    if not evidence["endpoints"]:
        raise SystemExit("FAILED: No real CoinMarketCap API response was verified; no evidence can be claimed.")
    if not evidence["verified_app"]:
        raise SystemExit("FAILED: CoinMarketCap direct proof exists but deployed product is not yet verified LIVE.")
    print("PASS: Real CMC source and deployed live app independently confirmed.",flush=True)

if __name__=="__main__":
    main()
