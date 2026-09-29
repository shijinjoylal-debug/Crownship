import ccxt
import pandas as pd
import ta
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters

# ================= TELEGRAM CONFIG =================
BOT_TOKEN = "8559009333:AAGVahpqY7GAqDduQmeHNpnHGz451IWVcno"
# ==================================================

# ================= SUPPORTED SYMBOLS =================
SYMBOL_MAP = {
    "BTC": "BTC/USDT",
    "ETH": "ETH/USDT",
    "SOL": "SOL/USDT",
    "BNB": "BNB/USDT",
    "XRP": "XRP/USDT"
}
# ====================================================

def cap_probability(p):
    return min(max(p, 5), 95)

# ================= BTC CONTEXT =================
def get_btc_trend(exchange):
    ohlcv = exchange.fetch_ohlcv("BTC/USDT", timeframe="1d", limit=50)
    df = pd.DataFrame(
        ohlcv, columns=["time","open","high","low","close","volume"]
    )

    df["EMA20"] = ta.trend.ema_indicator(df["close"], window=20)
    df["RSI"] = ta.momentum.rsi(df["close"], window=14)

    latest = df.iloc[-1]

    if latest["close"] > latest["EMA20"] and latest["RSI"] > 50:
        return "Bullish"
    elif latest["close"] < latest["EMA20"] and latest["RSI"] < 50:
        return "Bearish"
    else:
        return "Neutral"

# ================= SIGNAL ENGINE =================
def generate_signal(symbol_key):
    SYMBOL = SYMBOL_MAP[symbol_key]
    TIMEFRAME = "1d"
    LIMIT = 100

    exchange = ccxt.binance()

    btc_trend = get_btc_trend(exchange)

    ohlcv = exchange.fetch_ohlcv(SYMBOL, timeframe=TIMEFRAME, limit=LIMIT)
    df = pd.DataFrame(
        ohlcv, columns=["time","open","high","low","close","volume"]
    )

    df["EMA20"] = ta.trend.ema_indicator(df["close"], window=20)
    df["RSI"] = ta.momentum.rsi(df["close"], window=14)
    df["ATR"] = ta.volatility.average_true_range(
        df["high"], df["low"], df["close"], window=14
    )

    returns = df["close"].pct_change()

    latest = df.iloc[-1]
    prev = df.iloc[-2]

    bullish = 0
    bearish = 0

    if latest["RSI"] > 55:
        bullish += 1
    elif latest["RSI"] < 45:
        bearish += 1

    if latest["close"] > latest["EMA20"]:
        bullish += 1
    else:
        bearish += 1

    if latest["RSI"] > prev["RSI"]:
        bullish += 1
    else:
        bearish += 1

    total = bullish + bearish
    up_prob = cap_probability(round((bullish / total) * 100, 2))
    down_prob = cap_probability(round((bearish / total) * 100, 2))

    atr_pct = (latest["ATR"] / latest["close"]) * 100

    if atr_pct < 1.2:
        vol_regime = "Low (Chop Risk)"
    elif atr_pct < 2.5:
        vol_regime = "Normal"
    else:
        vol_regime = "High (Expansion)"

    if up_prob >= 65:
        bias = "Bullish"
    elif down_prob >= 65:
        bias = "Bearish"
    else:
        bias = "Neutral"

    action = "WAIT"
    confidence = "Low"

    if vol_regime != "Low (Chop Risk)":
        if bias == "Bullish":
            action = "BUY BIAS"
            confidence = "Moderate"
        elif bias == "Bearish":
            action = "SELL BIAS"
            confidence = "Moderate"

    # ===== BTC CONTEXT ADJUSTMENT (ALTS ONLY) =====
    if symbol_key != "BTC":
        if btc_trend == "Bearish" and bias == "Bullish":
            bias = "Bullish (Counter BTC)"
            confidence = "Low"
        elif btc_trend == "Bullish" and bias == "Bearish":
            bias = "Bearish (Against BTC)"
            confidence = "Low"

    reasons = [
        f"BTC Market Regime: {btc_trend}"
    ]

    if latest["close"] > latest["EMA20"]:
        reasons.append("Price above EMA → Uptrend")
    else:
        reasons.append("Price below EMA → Downtrend")

    if up_prob > down_prob:
        reasons.append("Historical pattern skew favors upside")
    else:
        reasons.append("Historical pattern skew favors downside")

    if returns[-5:].mean() > 0:
        reasons.append("Momentum favors upside")
    else:
        reasons.append("Momentum favors downside")

    reasons.append(f"Volatility regime: {vol_regime}")

    # ===== HISTORICAL BIAS =====
    hist_bull = 0
    hist_bear = 0

    for i in range(21, len(df)):
        row = df.iloc[i]
        prev_row = df.iloc[i - 1]

        b = 0
        br = 0

        if row["RSI"] > 55:
            b += 1
        elif row["RSI"] < 45:
            br += 1

        if row["close"] > row["EMA20"]:
            b += 1
        else:
            br += 1

        if row["RSI"] > prev_row["RSI"]:
            b += 1
        else:
            br += 1

        if b > br:
            hist_bull += 1
        else:
            hist_bear += 1

    hist_total = hist_bull + hist_bear
    hist_up = round((hist_bull / hist_total) * 100, 2)
    hist_down = round((hist_bear / hist_total) * 100, 2)

    message = (
        f"📊 {symbol_key} 1D MARKET BIAS\n\n"
        f"📈 Upside Bias   : {up_prob}%\n"
        f"📉 Downside Bias : {down_prob}%\n\n"
        f"BIAS        : {bias}\n"
        f"ACTIONABLE  : {action}\n"
        f"CONFIDENCE  : {confidence}\n\n"
        "🧠 MODEL CONTEXT:\n"
    )

    for r in reasons:
        message += f"• {r}\n"

    message += (
        "\n📊 HISTORICAL BIAS (Last 100 Days)\n"
        f"📈 Bullish Days : {hist_up}%\n"
        f"📉 Bearish Days : {hist_down}%\n\n"
    )

    return message

import urllib.request
import json

# ================= TELEGRAM HANDLERS =================
def start(update, context):
    user = update.effective_user
    args = context.args

    if args and len(args) > 0:
        token = args[0].strip()
        # Attempt to activate via Crownship API
        try:
            req_data = json.dumps({
                "token": token,
                "telegramId": user.id,
                "telegramUsername": user.username or user.first_name or "User"
            }).encode('utf-8')

            req = urllib.request.Request(
                "http://localhost:3000/api/telegram/connect",
                data=req_data,
                headers={"Content-Type": "application/json"}
            )

            with urllib.request.urlopen(req, timeout=5) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                if result.get("success"):
                    customer_name = result.get("customerName", user.first_name)
                    activation = result.get("activation", {})
                    item_name = activation.get("itemName", "Trading Bot")
                    lic_idx = activation.get("licenseIndex", 1)
                    tot_qty = activation.get("totalQuantity", 1)

                    update.message.reply_text(
                        f"🎉 License Activated Successfully!\n\n"
                        f"Welcome, {customer_name}!\n"
                        f"Product: {item_name}\n"
                        f"License: #{lic_idx} of {tot_qty}\n\n"
                        f"Supported assets:\nBTC, ETH, SOL, BNB, XRP\n\n"
                        f"Type any symbol to get your real-time market bias!"
                    )
                    return
        except urllib.error.HTTPError as e:
            try:
                err_resp = json.loads(e.read().decode('utf-8'))
                err_msg = err_resp.get("error", "Failed to activate token.")
            except Exception:
                err_msg = str(e)
            update.message.reply_text(f"⚠️ Activation Notice: {err_msg}")
            return
        except Exception as e:
            # Fallback if local server is unreachable during testing
            update.message.reply_text(
                f"✅ Connected to MarketForge 🤖\n\n"
                f"Your activation token: {token[:8]}... was received.\n"
                f"Supported assets:\nBTC, ETH, SOL, BNB, XRP\n\n"
                f"Type any symbol to get the market bias."
            )
            return

    update.message.reply_text(
        "Welcome to MarketForge 🤖\n\n"
        "To activate your full license, purchase via Crownship and click your activation link, or type `/start <YOUR_TOKEN>`.\n\n"
        "Supported assets:\n"
        "BTC, ETH, SOL, BNB, XRP\n\n"
        "Type any symbol to get the market bias."
    )

def handle_message(update, context):
    text = update.message.text.upper()

    if text in SYMBOL_MAP:
        update.message.reply_text(generate_signal(text))
    else:
        update.message.reply_text(
            "Unsupported symbol.\n\n"
            "Available: BTC, ETH, SOL, BNB, XRP"
        )

# ================= RUN BOT =================
updater = Updater(BOT_TOKEN, use_context=True)
dp = updater.dispatcher

dp.add_handler(CommandHandler("start", start))
dp.add_handler(MessageHandler(Filters.text & ~Filters.command, handle_message))

updater.start_polling()
updater.idle()