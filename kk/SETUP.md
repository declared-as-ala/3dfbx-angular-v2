# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Copy Assets** (if not already done)
   The assets should already be in `public/assets/`:
   - `ybot.fbx` - Main character model
   - `scene.glb` - Face mesh model
   - `background.jpg` - Background image
   - `Chicken Dance.fbx` - Animation file
   - `Fast Run.fbx` - Animation file

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to `http://localhost:4200`

## Troubleshooting

### MediaPipe Not Loading
If you see errors about Holistic or Camera not being available:
- Check browser console for errors
- Ensure you have a stable internet connection (CDN resources are loaded)
- Try refreshing the page

### Camera Access Denied
- Ensure you grant camera permissions when prompted
- Check browser settings for camera permissions
- Try a different browser (Chrome/Firefox recommended)

### Assets Not Loading
- Verify files exist in `public/assets/`
- Check browser console for 404 errors
- Ensure Vite dev server is running

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 18+

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/          # Angular components
│   │   ├── services/            # Business logic services
│   │   └── app.component.ts     # Root component
│   └── main.ts                  # Entry point
├── public/
│   └── assets/                  # Static assets (FBX, GLB, images)
├── index.html                   # HTML template
├── vite.config.ts               # Vite configuration
└── package.json                 # Dependencies
```


