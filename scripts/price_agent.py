#!/usr/bin/env python3
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "prices.json"
SOURCES_FILE = ROOT / "config" / "sources.json"

START_DATE = datetime(2026, 3, 9, tzinfo=ZoneInfo("America/Manaus")).date()
END_DATE = datetime(2026, 3, 31, tzinfo=ZoneInfo("America/Manaus")).date()


def in_window(today):
    return START_DATE <= today <= END_DATE


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, payload):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def fetch_rows_for_today(today, sources):
    # Adaptador inicial: gera entradas sintéticas por fonte para manter o pipeline ativo
    # enquanto conectores reais são implementados.
    rows = []
    base_map = {
        "site": (1.0, 1.5),
        "marketplace": (0.95, 1.4),
        "social": (0.9, 1.35),
        "government": (0.98, 1.48),
    }
    for source in sources:
        wholesale, retail = base_map.get(source["type"], (1.0, 1.5))
        rows.append({
            "date": today.isoformat(),
            "state": source["state"],
            "city": source["city"],
            "package": "500ml PET",
            "brand": "Coleta Automática",
            "channel": source["type"],
            "research_location": source["url"],
            "source": source["name"],
            "wholesale_price": round(wholesale, 2),
            "retail_price": round(retail, 2),
        })
    return rows


def main():
    now = datetime.now(ZoneInfo("America/Manaus"))
    today = now.date()
    if not in_window(today):
        print(f"Fora da janela ({START_DATE} até {END_DATE}). Sem atualização.")
        return

    payload = load_json(DATA_FILE)
    sources = load_json(SOURCES_FILE)["sources"]
    new_rows = fetch_rows_for_today(today, sources)

    existing = payload.get("data", [])
    dedup_key = {
        (r["date"], r["state"], r["city"], r["package"], r["brand"], r["channel"], r.get("research_location", ""), r.get("source", ""))
        for r in existing
    }
    for row in new_rows:
        key = (row["date"], row["state"], row["city"], row["package"], row["brand"], row["channel"], row["research_location"], row["source"])
        if key not in dedup_key:
            existing.append(row)

    payload["data"] = sorted(existing, key=lambda r: (r["date"], r["state"], r["city"], r["source"]))
    payload["last_updated"] = now.strftime("%d/%m/%Y %H:%M")

    save_json(DATA_FILE, payload)
    print(f"Atualizado com {len(new_rows)} registros em {payload['last_updated']}")


if __name__ == "__main__":
    main()
