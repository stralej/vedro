# Start Page
The Start Page is a project that is supposed to replace your default start/home page in the browser with a modern and minimalistic one. The one when you open your browser or when you open a new tab inside of it.

![Preview screenshot of the project on Desktop](images/preview.jpeg)

## How does it work?
1. The background is either a random image from [Picsum](https://picsum.photos/) or one from your own wallpaper library — switchable from the settings panel.
2. The time in the top right corner is done with JavaScript which takes the system time and updates it every 500 milliseconds.
3. The message in the top left corner is also done over JavaScript and it checks the value of hours from the time and gives the appropriate message depending on the value.
4. The search works by checking if you have a dot (.) inside of the search query and no spaces — if so it takes you directly to that website. Otherwise it searches using your selected search engine. You do not need to add `http://` or `https://` since `https://` is added to the beginning automatically. If you press the search button, it will always search using the selected search engine.
5. Favorites are on the bottom and can be fully managed from the page — add new ones, remove them, and drag to reorder them by holding and dragging. Favicons are fetched automatically from the website URL.
6. Settings are accessible via the gear icon in the bottom right corner. You can toggle the welcome message, time and favorites on or off, change the search engine, and manage your wallpapers.

## How to install it as a browser extension?

### Firefox (recommended)
1. Go to `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on…**
4. Navigate to your project folder and select the `manifest.json` file

> For a permanent install without reloading after every restart, go to `about:config`, search for `xpinstall.signatures.required` and set it to **false**. Then go to `about:addons` → gear icon → **Install Add-on From File** and select your zipped project folder.

### Chrome / Edge / Brave
1. Go to `chrome://extensions` (or `edge://extensions`)
2. Toggle on **Developer mode** in the top right
3. Click **Load unpacked**
4. Select your project folder

## How to manage favorites?
Favorites are fully manageable from the page itself — no code editing needed.

- **Add** — click the **+** tile in the favorites bar, enter a title and URL. The favicon is fetched automatically.
- **Remove** — hover over a favorite and click the **✕** that appears in the top right corner, then confirm.
- **Reorder** — click and hold a favorite for a moment, then drag it to the desired position and release.

## How to manage wallpapers?
Wallpapers are managed from the **Settings** panel (gear icon, bottom right).

- **Random** — a new random image from [Picsum](https://picsum.photos/) is loaded on every new tab.
- **My library** — add your own images by clicking **Add images**. A random one from your library is picked on every new tab. Images are stored locally in IndexedDB with no size limit. Individual images can be removed by hovering over their thumbnail and clicking **✕**.

## Special thank you
Thank you [drb0r1s](https://github.com/drb0r1s) for helping with localStorage in JS. ❤️

#
[Website link](https://stralej.github.io/start-page/)

⭐️ If you want to stay updated make sure to **Watch** the project and **Star** it if you like it, thank you.