import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import os from 'os';

// Escape LaTeX special characters
// NEVER include university or institution name — [Company] placeholder is intentional bias prevention
export function escTex(str: string): string {
  if (!str) return '';
  return str.replace(/[&%$#_{}~^\\]/g, (m) => '\\' + m);
}

export function buildLatex(profile: any): string {
  const name = escTex(profile.user?.name || profile.name || '');
  const email = escTex(profile.displayEmail || profile.user?.displayEmail || '');
  const github = escTex(profile.links?.github || '');
  const portfolio = escTex(profile.links?.portfolio || '');
  const linkedin = escTex(profile.links?.linkedin || '');
  const skills = escTex((profile.skills || []).join(', '));

  const projects = (profile.projects || [])
    .map(
      (p: any) => `
    \\resumeProjectHeading
      {\\textbf{${escTex(p.title)}} $|$ \\emph{${escTex((p.tech || []).join(', '))}}}{}
    \\resumeItemListStart
      \\resumeItem{${escTex(p.description)}}
    \\resumeItemListEnd`
    )
    .join('');

  // Company name is replaced with [Company] — intentional bias prevention
  const experience = (profile.experience || [])
    .map(
      (e: any) => `
    \\resumeSubheading
      {${escTex(e.role)}}{${escTex(e.dates || '')}}
      {[Company]}{}
    \\resumeItemListStart
${(e.bullets || []).map((b: string) => `      \\resumeItem{${escTex(b)}}`).join('\n')}
    \\resumeItemListEnd`
    )
    .join('');

  const education = (profile.education || [])
    .map(
      (e: any) => `
    \\resumeSubheading
      {${escTex(e.field)}}{} 
      {${escTex(e.degree)}${e.gpa ? `, GPA: ${escTex(e.gpa)}` : ''}}{}`
    )
    .join('');

  return `%-------------------------
% Jake's Resume Template — InternMe Edition
%-------------------------
\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    {\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small ${email}${github ? ` $|$ \\href{${github}}{GitHub}` : ''}${portfolio ? ` $|$ \\href{${portfolio}}{Portfolio}` : ''}${linkedin ? ` $|$ \\href{${linkedin}}{LinkedIn}` : ''}
\\end{center}

${skills ? `%-----------SKILLS-----------
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{${skills}}}
\\end{itemize}` : ''}

${projects ? `%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
${projects}
  \\resumeSubHeadingListEnd` : ''}

${experience ? `%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${experience}
  \\resumeSubHeadingListEnd` : ''}

${education ? `%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${education}
  \\resumeSubHeadingListEnd` : ''}

\\end{document}
`;
}

export async function generatePdf(profile: any): Promise<Buffer> {
  const id = uuid();
  const tmpDir = os.platform() === 'win32'
    ? path.join(process.env.TEMP || 'C:\\Temp', `cv-${id}`)
    : `/tmp/cv-${id}`;

  await fs.mkdir(tmpDir, { recursive: true });

  const texPath = path.join(tmpDir, 'resume.tex');
  await fs.writeFile(texPath, buildLatex(profile), 'utf8');

  await new Promise<void>((resolve, reject) => {
    exec(
      `pdflatex -interaction=nonstopmode -output-directory="${tmpDir}" "${texPath}"`,
      { timeout: 30000 },
      (err, _stdout, stderr) => {
        if (err) reject(new Error(stderr || 'LaTeX compilation failed'));
        else resolve();
      }
    );
  });

  const pdfPath = path.join(tmpDir, 'resume.pdf');
  const pdfBuffer = await fs.readFile(pdfPath);

  // Cleanup temp files
  await fs.rm(tmpDir, { recursive: true, force: true });

  return pdfBuffer;
}
