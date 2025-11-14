

interface Project {
  title: string;
  agency: string;
  year: string;
  description: string;
  image: string;
  link: string;
}

export default function ProjectDetail({ project, fade }: { project: Project; fade: boolean }) {

  
  return (
    <div className={`text-content${fade ? " fade" : ""}`}>
        
      <div className="project_detail">
      <div className="title">{project.title}</div>
      <div className="meta">
        AGENCY. {project.agency} / YEAR. {project.year}
      </div>
      <p className="desc">{project.description}</p>

      <a className="visit-btn" href={project.link} target="_blank" rel="noopener noreferrer">
        VISIT <span>↗</span>
      </a>
      </div>
    </div>
  );
} 