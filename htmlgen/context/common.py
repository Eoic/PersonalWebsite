import json
import os

print(os.getcwd())

with open("package.json", "r") as package_file:
    package_data = json.load(package_file)

common = {
    "page": "common",
    "build": {
        "version": package_data.get("version", "1.0.0"),
    },
    "personal": {
        "location": "Kaunas, Lithuania",
        "name": "Karolis Strazdas",
    },
    "position": {
        "name": "Software engineer",
        "company": "Indeform Ltd",
    },
    "navigation": [
        {"id": "index", "title": "About", "url": "/"},
        {"id": "positions", "title": "Positions", "url": "/positions"},
        {"id": "education", "title": "Education", "url": "/education"},
        {"id": "projects", "title": "Projects", "url": "/projects"},
    ],
    "seo": {
        "base_description": "Karolis Strazdas - software engineer at Indeform Ltd. Passionate about building innovative web applications and solving real-world problems.",
        "site_url": "https://karolis-strazdas.lt"
    },
}
