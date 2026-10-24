import json
from pathlib import Path
offers = json.load(open(Path(__file__).resolve().parent / "offers.json"))
