"""
Market data utility — yfinance + Finnhub.
"""
import asyncio
from typing import Optional, Dict, Any, List
from app.core.config import settings


async def get_quote(symbol: str) -> Dict[str, Any]:
    """Fetch current quote for symbol (NSE/BSE). Returns price, change, change_pct."""
    loop = asyncio.get_event_loop()

    def _fetch():
        import yfinance as yf
        # Append .NS for NSE, .BO for BSE
        ticker = yf.Ticker(f"{symbol}.NS")
        info = ticker.fast_info
        hist = ticker.history(period="2d")
        if hist.empty:
            return {"price": 0.0, "change": 0.0, "change_pct": 0.0, "symbol": symbol}
        current = float(hist["Close"].iloc[-1])
        prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
        change = current - prev
        change_pct = (change / prev * 100) if prev else 0.0
        return {
            "symbol": symbol,
            "price": round(current, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "volume": int(hist["Volume"].iloc[-1]),
        }

    try:
        return await loop.run_in_executor(None, _fetch)
    except Exception as e:
        return {"symbol": symbol, "price": 0.0, "change": 0.0, "change_pct": 0.0, "error": str(e)}


async def get_financials(symbol: str) -> Dict[str, Any]:
    """Fetch financials from yfinance."""
    loop = asyncio.get_event_loop()

    def _fetch():
        import yfinance as yf
        ticker = yf.Ticker(f"{symbol}.NS")
        info = ticker.info or {}
        return {
            "market_cap": info.get("marketCap", 0),
            "pe_ratio": info.get("trailingPE", 0),
            "pb_ratio": info.get("priceToBook", 0),
            "debt_equity": info.get("debtToEquity", 0),
            "roe": info.get("returnOnEquity", 0),
            "roce": info.get("returnOnAssets", 0),
            "current_ratio": info.get("currentRatio", 0),
            "revenue": info.get("totalRevenue", 0),
            "net_income": info.get("netIncomeToCommon", 0),
            "ebitda": info.get("ebitda", 0),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "description": info.get("longBusinessSummary", ""),
            "name": info.get("longName", symbol),
            "beta": info.get("beta", 1.0),
            "52w_high": info.get("fiftyTwoWeekHigh", 0),
            "52w_low": info.get("fiftyTwoWeekLow", 0),
        }

    try:
        return await loop.run_in_executor(None, _fetch)
    except Exception:
        return {}


async def get_historical_prices(symbol: str, period: str = "1y") -> List[Dict[str, Any]]:
    """Get OHLCV historical data."""
    loop = asyncio.get_event_loop()

    def _fetch():
        import yfinance as yf
        ticker = yf.Ticker(f"{symbol}.NS")
        hist = ticker.history(period=period)
        result = []
        for date, row in hist.iterrows():
            result.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return result

    try:
        return await loop.run_in_executor(None, _fetch)
    except Exception:
        return []


async def get_macro_data() -> Dict[str, Any]:
    """Fetch macro indicators: NIFTY50, SENSEX, INR/USD, Crude Oil."""
    loop = asyncio.get_event_loop()

    def _fetch():
        import yfinance as yf
        symbols = {
            "nifty50": "^NSEI",
            "sensex": "^BSESN",
            "inr_usd": "INR=X",
            "crude_oil": "CL=F",
            "us10y": "^TNX",
        }
        result = {}
        for key, ticker_sym in symbols.items():
            try:
                t = yf.Ticker(ticker_sym)
                hist = t.history(period="2d")
                if not hist.empty:
                    current = float(hist["Close"].iloc[-1])
                    prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
                    change_pct = ((current - prev) / prev * 100) if prev else 0.0
                    result[key] = {"value": round(current, 2), "change_pct": round(change_pct, 2)}
                else:
                    result[key] = {"value": 0.0, "change_pct": 0.0}
            except Exception:
                result[key] = {"value": 0.0, "change_pct": 0.0}
        return result

    try:
        return await loop.run_in_executor(None, _fetch)
    except Exception:
        return {}


async def get_peer_financials(symbols: List[str]) -> List[Dict[str, Any]]:
    """Fetch key financials for multiple symbols (peer comparison)."""
    tasks = [get_financials(sym) for sym in symbols]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    out = []
    for sym, res in zip(symbols, results):
        if isinstance(res, Exception):
            out.append({"symbol": sym})
        else:
            out.append({"symbol": sym, **res})
    return out
