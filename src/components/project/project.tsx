import { useEffect, useState } from "react";
import AnimatedBackground from "./AnimatedBackground";
import ProjectDetail from "./ProjectDetail";
import "./Project.css";

export interface Project {
  title: string;
  agency: string;
  year: string;
  description: string;
  image: string;
  link: string;
  backgroundColor: string;
  blobColor: string;
}

const defaultProjects: Project[] = [
  {
    title: "HexE",
    agency: "SWASTIC-7",
    year: "2025",
    description:
      "A comprehensive toolchain for the SIC/XE architecture, featuring a two-pass assembler, loader,linker, disassembler, and an interactive TUI-based debugger.",
    image: "/project/project1.png",
    link: "https://github.com/SWASTIC-7/HexE",
    backgroundColor: "#865b3dff",
    blobColor: "#621a1bff"
  },
  {
    title: "0xtcp",
    agency: "SWASTIC-7",
    year: "2024",
    description: "0xtcp is an experimental transport-layer engine [RFC-793] written from scratch in Rust.",
    image: "/project/project2.png",
    link: "https://github.com/SWASTIC-7/0xtcp",
    backgroundColor: "#2E8B57",
    blobColor: "#0d6161ff"
  },
  {
    title: "Nyx",
    agency: "SWASTIC-7",
    year: "2024",
    description: "Nyx focuses on building an advanced, dark-themed custom x86 bootloader.",
    image: "/project/project3.png",
    link: "https://github.com/SWASTIC-7/Nyx",
    backgroundColor: "#8A2BE2",
    blobColor: "#671a5fff"
  },
  {
    title: "OpEx",
    agency: "6POINT5INCH",
    year: "2025",
    description: "A decentralized options trading protocol built on top of the 1inch Limit Order Protocol, enabling efficient on-chain options trading with NFT-based position representation.",
    image: "/project/project4.png",
    link: "https://github.com/SWASTIC-7/OpEx",
    backgroundColor: "#228B22",
    blobColor: "#0A5325"
  },
  {
    title: "MemeMoney",
    agency: "SWASTIC-7",
    year: "2025",
    description: "A Platfrom where you can trade and create memecoin safely avoiding issues like Rug pull, Whale Dumps and Wallet Spamming.",
    image: "/project/project5.png",
    link: "https://github.com/SWASTIC-7/MemeMoney",
    backgroundColor: "#4169E1",
    blobColor: "#6f5620ff"
  },
  {
    title: "RELICS.ai",
    agency: "SWASTIC-7",
    year: "2025",
    description: "RELICS: The Lost Protocol is a bold experiment where cutting-edge AI meets blockchain security in a thrilling game of wits.",
    image: "/project/project6.png",
    link: "https://github.com/KapilSareen/RELICS.ai",
    backgroundColor: "#84172dff",
    blobColor: "#2f5c56ff"
  },
  {
    title: "DARK LIGHT",
    agency: "SWASTIC-7 KAPIL SAREEN",
    year: "2024",
    description: "A 2D action-adventure gameinGodotexploringlight-versus-shadow mechanics and dynamicenemyinteractions.",
    image: "/project/project7.png",
    link: "https://gaymer-001.itch.io/darklight",
    backgroundColor: "#4682B4",
    blobColor: "#77205aff"
  }
];

export default function PortfolioSection({ projects = defaultProjects }: { projects?: Project[] }) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const totalHeight = projects.length * windowHeight;
      const maxScroll = totalHeight - windowHeight;
      
      // Calculate which project section we're in
      let currentSection = Math.floor(scrollY / windowHeight);
      
      // Fix for last project: if we're at or past the last section, stick to last project
      if (scrollY >= maxScroll) {
        currentSection = projects.length - 1;
      }
      
      // Each project gets a full screen height and sticks until completely scrolled
      let newIndex = currentSection;
      newIndex = Math.min(newIndex, projects.length - 1);
      newIndex = Math.max(newIndex, 0);
      
      // Smooth transition when changing projects
      if (newIndex !== index && !isTransitioning) {
        setIsTransitioning(true);
        setFade(true);
        
        // Smooth scroll to the exact position for the new project
        const targetScrollY = newIndex * windowHeight;
        window.scrollTo({
          top: targetScrollY,
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          setIndex(newIndex);
          setFade(false);
          setIsTransitioning(false);
        }, 500); // Match the scroll animation duration
      }
    };
    
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [index, isTransitioning, projects.length]);

  const project = projects[index];

    const movetoGithub = () => {
    window.open("https://github.com/SWASTIC-7", "_blank");
    }
  return (
    <div className="portfolio-section">
      <AnimatedBackground backgroundColor={project.backgroundColor} blobColor={project.blobColor} />
      <div className="portfolio-content">
        <div className="Github" onClick={movetoGithub}>GITHUB</div>
        <ProjectDetail project={project} fade={fade} />
        <div className="bottom-left">
          <div className="circle-counter">
            <div className="label">PROJECT</div>
            <div className="number">
              <span>{index + 1}</span>/<span>{projects.length}</span>
            </div>
            <div className="arrows">
              ← → {/* You can hook up navigation here */}
            </div>
            <div className="label-bottom">NUMBER</div>
          </div>
          <div className="intro">
           MADE WITH LOVE, RESTLESS CURIOSITY, AND A LOT OF COFFEE.
            DRIVEN BY MODERN TECH AND UNAPOLOGETIC INNOVATION.
          </div>
        </div>
        <div className="bottom-right">
          <img src={project.image} alt="project" className="preview-img" />
        </div>
      </div>
    </div>
  );
}
