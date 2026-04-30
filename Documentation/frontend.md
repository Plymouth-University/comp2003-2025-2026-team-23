The frontend server is an nginx web server containerised in Docker. It serves a Single-Page Application. The server and the page are in SourceCode/frontend.

# Files
- app.js - Instantiates all feature managers, performs server ping on startup, exposes global peelbackApp instance, wires all modules together.
- index.html - Application shell & layout
- settings.js - Exports backend API base URL (http://localhost:3000/api); single source of truth for environment config
- features/upload.js - Drag-and-drop and click-to-upload; validates file type (PDF/DOCX) and size (max 10MB); updates upload box UI; dispatches fileUploaded / fileUploadReset events
- features/controls.js - Manages the three audience cards (Patient, Clinician, Policy) and the 1–5 complexity slider; dispatches audienceChanged / complexityChanged events; supports programmatic reset
- features/processing.js - Enables/disables the Process button based on input state; drives the full processing flow (progress bar, API call, result display, input panel reset); clears output cleanly between runs
- features/request.js - Backend connectivity ping; builds and sends FormData POST to /api/prompt with file, audience, complexity, and task type; validates and returns the parsed response
- features/results.js - Manages three tabs: editable Result view, PDF export (print-based), and Plain Text export (clipboard copy); strips editing UI for clean exports
- features/blocks.js - Renders 9 typed content blocks (title, author, summary, stats, etc.) into a 2-column grid; custom pointer-event drag-and-drop reordering; click-to-edit with auto-save; full undo/redo/clear-all-changes stack; block removal with animation
- features/history.js - Saves processed documents to localStorage (up to 20 entries); stores both live and original block snapshots per entry; renders the history sidebar list; loads past entries back into the editor with audience/complexity restored
- assets/styles - Folder containing all CSS files
