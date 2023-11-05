import json
from tqdm import tqdm
import requests
import base64
import uuid
import os

with open("instructions.json", "r") as f:
    inp = json.loads(f.read())

for item in tqdm(inp):
    id_ = str(uuid.uuid4())
    item["uuid"] = id_
    steps = item['steps']
    os.mkdir(id_)
    for index,step in enumerate(steps):
        with requests.get(step['image_link']) as response:
            with open(os.path.join(id_, str(index+1)), "wb") as f:
                f.write(response.content)
with open("out.json", "w") as f:
    f.write(json.dumps(inp, indent=4))

