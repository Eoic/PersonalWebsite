from datetime import datetime

positions = {
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
}
