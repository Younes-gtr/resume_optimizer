from app.schemas.personal_info_schema import PersonalInfo
from app.schemas.resume_schema import Education, Experience, Language, Project, ResumeResponse, SkillCategory, TaggedItem

_SPECIAL_CHARS = str.maketrans(
    {
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
        "\\": r"\textbackslash{}",
    }
)

def _esc(text: str | None) -> str:
    if not text:
        return ""
    return text.translate(_SPECIAL_CHARS)


def _date_range(start: str, end: str | None, current: bool = False) -> str:
    end_str = "Present" if current or not end else _esc(end)
    return f"{_esc(start)} -- {end_str}"


def _header_block(info: PersonalInfo) -> str:
    items: list[str] = []
    if info.location:
        items.append(
            f"\\mbox{{{{\\color{{black}}\\footnotesize\\faMapMarker*}}\\hspace*{{0.13cm}}{_esc(info.location)}}}%"
        )
    if info.email:
        items.append(
            f"\\mbox{{\\hrefWithoutArrow{{mailto:{_esc(info.email)}}}{{\\color{{black}}{{\\footnotesize\\faEnvelope[regular]}}\\hspace*{{0.13cm}}{_esc(info.email)}}}}}%"
        )
    if info.phone:
        items.append(
            f"\\mbox{{\\hrefWithoutArrow{{tel:{_esc(info.phone)}}}{{\\color{{black}}{{\\footnotesize\\faPhone*}}\\hspace*{{0.13cm}}{_esc(info.phone)}}}}}%"
        )
    if info.linkedin:
        items.append(
            f"\\mbox{{\\href{{{_esc(info.linkedin)}}}{{\\color{{black}}{{\\footnotesize\\faLinkedin}}\\hspace*{{0.13cm}}LinkedIn}}}}%"
        )
    separator = "\n        \\kern 0.25 cm%\n        \\AND%\n        \\kern 0.25 cm%\n        "
    contact_line = separator.join(items)

    return f"""    \\begin{{header}}
    \\vspace*{{-1.45cm}}
        \\textbf{{\\fontsize{{24 pt}}{{24 pt}}\\selectfont\\textcolor{{bleunuit}}{{{_esc(info.full_name)}}}}}

        \\vspace{{0.3 cm}}

        \\normalsize
        {contact_line}
    \\end{{header}}"""


def _education_block(edu: Education) -> str:
    date = _date_range(edu.start_date, edu.end_date)
    field_line = f"\\\\\n    \\textit{{{_esc(edu.field)}}}" if edu.field else ""
    return f"""\\begin{{twocolentry}}{{\\textit{{{date}}}}}
    \\textbf{{{_esc(edu.institution)}}}{field_line} \\\\
    \\textit{{{_esc(edu.degree)}}}
\\end{{twocolentry}}
"""


def _experience_block(exp: Experience) -> str:
    location_line = f"\\textit{{{_esc(exp.location)}}} \\\\\n" if exp.location else ""
    date = _date_range(exp.start_date, exp.end_date, exp.current)
    highlights = "\n".join(f"        \\item {_esc(line)}" for line in exp.description)
    return f"""\\begin{{twocolentry}}{{{location_line}\\textit{{{date}}}}}
    \\textbf{{{_esc(exp.title)}}} \\\\
    \\textit{{{_esc(exp.company)}}}
\\end{{twocolentry}}

\\vspace{{0.10cm}}
\\begin{{onecolentry}}
    \\begin{{highlights}}
{highlights}
    \\end{{highlights}}
\\end{{onecolentry}}
"""


def _project_block(proj: Project) -> str:
    tech_line = ""
    if proj.show_technologies and proj.technologies:
        tech_str = ", ".join(_esc(t) for t in proj.technologies)
        tech_line = f"\n        \\item \\textbf{{Technologies:}} {tech_str}"
    url_line = f"\n        \\item \\href{{{_esc(proj.url)}}}{{}}" if proj.url else ""
    return f"""\\begin{{twocolentry}}{{}}
    \\textbf{{{_esc(proj.name)}}}
\\end{{twocolentry}}

\\vspace{{0.10cm}}
\\begin{{onecolentry}}
    \\begin{{highlights}}
        \\item {_esc(proj.description)}{tech_line}{url_line}
    \\end{{highlights}}
\\end{{onecolentry}}
"""


def _languages_line(languages: list[Language]) -> str:
    parts = [f"{_esc(l.language)} ({_esc(l.level)})" if l.level else _esc(l.language) for l in languages]
    return ", ".join(parts)


def _tagged_line(items: list[TaggedItem]) -> str:
    return ", ".join(_esc(item.value) for item in items)


def _skills_block(categories: list[SkillCategory]) -> str:
    lines = [
        f"""\\begin{{onecolentry}}
    \\textbf{{{_esc(c.category)}:}} {_tagged_line(c.skills)}
\\end{{onecolentry}}"""
        for c in categories
        if c.skills
    ]
    return "\n\n\\vspace{0.2 cm}\n\n".join(lines)


def generate_latex(resume: ResumeResponse, personal_info: PersonalInfo) -> str:
    header = _header_block(personal_info)
    education_blocks = "\n\\vspace{0.3cm}\n".join(_education_block(e) for e in resume.education)
    experience_blocks = "\n\\vspace{0.3cm}\n".join(_experience_block(e) for e in resume.experiences)
    project_blocks = "\n\\vspace{0.3cm}\n".join(_project_block(p) for p in resume.projects)
    skills_block = _skills_block(resume.skills)
    languages_line = _languages_line(resume.languages)
    interests_line = _tagged_line(resume.interests)

    return r"""\documentclass[10pt, letterpaper]{article}
\usepackage[dvipsnames]{xcolor}
\definecolor{bleunuit}{RGB}{25, 25, 112}

\usepackage{titlesec}
\titleformat{\section}
  {\color{bleunuit}\normalfont\Large\bfseries}
  {\thesection}{1em}{}

\usepackage[most]{tcolorbox}
\usepackage[
    ignoreheadfoot,
    top=2 cm,
    bottom=1.9 cm,
    left=2 cm,
    right=2 cm,
    footskip=1.0 cm,
]{geometry}
\usepackage{titlesec}
\usepackage{tabularx}
\usepackage{array}
\definecolor{primaryColor}{RGB}{0, 79, 144}
\usepackage{enumitem}
\usepackage{fontawesome5}
\usepackage{amsmath}
\usepackage[
    colorlinks=true,
    urlcolor=primaryColor
]{hyperref}
\usepackage[pscoord]{eso-pic}
\usepackage{calc}
\usepackage{bookmark}
\usepackage{lastpage}
\usepackage{changepage}
\usepackage{paracol}
\usepackage{ifthen}
\usepackage{needspace}
\usepackage{iftex}
\usepackage{ragged2e}

\ifPDFTeX
    \input{glyphtounicode}
    \pdfgentounicode=1
    \usepackage[utf8]{inputenc}
    \usepackage{lmodern}
\fi

\AtBeginEnvironment{adjustwidth}{\partopsep0pt}
\pagestyle{empty}
\setcounter{secnumdepth}{0}
\setlength{\parindent}{0pt}
\setlength{\topskip}{0pt}
\setlength{\columnsep}{0cm}
\makeatletter
\let\ps@customFooterStyle\ps@plain
\patchcmd{\ps@customFooterStyle}{\thepage}{\color{gray}\textit{}}{}{}
\makeatother
\pagestyle{customFooterStyle}

\titleformat{\section}{\needspace{4\baselineskip}\color{bleunuit}\bfseries\large}{}{0pt}{}[\vspace{1pt}\titlerule]
\titlespacing{\section}{-1pt}{0.3 cm}{0.2 cm}

\renewcommand\labelitemi{$\circ$}
\newenvironment{highlights}{
    \begin{itemize}[topsep=0.10 cm,parsep=0.10 cm,partopsep=0pt,itemsep=0pt,leftmargin=0.4 cm + 10pt]
}{\end{itemize}}

\newenvironment{highlightsforbulletentries}{
    \begin{itemize}[topsep=0.10 cm,parsep=0.10 cm,partopsep=0pt,itemsep=0pt,leftmargin=10pt]
}{\end{itemize}}

\newenvironment{onecolentry}{
    \begin{adjustwidth}{0.2 cm + 0.00001 cm}{0.2 cm + 0.00001 cm}
}{\end{adjustwidth}}

\newenvironment{twocolentry}[2][]{
    \onecolentry
    \def\secondColumn{#2}
    \setcolumnwidth{\fill, 4.5 cm}
    \begin{paracol}{2}
}{
    \switchcolumn \raggedleft \secondColumn
    \end{paracol}
    \endonecolentry
}

\newenvironment{header}{
    \setlength{\topsep}{0pt}\par\kern\topsep\centering\linespread{1.5}
}{\par\kern\topsep}

\let\hrefWithoutArrow\href
\renewcommand{\href}[2]{\hrefWithoutArrow{#1}{\ifthenelse{\equal{#2}{}}{ }{#2 }\raisebox{.15ex}{\footnotesize \faExternalLink*}}}

\vspace{-300pt}
\begin{document}
    \newcommand{\AND}{\unskip
        \cleaders\copy\ANDbox\hskip\wd\ANDbox
        \ignorespaces
    }
    \newsavebox\ANDbox
    \sbox\ANDbox{}

""" + f"""
{header}

\\vspace{{0.2cm}}
\\begin{{tcolorbox}}[
    colback=gray!5,
    colframe=bleunuit,
    boxrule=0.4pt,
    arc=2mm,
    left=4pt, right=4pt, top=2pt, bottom=2pt,
    fontupper=\\small,
    width=\\linewidth,
    sharp corners=south
]
\\justifying
{_esc(resume.summary)}
\\end{{tcolorbox}}
\\vspace{{-0.1cm}}


\\section{{Education}}
{education_blocks}

\\section{{Professional Experience}}
{experience_blocks}

\\section{{Projects}}
{project_blocks}

\\section{{Technical Skills}}
{skills_block}

\\section{{Languages and Interests}}
\\begin{{onecolentry}}
    \\textbf{{Languages:}} {languages_line}
\\end{{onecolentry}}

\\vspace{{0.2 cm}}

\\begin{{onecolentry}}
    \\textbf{{Interests:}} {interests_line}
\\end{{onecolentry}}

\\end{{document}}
"""
