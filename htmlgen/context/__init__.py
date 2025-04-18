from .about import about
from .education import education
from .positions import positions
from .projects import projects

context_data = {
    item["page"]: item
    for item in [
        about,
        education,
        positions,
        projects,
    ]
}
