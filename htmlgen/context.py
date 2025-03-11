from datetime import datetime

context_data = {
    "about": {
        "page": "about",
        "description": """
                Hi, I'm a passionate full-stack developer focused on creating innovative web applications. I primarily work
                with Python, TypeScript, Django, and Flutter, but I'm always eager to explore new concepts and technologies.
                My interests extend to functional programming, computer graphics, and literature. Learn more about my
                projects and professional experience here.
        """.strip(),
    },
    "positions": {
        "page": "positions",
        "article_title_prefix": "Position",
        "items": [
            {
                "title": "Programmer &bull; Indeform Ltd.",
                "from": datetime(2020, 7, 13),
                "until": None,
                "description": """
                <p>
                    Developing dynamic web applications utilizing a full stack
                    technology stack, maintaining server configurations, and
                    establishing CI/CD pipelines.
                </p>
                <ul>
                    <li> Developing interactive wall projection games and tools with OpenCV (C++, Python), Godot, ImGui. </li>
                    <li> Doing web development and graphics programming for orthopedics software. </li>
                    <li> Working on internal software solutions for the web platform. </li>
                    <li> Deploying products and services to internal servers and cloud platforms such as AWS, creating
                    configurations for NGINX, Docker, Docker Compose, Jenkins. </li>
                    <li> Writing, maintaining and executing manual functional tests, creating automatic tests. </li>
                </ul>
            """.strip(),
                "tags": [
                    "Django",
                    "Python",
                    "React",
                    "JavaScript",
                    "TypeScript",
                    "PostgreSQL",
                    "Nginx",
                    "Docker",
                    "Jenkins",
                ],
            },
            {
                "title": "Software engineering intern &bull; Indeform Ltd.",
                "from": datetime(2020, 2, 13),
                "until": datetime(2020, 5, 15),
                "description": """
                <p>
                    Designed and developed debt recovery management system. Contributed to
                    all phases of the software development life cycle, from
                    requirements analysis to system design, implementation, and
                    testing.
                </p>
                <ul>
                    <li> Performing requirements analysis and system design. </li>
                    <li> Designing and developing debt recovery management system. </li>
                </ul>
                """.strip(),
                "tags": [
                    "Requirements analysis",
                    "System architecture design",
                    "User interface design",
                    "Back-end development",
                    "Front-end development",
                    "Quality assurance",
                ],
            },
        ],
    },
    "education": {
        "page": "education",
        "article_title_prefix": "Education",
        "items": [
            {
                "title": "Bachelor's degree in software systems &bull; Kaunas University of Technology.",
                "from": datetime(2016, 9, 1),
                "until": datetime(2020, 6, 30),
                "description": """
                <p>
                    Acquired comprehensive knowledge about various aspects of software
                    engineering, computer science, programming languages, tools, data
                    structures, algorithms and so on. Acquired diverse set of skills
                    to deal with real-world challenges in developing software systems.
                </p>
                """.strip(),
                "tags": [
                    "Systems design",
                    "Discrete mathematics",
                    "Analysis of algorithms",
                    "Web technologies",
                    "Software development",
                    "Databases",
                    "UML",
                ],
            },
        ],
    },
    "projects": {
        "page": "projects",
        "article_title_prefix": "Project",
        "items": [
            {
                "title": """
                    <a class="link bordered" href="https://github.com/Eoic/Papyrus" target="_blank">
                        Papyrus
                    </a> - cross-platform e-book management system
                """.strip(),
                "description": """
                    <p>
                        I am fond of collecting books, both in physical and digital form,
                        but none of the applications I used so far to track my collections
                        met my expectations - Calible, Google Books, Amazon Kindle,
                        Bookshelf, etc. Some of the main pain points for me are ugly user
                        interface, lack of support for multiple platforms, file size
                        limits, narrow file format support, no ability to manage physical
                        books, notes managemens.
                    </p>

                    <p>
                        By developing Papyrus I aim to address these issues and add some
                        more interesting features like reading statistics, goal tracking,
                        and potentially some social systems for book borrowing.
                        Furthermore, I wish to bring this seamless experience to all most
                        commonly used platforms - Windows, Linux, Web, Android and iOS.
                    </p>

                    <b> Features </b>
                    <ul>
                        <li>
                        E-book uploading, conversion and management (e.g. shelves,
                        topics)
                        </li>
                        <li>Management and progress tracking of physical books</li>
                        <li>Reading progress synchronization across devices</li>
                        <li>Notes and annotations</li>
                        <li>Full-text search</li>
                        <li>Statictics</li>
                    </ul>
                """.strip(),
                "tags": [
                    "Flutter",
                    "Dart",
                    "Rust",
                    "MongoDB",
                    "Realm",
                ],
            },
            {
                "title": """
                    <a class="link bordered" href="https://github.com/Eoic/NetBots" target="_blank">
                        NetBots
                    </a> - multiplayer robot programming game
                """,
                "description": """
                    <p>
                        Briefly, it's a robot battle tank programming game that runs in
                        the browser, similar to games such as
                        <a class="link bordered" href="https://robocode.sourceforge.io/" target="_blank"> Robocode </a> and
                        <a class="link bordered" href="https://screeps.com/" target="_blank">
                        Screeps </a>. You can write a script to you robot and make it fight against
                        robots of other players in real-time.
                    </p>

                    <b> Features </b>
                    <ul>
                        <li>Robot programming in JavaScript and through graph editor</li>
                        <li>Real-time and concurrent battles</li>
                        <li>Achievements and leaderboards</li>
                        <li>Custom maps and game rules</li>
                        <li>Various game modes</li>
                    </ul>
                """.strip(),
                "tags": [
                    "TypeScript",
                    "Redis",
                    "MongoDB",
                    "Deno",
                ],
            },
            {
                "title": """
                    <a class="link bordered" href="https://github.com/Eoic/JigsawQuest" target="_blank">
                        JigsawQuest
                    </a> - jigsaw puzzle solving game
                """,
                "description": """
                    <p>
                        Jigsaw puzzle solving game, where user can create a puzzle solving
                        session by selecting provided default image or uploading their
                        own. Puzzles can be solved individually or with friends in
                        real-time.
                    </p>

                    <b> Features </b>
                    <ul>
                        <li>Solo and multiplayer solving sessions</li>
                        <li>
                        Custom puzzle configurations (e.g. image, number of pieces,
                        piece placement)
                        </li>
                        <li>Achievements and statistics</li>
                    </ul>
                """.strip(),
                "tags": [
                    "TypeScript",
                    "Alpine.js",
                    "Pixi.js",
                    "Redis",
                    "Python",
                ],
            },
        ],
    },
}
