projects = {
    "page": "projects",
    "article_title_prefix": "Project",
    "items": [
        {
            "title": "Boids",
            "title_link": "https://github.com/Eoic/Boids",
            "subtitle": "a flocking simulation",
            "description": """
                    <p>
                        A flocking simulation based on the Boids algorithm. The simulation
                        is based on the original paper by Craig Reynolds, which describes the
                        behavior of a flock of birds. Implements the three basic rules of
                        flocking: separation, alignment, cohesion and some additional
                        features like goal chasing, dynamic boundaries, wind effect, and so on.
                    </p>
                    <b> Features </b>
                    <ul>
                        <li> Real-time simulation of boid movement;</li>
                        <li> Configurable environment (number of boids, visual range, speed, wind strength and direction, etc.);
                        <li> Can save and load simulation settings and state;</li>
                    </ul>
                """.strip(),
            "tags": [
                "Python",
                "Pygame",
                "ImGui",
            ],
        },
        {
            "title": "Papyrus",
            "title_link": "https://github.com/Eoic/Papyrus",
            "subtitle": "a cross-platform e-book management system",
            "description": """
                    <p>
                        I like collecting books, both in physical and digital form,
                        but none of the applications that I used so far to track my collections
                        met my expectations - Calibre, Google Books, Amazon Kindle,
                        Bookshelf, etc. Some of the main pain points for me are ugly user
                        interface, lack of support for multiple platforms, file size
                        limits, unsupported file formats, no ability to manage physical
                        books and notes. I wish address these issues and add some of the more
                        more interesting features like reading statistics, goal tracking,
                        and potentially integrate some form of social interaction (e.g., book borrowing) and 
                        to bring this experience to the most commonly used platforms - 
                        Windows, Linux, Web, Android (including e-readers) and iOS.
                    </p>

                    <b> Features </b>
                    <ul>
                        <li>
                        File uploads, metadata management and categorization (e.g., shelves,
                        topics, tags);
                        </li>
                        <li>Management and progress tracking for physical books;</li>
                        <li>Reading progress sync across devices;</li>
                        <li>Notes and annotations;</li>
                        <li>Full-text search;</li>
                        <li>Reading statictics;</li>
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
            "title": "Canopy",
            "title_link": "https://github.com/Eoic/Canopy",
            "subtitle": "a real time spatial conversation platform",
            "description": """
                    <p>
                        Essentially, it's a real time forum / board 
                        where conversations grow like virtual forests. Instead of usual threads like on Reddit,
                        you plant virtual trees as posts or replies to posts on an infinite, shared grid - each tree representing 
                        an idea, opinion, or a question. Over time, clusters of trees form something like a virtual forest,
                        creating a unique conversation space.
                    </p>

                    <b> How it works? </b>
                    <ul>
                        <li>Any user can plant a tree anywhere in the grid. Each tree represents a single comment, question or idea;</li>
                        <li>To reply, users plant a new tree within a circular radius of the original. This creates a spatial "reply" relationship that mirrors real conversation flow in the layout of the forest;</li>
                        <li>Trees grow in stages based on interaction such as new replies and upvotes. Each interaction contributes to a tree's growth percentage - once reaches 100%, the tree advances to the next growth stage;</li>
                        <li>Tree type depends on the intention - different species of trees represent different types of posts. There are questions, opinions, ideas, and news;</li>
                        <li>Selecting a tree opens a side panel with a traditional view of the thread;</li>
                    </ul>
                """.strip(),
            "tags": [
                "TypeScript",
                "Pixi.js",
                "Python",
                "PostgreSQL",
                "Redis",
            ],
        },
        {
            "title": "NetBots",
            "title_link": "https://github.com/Eoic/NetBots",
            "subtitle": "a real-time multiplayer robot programming game",
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
                        <li>Robot programming in JavaScript and through graph editor;</li>
                        <li>Real-time and concurrent battles;</li>
                        <li>Achievements and leaderboards;</li>
                        <li>Custom maps and game rules;</li>
                        <li>Various game modes;</li>
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
            "title": "JigwawQuest",
            "title_link": "https://github.com/Eoic/JigsawQuest",
            "subtitle": "a multiplayer jigsaw puzzle game",
            "description": """
                    <p>
                        Jigsaw puzzle solving game, where user can create a puzzle solving
                        session by selecting provided default image or uploading their
                        own. Puzzles can be solved individually or with friends in
                        real-time.
                    </p>

                    <b> Features </b>
                    <ul>
                        <li>Solo and multiplayer solving sessions;</li>
                        <li>
                        Custom puzzle configurations (e.g. image, number of pieces,
                        piece placement);
                        </li>
                        <li>Achievements and statistics;</li>
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
}
