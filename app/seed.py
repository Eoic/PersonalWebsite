"""Seed script – populates the SQLite database with all website content.

Usage:
    python -m app.seed
"""

import json
from datetime import date

from .db import db_proxy, init_db
from .models import (
    ALL_MODELS,
    About,
    Education,
    EducationTag,
    Page,
    Position,
    PositionTag,
    Project,
    ProjectMedia,
    ProjectTag,
    Tag,
)

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------

PAGES = [
    {"slug": "index", "title": "About", "description": "Learn about Karolis Strazdas, a software engineer passionate about building innovative web applications, functional programming, and machine learning. Explore my background and interests.", "url": "/", "sort_order": 0},
    {"slug": "positions", "title": "Positions", "description": "Explore Karolis Strazdas' professional experience as a software engineer, including his current role at Indeform Ltd. and previous internship experience.", "url": "/positions", "sort_order": 1},
    {"slug": "education", "title": "Education", "description": "Learn about Karolis Strazdas' educational background, including his Bachelor's degree in Software Systems from Kaunas University of Technology.", "url": "/education", "sort_order": 2},
    {"slug": "projects", "title": "Projects", "description": "Discover Karolis Strazdas' portfolio of software projects including ASCIIGround, Boids simulation, Papyrus book management app, and other innovative applications.", "url": "/projects", "sort_order": 3},
]

POSITIONS = [
    {
        "title": "Programmer",
        "company": "Indeform Ltd.",
        "date_from": date(2020, 7, 13),
        "date_until": None,
        "description": '<p>Developing dynamic web applications utilizing a full stack technology stack, maintaining server configurations, and establishing CI/CD pipelines.</p><ul><li> Developing interactive wall projection games and tools with OpenCV (C++, Python), Godot, ImGui. </li><li> Doing web development and graphics programming for orthopedics software. </li><li> Working on internal software solutions for the web platform. </li><li> Deploying products and services to internal servers and cloud platforms such as AWS, creating configurations for NGINX, Docker, Docker Compose, Jenkins. </li><li> Writing, maintaining and executing manual functional tests, creating automatic tests. </li></ul>',
        "sort_order": 0,
        "tags": ["Django", "Python", "React", "JavaScript", "TypeScript", "PostgreSQL", "Nginx", "Docker", "Jenkins"],
    },
    {
        "title": "Software engineering intern",
        "company": "Indeform Ltd.",
        "date_from": date(2020, 2, 13),
        "date_until": date(2020, 5, 15),
        "description": '<p>Designed and developed debt recovery management system. Contributed to all phases of the software development life cycle, from requirements analysis to system design, implementation, and testing.</p><ul><li> Performing requirements analysis and system design. </li><li> Designing and developing debt recovery management system. </li></ul>',
        "sort_order": 1,
        "tags": ["Requirements analysis", "System architecture design", "User interface design", "Back-end development", "Front-end development", "Quality assurance"],
    },
]

EDUCATION = [
    {
        "title": "Bachelor's degree in software systems",
        "institution": "Kaunas University of Technology",
        "date_from": date(2016, 9, 1),
        "date_until": date(2020, 6, 30),
        "description": '<p>Acquired comprehensive knowledge about various aspects of software engineering, computer science, programming languages, tools, data structures, algorithms and so on. Acquired diverse set of skills to deal with real-world challenges in developing software systems.</p>',
        "sort_order": 0,
        "tags": ["Algorithms", "Discrete mathematics", "Systems architecture & design", "Web technologies", "Software development", "Databases", "UML"],
    },
]

PROJECTS = [
    {
        "title": "ASCIIGround",
        "subtitle": "a TypeScript library for creating backgrounds out of character patterns.",
        "title_link": "https://github.com/Eoic/ASCIIGround",
        "description": '<p>Renders a grid of characters on the canvas using patterns such as Perlin noise, simplex noise, character rain, signed distance fields and more. Generated backgrounds can be static, animated or interactive, and can be used as backgrounds for websites to create a unique visual style. Various configuration options are supported to customize the appearance and behavior.</p><b> Features </b><ul><li>Multiple animation patterns: Perlin noise, rain, static noise with extensible pattern system;</li><li>Configuration options for font, animation speed, character sets, noise parameters, and much more;</li><li>Responsive and resizable canvas rendering;</li><li>Easy to use API and comprehensive documentation;</li><li>Supports both ESM and UMD/CDN usage;</li></ul>',
        "sort_order": 0,
        "tags": ["TypeScript", "HTML5", "CSS3"],
        "media": [{"type": "image", "src": "images/projects/asciiground.webp", "alt": "ASCIIGround demo screenshot"}],
    },
    {
        "title": "Boids",
        "subtitle": "a flocking simulation",
        "title_link": "https://github.com/Eoic/Boids",
        "description": '<p>A flocking simulation based on the Boids algorithm. The simulation is based on the original paper by Craig Reynolds <a class="link bordered" href="https://www.red3d.com/cwr/papers/1987/SIGGRAPH87.pdf" target="_blank">Flocks, Herds, and Schools</a>, which describes the behavior of a flock of birds. Implements the three basic rules of flocking: separation, alignment, cohesion and some additional features like goal chasing, dynamic boundaries, wind effect, and so on.</p><b> Features </b><ul><li> Real-time simulation of boid movement;</li><li> Configurable environment (number of boids, visual range, speed, wind strength and direction, etc.);<li> Can save and load simulation settings and state;</li></ul>',
        "sort_order": 1,
        "tags": ["Python", "Pygame", "ImGui"],
        "media": [{"type": "image", "src": "images/projects/boids.webp", "alt": "Boids simulation screenshot"}],
    },
    {
        "title": "Papyrus",
        "subtitle": "a cross-platform e-book management system",
        "title_link": "https://github.com/Eoic/Papyrus",
        "description": '<p>I like collecting books, both in physical and digital form, but none of the applications that I used so far to track my collections met my expectations - Calibre, Google Books, Amazon Kindle, Bookshelf, etc. Some of the main pain points for me are ugly user interface, lack of support for multiple platforms, file size limits, unsupported file formats, no ability to manage physical books and notes. I wish address these issues and add some of the more more interesting features like reading statistics, goal tracking, and potentially integrate some form of social interaction (e.g., book borrowing) and to bring this experience to the most commonly used platforms - Windows, Linux, Web, Android (including e-readers) and iOS.</p><b> Features </b><ul><li>File uploads, metadata management and categorization (e.g., shelves, topics, tags);</li><li>Management and progress tracking for physical books;</li><li>Reading progress sync across devices;</li><li>Notes and annotations;</li><li>Full-text search;</li><li>Reading statictics;</li></ul>',
        "sort_order": 2,
        "tags": ["Flutter", "Dart", "Rust", "MongoDB", "Realm"],
        "media": [{"type": "image", "src": "images/projects/papyrus-library.webp", "alt": "Papyrus library view"}],
    },
    {
        "title": "Canopy",
        "subtitle": "a real time spatial conversation platform",
        "title_link": "https://github.com/Eoic/Canopy",
        "description": "<p>Essentially, it's a real time forum / board where conversations grow like virtual forests. Instead of usual threads like on Reddit, you plant virtual trees as posts or replies to posts on an infinite, shared grid - each tree representing an idea, opinion, or a question. Over time, clusters of trees form something like a virtual forest, creating a unique conversation space.</p><b> How it works? </b><ul><li>Any user can plant a tree anywhere in the grid. Each tree represents a single comment, question or idea;</li><li>To reply, users plant a new tree within a circular radius of the original. This creates a spatial \"reply\" relationship that mirrors real conversation flow in the layout of the forest;</li><li>Trees grow in stages based on interaction such as new replies and upvotes. Each interaction contributes to a tree's growth percentage - once reaches 100%, the tree advances to the next growth stage;</li><li>Tree type depends on the intention - different species of trees represent different types of posts. There are questions, opinions, ideas, and news;</li><li>Selecting a tree opens a side panel with a traditional view of the thread;</li></ul>",
        "sort_order": 3,
        "tags": ["TypeScript", "Pixi.js", "Python", "PostgreSQL", "Redis"],
        "media": [],
    },
    {
        "title": "NetBots",
        "subtitle": "a real-time multiplayer robot programming game",
        "title_link": "https://github.com/Eoic/NetBots",
        "description": '<p>Briefly, it\'s a robot battle tank programming game that runs in the browser, similar to games such as <a class="link bordered" href="https://robocode.sourceforge.io/" target="_blank">Robocode</a> and <a class="link bordered" href="https://screeps.com/" target="_blank">Screeps</a>. You can write a script to you robot and make it fight against robots of other players in real-time.</p><b> Features </b><ul><li>Robot programming in JavaScript and through graph editor;</li><li>Real-time and concurrent battles;</li><li>Achievements and leaderboards;</li><li>Custom maps and game rules;</li><li>Various game modes;</li></ul>',
        "sort_order": 4,
        "tags": ["TypeScript", "Redis", "MongoDB", "Deno"],
        "media": [],
    },
    {
        "title": "JigsawQuest",
        "subtitle": "a multiplayer jigsaw puzzle game",
        "title_link": "https://github.com/Eoic/JigsawQuest",
        "description": '<p>Jigsaw puzzle solving game, where user can create a puzzle solving session by selecting provided default image or uploading their own. Puzzles can be solved individually or with friends in real-time.</p><b> Features </b><ul><li>Solo and multiplayer solving sessions;</li><li>Custom puzzle configurations (e.g. image, number of pieces, piece placement);</li><li>Achievements and statistics;</li></ul>',
        "sort_order": 5,
        "tags": ["TypeScript", "Alpine.js", "Pixi.js", "Redis", "Python"],
        "media": [],
    },
]

ABOUT = [
    {"key": "content_description", "value": json.dumps("I'm a software engineer passionate about building useful and/or interesting things for the web. Feel free to check out my projects and work experience here.")},
    {"key": "reading", "value": json.dumps([{"title": "Fluent Python, 2nd Edition", "author": "Luciano Ramalho"}])},
    {"key": "learning_about", "value": json.dumps([])},
    {"key": "working_on", "value": json.dumps([{"title": "Papyrus", "subtitle": "a cross-platform book reading and management application", "link": "https://github.com/PapyrusReader/client"}])},
]

# ---------------------------------------------------------------------------
# Seeding logic
# ---------------------------------------------------------------------------


def _seed_tags(tag_names):
    """Create tags using get_or_create and return a list of Tag instances."""
    tags = []
    for name in tag_names:
        tag, _ = Tag.get_or_create(name=name)
        tags.append(tag)
    return tags


def seed():
    """Clear all tables and re-seed the database."""
    db = init_db()

    # Delete in reverse dependency order.
    delete_order = list(reversed(ALL_MODELS))

    with db_proxy.atomic():
        for model in delete_order:
            model.delete().execute()

        # Pages
        for row in PAGES:
            Page.create(**row)
        print(f"  Pages: {len(PAGES)}")

        # Positions + tags
        for row in POSITIONS:
            tag_names = row.pop("tags")
            position = Position.create(**row)
            row["tags"] = tag_names  # restore for idempotency
            for tag in _seed_tags(tag_names):
                PositionTag.create(position=position, tag=tag)
        print(f"  Positions: {len(POSITIONS)}")

        # Education + tags
        for row in EDUCATION:
            tag_names = row.pop("tags")
            education = Education.create(**row)
            row["tags"] = tag_names
            for tag in _seed_tags(tag_names):
                EducationTag.create(education=education, tag=tag)
        print(f"  Education: {len(EDUCATION)}")

        # Projects + tags + media
        for row in PROJECTS:
            tag_names = row.pop("tags")
            media_items = row.pop("media")
            project = Project.create(**row)
            row["tags"] = tag_names
            row["media"] = media_items
            for tag in _seed_tags(tag_names):
                ProjectTag.create(project=project, tag=tag)
            for media in media_items:
                ProjectMedia.create(
                    project=project,
                    media_type=media["type"],
                    src=media["src"],
                    alt=media["alt"],
                )
        print(f"  Projects: {len(PROJECTS)}")

        # About
        for row in ABOUT:
            About.create(**row)
        print(f"  About: {len(ABOUT)}")

        # Summary for tags
        tag_count = Tag.select().count()
        print(f"  Tags: {tag_count}")

    print("Seed complete.")


if __name__ == "__main__":
    print("Seeding database...")
    seed()
