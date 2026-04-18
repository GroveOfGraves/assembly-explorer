# Assembly Explorer: x86-64 vs ARM64

**Live Demo:** [https://groveofgraves.github.io/assembly-explorer/](https://groveofgraves.github.io/assembly-explorer/)

An interactive, client-side educational tool for comparing x86-64 and ARM64 (AArch64) assembly instructions side-by-side. 

Created by **Gavin Montgomery**.

## Features
- **Side-by-Side Comparison:** Instantly compare equivalent instructions, memory operations, and math logic across both architectures.
- **Dynamic Syntax Visualization:** Code blocks automatically scale and format to fit the instruction examples.
- **Cheat Sheet Integration:** Quick access to official instruction set manuals and reference PDFs directly from the UI.
- **100% Client-Side:** Built purely with HTML, CSS, and Vanilla JavaScript. No backend or database required, allowing it to be hosted perfectly as a static site.

## Files
- `index.html`: The main entry point and UI layout.
- `app.js`: Application logic, DOM manipulation, and dynamic visual scaling.
- `data.js`: The dataset containing the instruction dictionaries, mapping x86-64 concepts directly to AArch64.
- `widget-shell.js` / CSS resources: Supporting UI framework components.

## AI Integration & Experience (Disclosure)
*This section outlines the use of AI/LLMs in developing this project.*

**Personal Contributions:** I independently researched and located the assembly cheat sheets, devised the categories I wished to represent, and formulated the high-level examples and one-to-one correlations between x86-64 and ARM64. 

**AI Assistance (Gemini / Copilot):**
- **Initial Prototyping:** I initially asked Gemini to help me visualize my compiled data, which generated the original version of this web app in a small, widgetized form. 
- **Refactoring & Optimization:** I copied the raw HTML of that widget and broke it down into more efficient, modular pieces. I used AI assistance during this process to strip out unnecessary JavaScript and isolate the application logic.
- **UI & Bug Fixes:** I utilized AI as a coding assistant to help resolve JavaScript bugs (such as state issues with the dropdown menus when expanding datasets), to dynamically scale the UI canvas to fit different sized code examples, and to polish the final styling and layout of the page.

Overall, the AI was highly effective for generating boilerplate UI and troubleshooting JavaScript DOM issues, while the core educational content, data structing, and project direction were driven by my own research.