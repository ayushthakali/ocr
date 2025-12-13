import json
import os

class FileKeyGenerator:
    def __init__(self, counter_file="counters.json"):
        self.counter_file = counter_file
        self.load_counters()

    def load_counters(self):
        if os.path.exists(self.counter_file):
            with open(self.counter_file, "r") as f:
                self.counters = json.load(f)
        else:
            self.counters = {
                "invoice": 0,
                "receipt": 0,
                "statement": 0,
                "bill": 0,
                "other": 0
            }

    def save_counters(self):
        with open(self.counter_file, "w") as f:
            json.dump(self.counters, f)

    def generate_key(self, document_type: str) -> str:
        # Always reload counters to handle external updates
        self.load_counters()
        
        doc = document_type.lower()

        # Map document type to prefix
        if "invoice" in doc:
            prefix = "INV"
            self.counters["invoice"] += 1
            count = self.counters["invoice"]
        elif "receipt" in doc:
            prefix = "RCT"
            self.counters["receipt"] += 1
            count = self.counters["receipt"]
        elif "statement" in doc:
            prefix = "STM"
            self.counters["statement"] += 1
            count = self.counters["statement"]
        elif "bill" in doc:
            prefix = "BIL"
            self.counters["bill"] += 1
            count = self.counters["bill"]
        else:
            prefix = "GEN"
            self.counters["other"] += 1
            count = self.counters["other"]

        # Save updated counters
        self.save_counters()

        # Return key like INV001, RCT002, etc.
        return f"{prefix}{count:03d}"  # zero-padded 3 digits

