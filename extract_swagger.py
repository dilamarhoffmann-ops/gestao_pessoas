import json
import urllib.request

url = "https://corporate.empregare.com/api/swagger/docs/v1"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))

    pessoas_paths = {}
    used_definitions = set()

    def extract_refs(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k == '$ref':
                    ref_name = v.split('/')[-1]
                    used_definitions.add(ref_name)
                else:
                    extract_refs(v)
        elif isinstance(obj, list):
            for item in obj:
                extract_refs(item)

    for path, methods in data.get('paths', {}).items():
        for method, details in methods.items():
            tags = details.get('tags', [])
            if 'Pessoas' in tags or 'PessoasApi' in tags or any('Pessoa' in t for t in tags):
                if path not in pessoas_paths:
                    pessoas_paths[path] = {}
                pessoas_paths[path][method] = details
                extract_refs(details)

    definitions = data.get('definitions', {})
    
    # Also recursively find refs in definitions
    def resolve_def_refs():
        start_len = len(used_definitions)
        for def_name in list(used_definitions):
            if def_name in definitions:
                extract_refs(definitions[def_name])
        if len(used_definitions) > start_len:
            resolve_def_refs()

    resolve_def_refs()

    relevant_defs = {k: v for k, v in definitions.items() if k in used_definitions}

    result = {
        'paths': pessoas_paths,
        'definitions': relevant_defs
    }

    with open('swagger_pessoas.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Extracted {len(pessoas_paths)} paths and {len(relevant_defs)} definitions.")
except Exception as e:
    print(f"Error: {e}")
