# Frequently Asked Questions (FAQ)

Common questions about SK8 and their answers.

## Table of Contents

- [General Questions](#general-questions)
- [Technical Questions](#technical-questions)
- [Comparison to Other Tools](#comparison-to-other-tools)
- [Features and Roadmap](#features-and-roadmap)
- [License and Usage](#license-and-usage)
- [Contributing](#contributing)

---

## General Questions

### What is SK8?

SK8 is a multimedia authoring environment for creating interactive applications. It combines:
- Visual development tools (drag-and-drop editor)
- Prototype-based object system
- Natural-language scripting (SK8Script)
- Animation and media support
- Cross-platform web deployment

Originally developed at Apple Research Labs in the 1990s, this is a modern TypeScript reimplementation for the web.

### Who is SK8 for?

**Beginners:**
- Learn programming with natural-language scripts
- Create interactive applications visually
- Build games and multimedia projects

**Educators:**
- Teach programming concepts
- Create interactive lessons
- Demonstrate algorithms visually

**Developers:**
- Rapid prototyping
- Interactive data visualization
- Creative coding projects
- Educational software

### Is SK8 free?

Yes! SK8 is open source. The TypeScript port is free to use for any purpose (see license details).

### How is modern SK8 different from the original?

**Same:**
- Prototype-based object model
- Actor/Stage architecture
- Natural-language scripting philosophy
- Visual development approach

**Different:**
- TypeScript instead of Common Lisp
- HTML5 Canvas instead of QuickDraw
- Browser-based instead of Mac-only
- Modern web technologies (ES6, modules, etc.)
- No resource forks (uses JSON projects)

### Do I need to know programming?

Not necessarily! SK8 is designed to be accessible to beginners:
- Use the visual IDE to create applications without code
- SK8Script uses natural language (easier than JavaScript/Python)
- Start visually, add scripting as you learn

However, basic programming concepts (variables, loops, functions) will help.

---

## Technical Questions

### What browsers are supported?

SK8 works in all modern browsers:
- **Chrome** 90+ ✅
- **Firefox** 88+ ✅
- **Safari** 14+ ✅
- **Edge** 90+ ✅

Requires:
- HTML5 Canvas support
- ES6 module support
- Modern JavaScript features

Not supported:
- Internet Explorer (any version)
- Very old mobile browsers

### Can I use SK8 on mobile/tablet?

**Viewing:** Yes, SK8 applications run on mobile browsers.

**Development:** Limited. The visual IDE is designed for desktop with mouse input. Touch support for the editor is planned but not yet implemented.

**Deploying:** SK8 apps deploy as standard web pages, so they work on any device with a modern browser.

### How do I deploy SK8 applications?

SK8 applications are just HTML/JavaScript:

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder to:**
   - **GitHub Pages**: Free hosting for static sites
   - **Netlify**: Free tier with easy deployment
   - **Any web host**: Upload via FTP/SSH
   - **Electron**: Package as desktop app

3. **Share the URL** with users!

### Does SK8 work offline?

**Development:** Requires Node.js for build tools, but doesn't need internet once installed.

**Running:** SK8 apps can work offline if you:
- Use service workers for caching
- Bundle all assets
- Don't rely on external APIs

### Can I integrate SK8 with other frameworks?

**Yes!** SK8 is just TypeScript/JavaScript:

```javascript
// Use in React
import { SK8Stage } from 'sk8-ts';

function MyComponent() {
    const canvasRef = useRef();

    useEffect(() => {
        const stage = new SK8Stage(canvasRef.current);
        // ... setup SK8 content
    }, []);

    return <canvas ref={canvasRef} />;
}

// Use in Vue
// Use in vanilla JavaScript
// Use in any framework!
```

### How do I save/load projects?

SK8 projects save as JSON files (`.sk8json`):

```javascript
// Save
const json = serializeProject(project);
localStorage.setItem('myProject', json);

// Load
const json = localStorage.getItem('myProject');
const project = deserializeProject(json);
```

See [Project Management Guide](PROJECTS.md) for details.

---

## Comparison to Other Tools

### SK8 vs. Scratch

**Similarities:**
- Visual programming for beginners
- Drag-and-drop interface
- Educational focus
- Interactive multimedia

**Differences:**
- **SK8:** Text-based scripting with natural language; prototype-based objects; targets web deployment
- **Scratch:** Block-based visual programming; simpler for youngest learners; browser-based IDE

**Choose SK8 if:** You want to transition from visual to text-based programming, need more flexibility, or want to deploy to the web.

**Choose Scratch if:** Working with very young learners (< 8 years) who aren't ready for text-based code.

### SK8 vs. Processing/p5.js

**Similarities:**
- Creative coding
- Canvas-based graphics
- Animation support
- Beginner-friendly

**Differences:**
- **SK8:** Object-oriented actors, visual IDE, natural-language scripting, multimedia focus
- **Processing/p5.js:** Procedural drawing functions, code-only (no visual IDE), established community

**Choose SK8 if:** You prefer object-oriented design, want a visual IDE, or like natural-language syntax.

**Choose p5.js if:** You prefer procedural code, want a huge community/library ecosystem, or are focused on generative art.

### SK8 vs. Unity

**Similarities:**
- Visual editor
- Component-based architecture
- Animation tools
- Game development

**Differences:**
- **SK8:** 2D-focused, lightweight, web-native, scripted with SK8Script
- **Unity:** 3D-focused, heavyweight, multi-platform (but complex web export), scripted with C#

**Choose SK8 if:** Building 2D web applications, want lightweight deployment, prefer simpler workflow.

**Choose Unity if:** Need 3D graphics, advanced physics, mobile/console deployment, professional game development.

### SK8 vs. Adobe Animate

**Similarities:**
- Timeline-based animation
- Visual authoring
- Interactive multimedia
- Web export

**Differences:**
- **SK8:** Open source, code-centric with visual tools, prototype-based programming
- **Animate:** Commercial, designer-centric, ActionScript/JavaScript, professional animation tools

**Choose SK8 if:** You want open-source tools, prefer coding, or need educational features.

**Choose Animate if:** You're a professional animator, need advanced vector tools, or work in a production pipeline.

---

## Features and Roadmap

### What features are currently available?

**Available now (v0.4.x):**
- ✅ Core object system (SK8Object, actors, stages)
- ✅ Basic and advanced shapes
- ✅ Animation system with easing
- ✅ Collection classes (List, Table)
- ✅ SK8Script parser and evaluator
- ✅ Standard library (128+ functions)
- ✅ Visual IDE foundation
- ✅ Property inspector
- ✅ Object tree
- ✅ Selection and manipulation tools
- ✅ Project save/load (JSON format)
- ✅ Media support (images, video, audio)
- ✅ UI components (buttons, sliders, etc.)

### What's coming next?

**Planned (Short term):**
- Timeline visual editor
- More UI components
- Improved SK8Script IDE
- Component library/templates
- Better mobile/touch support

**Planned (Long term):**
- Collaborative editing
- Plugin system
- WebGL renderer
- Advanced physics
- 3D support (maybe!)

### Can I request features?

Yes! Open an issue on GitHub:
1. Check if feature already requested
2. Describe the use case
3. Explain why it's valuable
4. Provide examples if possible

### Is SK8Script complete?

**Core language:** Yes, fully functional

**Standard library:** 128 functions covering:
- Math
- Strings
- Collections
- Type checking
- I/O
- Object manipulation

**Planned additions:**
- More built-in functions
- Better error messages
- Debugger integration
- Performance improvements

---

## License and Usage

### What license is SK8 under?

The original SK8 is under the SK8 License (see `sk8_license.pdf`).

The TypeScript port is provided as-is for educational and historical preservation purposes.

### Can I use SK8 commercially?

**For applications you create:** Yes! Build and sell applications made with SK8.

**For the SK8 software itself:** See the license files. The TypeScript port is open source.

### Can I modify SK8?

Yes! SK8 is open source. You can:
- Fork the repository
- Modify the code
- Submit pull requests
- Create custom builds

### Do I need to credit SK8?

**Not required, but appreciated:**
- Credit the SK8 project
- Link to the repository
- Share improvements back to the community

---

## Contributing

### How can I contribute?

**Code:**
- Fix bugs
- Implement features
- Improve performance
- Write tests

**Documentation:**
- Improve guides
- Create tutorials
- Write examples
- Translate to other languages

**Community:**
- Answer questions
- Report bugs
- Share your projects
- Write blog posts/videos

### How do I report bugs?

1. Check if bug already reported
2. Create minimal reproduction
3. Open GitHub issue with:
   - SK8 version
   - Browser/OS
   - Steps to reproduce
   - Expected vs. actual behavior
   - Code example

See [Troubleshooting](TROUBLESHOOTING.md) for details.

### How do I submit code?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit pull request

Follow the coding style and conventions used in the project.

### Where can I chat with other users?

- **GitHub Discussions**: Questions and ideas
- **Issues**: Bug reports and feature requests
- **Discord/Slack**: (Coming soon!)

---

## Still Have Questions?

- **Documentation**: Check the [docs folder](../README.md)
- **Guides**: [Getting Started](GETTING_STARTED.md)
- **Troubleshooting**: [Common issues](TROUBLESHOOTING.md)
- **GitHub**: [Open an issue](https://github.com/yourname/sk8-typescript)

Happy SK8ing!
