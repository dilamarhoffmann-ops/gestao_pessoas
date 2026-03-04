import json

with open('full_swagger.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for k, v in data.get('definitions', {}).items():
    if 'login' in k.lower():
        print(f"Model: {k}")
        print(json.dumps(v, indent=2))
