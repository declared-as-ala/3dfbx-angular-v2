# MediaPipe Pose2BVH - Angular + Vite

This is an Angular + Vite version of the MediaPipe Pose to BVH converter application. It converts real-time webcam pose tracking data into BVH format for use in 3D animation software.

## Features

- **Real-time Pose Tracking**: Uses MediaPipe Holistic to track body, hands, and face
- **3D Visualization**: Renders a 3D character using Three.js
- **Dual Mode System**:
  - **Tracking Mode**: Real-time avatar tracking from webcam
  - **Animation Mode**: Play pre-loaded FBX animations
- **BVH Export**: Convert recorded motion to BVH format
- **Face Blendshapes**: Facial expression tracking and animation

## Prerequisites

- Node.js 18+ and npm
- Modern web browser with WebAssembly support (Chrome, Firefox, Edge)
- Webcam for pose tracking

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mediapipe-pose2bvh-angular
```

2. Install dependencies:
```bash
npm install
```

3. Copy assets to the public folder:
```bash
# Copy FBX models, GLB files, and background images from the original docs folder
# to public/assets/
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:4200`

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── control-panel/     # Control panel component
│   │   └── video-display/      # Video display component
│   ├── services/
│   │   ├── mediapipe.service.ts      # MediaPipe tracking service
│   │   ├── three-scene.service.ts    # Three.js scene management
│   │   ├── pose-tracking.service.ts   # Pose tracking logic
│   │   └── bvh-converter.service.ts  # BVH conversion service
│   └── app.component.ts        # Main app component
├── main.ts                     # Application entry point
public/
└── assets/                     # Static assets (FBX, GLB, images)
```

## Usage

1. Open the application in your browser
2. Allow camera access when prompted
3. Select **Tracking Mode** for real-time pose tracking
4. Select **Animation Mode** to play pre-loaded animations
5. The 3D character will mirror your movements in real-time

## Technologies

- **Angular 18**: Frontend framework
- **Vite**: Build tool and dev server
- **Three.js**: 3D graphics library
- **MediaPipe**: Pose, hand, and face tracking
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

## License

This software is released under the GNU General Public License version 3 (GPLv3).


