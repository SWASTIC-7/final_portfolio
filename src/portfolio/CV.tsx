import { T } from './text'

const BLOG = 'https://swastic-7.github.io/sw4sy-Bl0gs'

const CONTACT = [
  { label: 'email', href: 'mailto:official.swastic@gmail.com' },
  { label: 'github', href: 'https://github.com/SWASTIC-7' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/swastic-keshari-77418827a/' },
  { label: 'x', href: 'https://x.com/Sw4sy__' },
  { label: 'blog', href: `${BLOG}/` },
]

/** Converged points out of 800 stressed operating points, IEEE 300-bus (github.com/SWASTIC-7/PDL). */
const CONVERGENCE = [
  { label: 'Flat start', n: 69 },
  { label: 'DC power-flow warm start', n: 69 },
  { label: 'Neural net (MSE) warm start', n: 39 },
  { label: 'This work', n: 618, ours: true },
]

function Ext({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <span className="cv-ul-link">
        <T>{children}</T>
      </span>
    </a>
  )
}

export default function CV() {
  return (
    <>
      <section className="cv-sec" id="research">
        <h2 className="rv">
          <T>Research</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <T>Undergraduate Research Assistant, P²-lab</T>
              </h3>
              <span className="cv-when">
                <T>Sep 2025 – present</T>
              </span>
            </div>
            <p className="cv-sub">
              <T>Advisor: Prof. Parikshit Pareek, IIT Roorkee</T>
            </p>
            <ul className="cv-ul">
              <li>
                <T>*LLM inference*: inference optimization and scalable model serving, through model-level optimization and GPU kernel optimization.</T>
              </li>
              <li>
                <T>*Deterministic document parsing*: methods that turn unstructured PDF documents into structured, machine-readable data.</T>
              </li>
              <li>
                <T>Built an ML pipeline for vulnerability assessment of digital electrical devices: *85% recall* on devices with advisories filed, 50% on those without.</T>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="publication">
        <h2 className="rv">
          <T>Publication</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <T>Label-Free Warm-Start Learning for Newton–Raphson Power Flow</T>
              </h3>
              <span className="cv-when">
                <T>Accepted, NPSC 2026</T>
              </span>
            </div>
            <p className="cv-sub">
              <T>Swastic Keshari, Naman Meena, Prof. Parikshit Pareek</T>
            </p>
            <ul className="cv-ul">
              <li>
                <T>A *label-free warm start* for Newton–Raphson power flow, trained with a self-supervised primal-dual objective.</T>
              </li>
              <li>
                <T>A *physics-biased graph attention network*: attention is hard-masked to the Ybus sparsity pattern and biased by normalized admittance magnitudes, with the constraints as a guide.</T>
              </li>
              <li>
                <T>Raised convergence on stressed PGLIB-OPF points from *37% to 86%* (EPRI 39-bus) and from *9% to 77%* (IEEE 300-bus), with 20% lower solve time and fewer iterations.</T>
              </li>
            </ul>
            <div
              className="cv-chart rvb"
              role="img"
              aria-label="Bar chart: converged test points out of 800 on the IEEE 300-bus case. Flat start 69, DC power flow warm start 69, neural network with MSE loss 39, this work 618."
            >
              <h4>Converged points out of 800 stressed operating points, IEEE 300-bus</h4>
              {CONVERGENCE.map((b) => (
                <div key={b.label} className={`cv-bar${b.ours ? ' ours' : ''}`}>
                  <span className="lbl">{b.label}</span>
                  <span className="track">
                    <span className="fill" style={{ width: `${((b.n / 800) * 100).toFixed(2)}%` }} />
                  </span>
                  <span>{b.n} / 800</span>
                </div>
              ))}
              <p>Counts from the project’s result charts (github.com/SWASTIC-7/PDL).</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="experience">
        <h2 className="rv">
          <T>Experience</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <T>Elimentary</T>{' '}
                <span className="cv-when">
                  <T>/ Applied AI Intern</T>
                </span>
              </h3>
              <span className="cv-when">
                <T>May 2026 – Jul 2026</T>
              </span>
            </div>
            <ul className="cv-ul">
              <li>
                <T>Deployed a production reconciliation agent for financial documents and cut its inference time from roughly *30 minutes to 2 minutes* at 95%+ accuracy.</T>
              </li>
              <li>
                <T>Deployed an extraction agent that pulls key-value data from unstructured PDFs into structured output: *2x the fill rate* of competing products and 95%+ accuracy on extracted values.</T>
              </li>
              <li>
                <T>Built a sidecar API stress and load-testing framework that pushes every metric to a single Grafana dashboard.</T>
              </li>
              <li>
                <T>Deployed an onboarding agent that provisions role-scoped access to GitHub, email, Pritunl and Google Workspace.</T>
              </li>
            </ul>
          </div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <T>Eazeplace</T>{' '}
                <span className="cv-when">
                  <T>/ Full Stack Intern</T>
                </span>
              </h3>
              <span className="cv-when">
                <T>Jun 2024 – Jul 2024</T>
              </span>
            </div>
            <ul className="cv-ul">
              <li>
                <T>Designed and maintained backend APIs in Node.js, improving data flow and stability for *2,000+ users*.</T>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="projects">
        <h2 className="rv">
          <T>Projects</T>
          <small>
            <T>built from scratch, then optimized</T>
          </small>
        </h2>
        <div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <Ext href="https://github.com/SWASTIC-7/bare_NN">bare_NN</Ext>
              </h3>
              <span className="cv-when">
                <T>CUDA, PTX</T>
              </span>
            </div>
            <p className="cv-sub">
              <T>Neural-network primitives in hand-written GPU assembly</T>
            </p>
            <ul className="cv-ul">
              <li>
                <T>Implemented neural-network primitives directly in *NVIDIA PTX* (vector operations, matrix multiplication, activations, reductions, gradients) to study low-level GPU execution and memory behaviour.</T>
              </li>
              <li>
                <T>Wrote the CUDA C host layer that launches the PTX kernels, manages GPU memory and synchronizes computation.</T>
              </li>
            </ul>
          </div>

          <div className="rv cv-item">
            <div className="cv-split">
              <div>
                <div className="cv-head">
                  <h3>
                    <Ext href="https://github.com/SWASTIC-7/HexE">0xHexE</Ext>
                  </h3>
                  <span className="cv-when">
                    <T>Rust, Ratatui / ACM</T>
                  </span>
                </div>
                <p className="cv-sub">
                  <T>A complete SIC/XE toolchain</T>
                </p>
                <ul className="cv-ul">
                  <li>
                    <T>Two-pass assembler, linker, loader, disassembler, simulator and a *TUI debugger*.</T>
                  </li>
                  <li>
                    <T>Lexing, parsing, object generation and a step-by-step execution simulator in Rust.</T>
                  </li>
                  <li>
                    <T>*All SIC/XE instruction formats*, with PC-relative, base, immediate, indirect and indexed addressing.</T>
                  </li>
                </ul>
              </div>
              <figure className="cv-fig r cv-noprint rvb">
                <img
                  src="/cv/hexe-debugger.jpg"
                  alt="The 0xHexE terminal debugger showing registers, disassembly, object code and a memory dump"
                  width={900}
                  height={693}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>The TUI debugger: registers, disassembly, symbol table, memory.</figcaption>
              </figure>
            </div>
            <ul className="cv-ul flush">
              <li>
                <T>Linking loader: object records, control sections and address relocation across separately assembled modules.</T>
              </li>
            </ul>
          </div>

          <div className="rv cv-item">
            <div className="cv-split">
              <div>
                <div className="cv-head">
                  <h3>
                    <Ext href="https://github.com/SWASTIC-7/Nyx">Nyx</Ext>
                  </h3>
                  <span className="cv-when">
                    <T>NASM, x86 assembly / ACM</T>
                  </span>
                </div>
                <p className="cv-sub">
                  <T>An x86 bootloader from scratch</T>
                </p>
                <ul className="cv-ul">
                  <li>
                    <T>Custom bootloader in NASM with FAT12 loading, sector reads and a minimal boot UI.</T>
                  </li>
                  <li>
                    <T>Takes the CPU from *real mode to 32-bit protected mode*: A20 gate, E820 memory map, GDT, far jump, then a Multiboot handoff to kernels and splash screens.</T>
                  </li>
                </ul>
              </div>
              <figure className="cv-fig cv-noprint rvb">
                <img src="/cv/nyx-boot.jpg" alt="The Nyx boot menu listing two kernels to boot" width={720} height={512} loading="lazy" decoding="async" />
                <figcaption>The Nyx boot menu, read from NYX.CFG.</figcaption>
              </figure>
            </div>
            <ul className="cv-ul flush">
              <li>
                <T>Two-stage loader: a *512-byte MBR stage* pulls stage 2 over LBA (int 13h, AH=42h), auto-detects FAT12/FAT32 and reads a NYX.CFG-driven boot menu.</T>
              </li>
            </ul>
          </div>

          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <Ext href="https://github.com/SWASTIC-7/0xtcp">0xtcp</Ext>
              </h3>
              <span className="cv-when">
                <T>Rust / ACM</T>
              </span>
            </div>
            <p className="cv-sub">
              <T>TCP from the RFC</T>
            </p>
            <ul className="cv-ul">
              <li>
                <T>Implemented *TCP from RFC 793* in Rust over a TUN interface, with IP/TCP parsing and the three-way handshake.</T>
              </li>
              <li>
                <T>Built a lightweight packet sniffer and state machine for reliable, protocol-accurate data transfer.</T>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="writing">
        <h2 className="rv">
          <T>Writing</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <Ext href={`${BLOG}/handwriting-ptx-for-matrix-multiplication`}>Handwriting PTX for matrix multiplication</Ext>
              </h3>
              <span className="cv-when">
                <a href={`${BLOG}/handwriting-ptx-for-matrix-multiplication`} target="_blank" rel="noopener noreferrer">
                  <span className="cv-ul-link">
                    <T>part 1</T>
                  </span>
                </a>
                {', '}
                <a href={`${BLOG}/handwriting-ptx-for-matrix-multiplication-part-2`} target="_blank" rel="noopener noreferrer">
                  <span className="cv-ul-link">
                    <T>part 2</T>
                  </span>
                </a>
              </span>
            </div>
            <ul className="cv-ul">
              <li>
                <T>GEMM (general matrix multiply) *written in PTX*, covering block tiling, warp tiling, thread tiling, vectorized loads and double buffering.</T>
              </li>
            </ul>
          </div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <Ext href={`${BLOG}/before-the-operating-system-booting-nyx`}>Before the Operating System: Booting Nyx</Ext>
              </h3>
              <span className="cv-when">
                <T>blog</T>
              </span>
            </div>
            <ul className="cv-ul">
              <li>
                <T>The path Nyx takes: a *512-byte first stage*, the switch from real mode to 32-bit protected mode, and loading a kernel from FAT12 or FAT32.</T>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="achievements">
        <h2 className="rv">
          <T>Achievements</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <ul className="cv-ul flush">
              <li>
                <T>*1st place*, Syntax Error Hackathon (800+ participants).</T>
              </li>
              <li>
                <T>*1st place*, Mira Hackathon, AI track (200+ participants).</T>
              </li>
              <li>
                <T>*3rd place*, WinterHack CTF, IIT Roorkee’s annual infosec competition, solving binary-exploitation problems.</T>
              </li>
              <li>
                <T>Represented IIT Roorkee at the DSCI National CTF by EY.</T>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="teaching">
        <h2 className="rv">
          <T>Teaching and leadership</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <T>Undergraduate Teaching Assistant, C++</T>
              </h3>
              <span className="cv-when">
                <T>EEC 101</T>
              </span>
            </div>
            <p className="cv-sub">
              <T>Under Prof. Subhash Chand Yogi</T>
            </p>
            <ul className="cv-ul">
              <li>
                <T>Mentored newly enrolled first-year students in C++ programming through the semester.</T>
              </li>
            </ul>
          </div>
          <div className="rv cv-item">
            <div className="cv-head">
              <h3>
                <T>E-Summit, IIT Roorkee</T>
              </h3>
              <span className="cv-when">
                <T>Tech Head and Marketing</T>
              </span>
            </div>
            <ul className="cv-ul">
              <li>
                <T>Built and deployed the official E-Summit website, handling traffic from *2,100+ participants*.</T>
              </li>
              <li>
                <T>Coordinated sponsor deliverables and event integrations.</T>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="skills">
        <h2 className="rv">
          <T>Skills</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <dl className="cv-kv">
              <dt>
                <T>Languages</T>
              </dt>
              <dd>
                <T>C++, Python, Rust, CUDA, PTX, Assembly, Solidity, JavaScript, HTML, CSS</T>
              </dd>
              <dt>
                <T>ML and GPU</T>
              </dt>
              <dd>
                <T>PyTorch, transformers, NumPy, pandas, LangChain, Nsight</T>
              </dd>
              <dt>
                <T>Systems</T>
              </dt>
              <dd>
                <T>Docker, eBPF, GDB, Wireshark, Pwntools, IDA, LibAFL</T>
              </dd>
              <dt>
                <T>Web and chain</T>
              </dt>
              <dd>
                <T>React, Node.js, Hardhat, Foundry</T>
              </dd>
              <dt>
                <T>Spoken</T>
              </dt>
              <dd>
                <T>Hindi, English</T>
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="education">
        <h2 className="rv">
          <T>Education</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <div className="cv-edu">
              <span>
                <T>B.Tech, Indian Institute of Technology Roorkee</T>
              </span>
              <span>
                <T>2023 – 2027</T>
              </span>
              <span>
                <T>CGPA 7.77 / 10</T>
              </span>
              <span>
                <T>ICSE Class XII, St. Joseph’s College</T>
              </span>
              <span>
                <T>2022</T>
              </span>
              <span>
                <T>94.00%</T>
              </span>
              <span>
                <T>ICSE Class X, St. Joseph’s College</T>
              </span>
              <span>
                <T>2020</T>
              </span>
              <span>
                <T>98.00%</T>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-sec" id="contact">
        <h2 className="rv">
          <T>Contact</T>
        </h2>
        <div>
          <div className="rv cv-item">
            <p className="cv-cta">
              <T>Building something where speed matters? Write to me.</T>
            </p>
            <ul className="cv-contact">
              {CONTACT.map((c) => (
                <li key={c.label}>
                  <a href={c.href} {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <span className="cv-ul-on">
                      <T>{c.label}</T>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
