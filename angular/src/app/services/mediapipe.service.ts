import { Injectable } from '@angular/core';

// MediaPipe types - loaded from CDN
declare const FilesetResolver: any;
declare const FaceLandmarker: any;

// Declare MediaPipe types that may not have TypeScript definitions
declare const Holistic: any;
declare const Camera: any;

export interface HolisticResults {
  poseLandmarks?: any[];
  leftHandLandmarks?: any[];
  rightHandLandmarks?: any[];
}

export interface FaceResults {
  faceBlendshapes?: Array<{
    categories: Array<{
      categoryName: string;
      score: number;
    }>;
  }>;
  facialTransformationMatrixes?: Array<{
    data: Float32Array | number[];
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class MediaPipeService {
  private faceLandmarker?: FaceLandmarker;
  private holistic?: any;
  private camera?: any;
  private videoElement?: HTMLVideoElement;
  private lastVideoTime = -1;
  private faceResults?: FaceResults;
  private holisticResults?: HolisticResults;
  private trackingCallback?: (results: HolisticResults) => void;

  async initialize(): Promise<HTMLVideoElement> {
    // Create video element
    const video = document.createElement('video');
    video.autoplay = true;
    video.style.display = 'none';
    document.body.appendChild(video);

    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    await video.play();

    this.videoElement = video;

    // Initialize Face Landmarker
    await this.initializeFaceLandmarker();

    // Initialize Holistic
    await this.initializeHolistic();

    return video;
  }

  private async initializeFaceLandmarker(): Promise<void> {
    // Dynamically import MediaPipe Tasks Vision
    try {
      const visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
      const FilesetResolverClass = visionModule.FilesetResolver;
      const FaceLandmarkerClass = visionModule.FaceLandmarker;

      const filesetResolver = await FilesetResolverClass.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      this.faceLandmarker = await FaceLandmarkerClass.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      modelComplexity: 1,
      outputFaceBlendshapes: true,
      outputFaceGeometry: true,
      outputFacialTransformationMatrixes: true,
      runningMode: 'VIDEO',
      numFaces: 1
    });
    } catch (error) {
      console.error('Failed to initialize Face Landmarker:', error);
    }

    if (this.videoElement) {
      this.videoElement.addEventListener('play', () => this.predictFace());
    }
  }

  private async initializeHolistic(): Promise<void> {
    // Dynamically import MediaPipe Holistic
    try {
      await import('https://cdn.jsdelivr.net/npm/@mediapipe/holistic@latest/holistic.js');
      await import('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      // Wait a bit for globals to be set
      let retries = 0;
      while (!(window as any).Holistic && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (!(window as any).Holistic) {
        console.error('Holistic not loaded');
        return;
      }

      const HolisticClass = (window as any).Holistic;
      this.holistic = new HolisticClass({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@latest/${file}`;
      },
    });

    this.holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.holistic.onResults((results) => {
      this.holisticResults = results;
      if (this.trackingCallback) {
        this.trackingCallback(results);
      }
    });

      if (this.videoElement) {
        // Wait for Camera to be available
        let retries = 0;
        while (!(window as any).Camera && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (!(window as any).Camera) {
          console.error('Camera not loaded');
          return;
        }

        const CameraClass = (window as any).Camera;
        this.camera = new CameraClass(this.videoElement, {
          onFrame: async () => {
            if (this.holistic && this.videoElement) {
              await this.holistic.send({ image: this.videoElement });
            }
          },
          width: this.videoElement.width || 640,
          height: this.videoElement.height || 480
        });

        setTimeout(() => {
          this.camera?.start();
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to initialize Holistic:', error);
    }
  }

  private async predictFace(): Promise<void> {
    if (!this.faceLandmarker || !this.videoElement) return;

    const startTimeMs = performance.now();
    if (this.lastVideoTime !== this.videoElement.currentTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      try {
        const results = this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs);
        this.faceResults = results;
      } catch (error) {
        console.error('Face prediction error:', error);
      }
    }
    window.requestAnimationFrame(() => this.predictFace());
  }

  startTracking(callback: (results: HolisticResults) => void): void {
    this.trackingCallback = callback;
  }

  getFaceResults(): FaceResults | undefined {
    return this.faceResults;
  }

  getHolisticResults(): HolisticResults | undefined {
    return this.holisticResults;
  }

  cleanup(): void {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.videoElement?.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (this.videoElement) {
      this.videoElement.remove();
    }
  }
}

