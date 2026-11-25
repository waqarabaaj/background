# Waqar Command Center — Chrome Homepage & New Tab Extension

A dark cosmic glassmorphic Chrome New Tab extension & personal command center where **every single widget, view, and tool works for real**.

## Features
- **Hero Header**: Dynamic time-of-day greeting, live digital clock & date, custom cosmic mountain backdrop, and live **Open-Meteo Weather** (default Gilgit, Pakistan) with 5-day forecast & city search.
- **Smart Search & Shortcuts**: Direct URL navigation or web search (Google, DuckDuckGo, Perplexity, Bing, YouTube), **real Web Speech voice search**, Google Lens shortcut, and customizable quick links.
- **Today's Focus & Full Tasks Manager**: Synced progress bar, live sidebar badge count, priorities, due dates, and pinning.
- **Pomodoro & Deep Focus Mode**: Accurate non-drifting countdown timer, Web Audio chime, Chrome desktop notifications, and synthesized **Web Audio ambient soundscapes** (Soft Rain, Brown Noise, Cosmic Drone).
- **Calendar & Agenda**: Interactive week strip on Home + full monthly calendar view + `.ics` calendar export.
- **Real System Monitor (3-Tier Live Telemetry)**:
  1. **Windows Companion Server** (`helper/server.mjs`): Streams 100% real Windows **CPU %, RAM %, Disk %, and live Network Up/Down Mbps**.
  2. **Chrome Extension Native APIs**: Automatic fallback using `chrome.system.cpu` & `chrome.system.memory`.
  3. **Browser Sensors + Live Speed Check**: Fallback in standard browser tabs.
- **6 Working Quick Tools**:
  - **Screen Recorder**: Real `getDisplayMedia` + mic audio mixing + `.webm` download
  - **Screenshot / Quick Capture**: Screen/window/tab capture + freehand canvas annotator + copy/download PNG
  - **File Converter**: Local image format conversion (`PNG ↔ JPG ↔ WebP`) + Data conversion (`JSON ↔ YAML ↔ CSV ↔ Base64`)
  - **QR Generator**: URL/Text/Wi-Fi/Email QR codes with custom colors + PNG & SVG download
  - **Text to Speech**: Real Chrome/OS `speechSynthesis` with voice selector, speed, pitch, volume
  - **Unit Converter**: Length, Weight, Temperature, Data, Speed, Time, and **Live Currency FX rates**
- **Real GitHub Activity**: Connect any GitHub username (plus optional PAT for private contributions) to render your real streak, weekly commits, and interactive contribution heatmap.
- **Project Board, Markdown Notes & Bookmarks**: Kanban project board, split-pane Markdown notes editor with `.md` export, colored bookmark folders, and live **Chrome Bookmarks sync**.
- **Real Streaming AI Assistant**: Works with **Google Gemini**, **OpenAI**, **Groq**, **OpenRouter**, or **Local Ollama (free, no key)** with optional Workspace Context injection.

---

## Deploy to GitHub Pages & Set as Chrome Homepage URL (Easiest)

1. Create a new public GitHub repository (e.g. `homepage`) on [github.com/new](https://github.com/new) (leave it empty—no README/gitignore).
2. Push this project to `main`:
   ```powershell
   git remote add origin https://github.com/<your-username>/homepage.git
   git push -u origin main
   ```
3. In your GitHub repo, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
4. Wait ~1 minute for the **Deploy Chrome Homepage to GitHub Pages** workflow to finish. Your live URL will be:
   `https://<your-username>.github.io/homepage/`
5. Set it in Chrome:
   - **Home button**: Chrome **Settings → Appearance → Show home button → Enter custom web address** → paste your GitHub Pages URL.
   - **Startup page**: Chrome **Settings → On startup → Open a specific page or set of pages → Add a new page** → paste your GitHub Pages URL.
   - *(Optional)* To also replace every `Ctrl+T` New Tab with your live GitHub Pages URL, use the unpacked extension below or a lightweight New Tab redirect extension.

---

## Install as Your Real Chrome New Tab Page (Extension Mode)

1. Build the extension (already built in `dist/`):
   ```powershell
   npm install
   npm run build
   ```
2. Open Google Chrome and navigate to **`chrome://extensions`**
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select **`d:\Projects\homepage\dist`**
5. Open a new tab (`Ctrl + T`) — your Command Center opens automatically!

---

## Enable Real Live Windows CPU, RAM, Disk & Network Speeds

Start the zero-dependency local Windows telemetry companion:
- **Run manually**: double-click `helper\start-helper.bat` or run:
  ```powershell
  npm run helper
  ```
- **Auto-start silently when Windows boots**: right-click `helper\install-startup.ps1` → **Run with PowerShell** (or run `powershell -ExecutionPolicy Bypass -File helper\install-startup.ps1`).

> Bonus: While the companion is running, visiting **`http://127.0.0.1:4789`** in Chrome also serves the built dashboard directly, so you can alternatively set `http://127.0.0.1:4789` as your Chrome Homepage!
