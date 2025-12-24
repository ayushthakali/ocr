# import json
# import os
# from typing import Dict

# class FileKeyGenerator:
#     def __init__(self, counter_file: str = "counters.json"):
#         self.counter_file = counter_file
#         self.counters: Dict[str, int] = {}
#         self.load_counters()

#     def load_counters(self) -> None:
#         if os.path.exists(self.counter_file):
#             with open(self.counter_file, "r") as f:
#                 self.counters = json.load(f)
#         else:
#             self.counters = {
#                 "invoice": 0,
#                 "receipt": 0,
#                 "statement": 0,
#                 "bill": 0,
#                 "other": 0
#             }

#     def save_counters(self) -> None:
#         with open(self.counter_file, "w") as f:
#             json.dump(self.counters, f)

#     def generate_key(self, document_type: str) -> str:
#         # Always reload counters to handle external updates
#         self.load_counters()
        
#         doc = document_type.lower()

#         # Map document type to prefix
#         if "invoice" in doc:
#             prefix = "INV"
#             self.counters["invoice"] += 1
#             count = self.counters["invoice"]
#         elif "receipt" in doc:
#             prefix = "RCT"
#             self.counters["receipt"] += 1
#             count = self.counters["receipt"]
#         elif "statement" in doc:
#             prefix = "STM"
#             self.counters["statement"] += 1
#             count = self.counters["statement"]
#         elif "bill" in doc:
#             prefix = "BIL"
#             self.counters["bill"] += 1
#             count = self.counters["bill"]
#         else:
#             prefix = "GEN"
#             self.counters["other"] += 1
#             count = self.counters["other"]

#         # Save updated counters
#         self.save_counters()

#         # Return key like INV001, RCT002, etc.
#         return f"{prefix}{count:03d}"  # zero-padded 3 digits



# ========================================================================================================================================================

from app.infrastructure.firebase.firebase_service import FirebaseService

class KeyGenerator:
    """Async Key Generator using Firebase counters"""
    
    def __init__(self):
        self.firebase_service = FirebaseService()

    async def generate_key_async(self, document_type: str, user_id: str, company_id: str) -> str:
        doc = document_type.lower()
        
        # Map document type to prefix
        if "invoice" in doc:
            prefix = "INV"
        elif "receipt" in doc:
            prefix = "RCT"
        elif "statement" in doc:
            prefix = "STM"
        elif "bill" in doc:
            prefix = "BIL"
        else:
            prefix = "GEN"

        # Get next number from Firebase
        number = await self.firebase_service.get_next_document_number_async(
            user_id, company_id, prefix
        )

        # Return key format: INV1, RCT2, etc.
        return f"{prefix}{number}"

