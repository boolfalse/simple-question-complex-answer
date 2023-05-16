
import sys
import json
from bard import Bard

def process_parameters(secret, text):
    if secret is None or text is None:
        result = {
            "success": False,
            "message": "Command sample: python answer.py \"<secret>\" \"<text>\""
        }
        return json.dumps(result)

    # Process the parameters as needed
    bard = Bard(secret)
    answer = bard.get_answer(text)
    result = {
        "success": True,
        "message": answer
    }
    return json.dumps(result)


# Retrieve parameters from command line arguments
secret = sys.argv[1] if len(sys.argv) > 1 else None
text = sys.argv[2] if len(sys.argv) > 2 else None

# Process the parameters and return the result
try:
    result = process_parameters(secret, text)
    print(result)
except Exception as e:
    result = {
        "success": False,
        "message": str(e)
    }
    print(json.dumps(result))
