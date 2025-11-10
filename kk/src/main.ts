import 'zone.js';
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ThreeSceneService } from './app/services/three-scene.service';
import { MediaPipeService } from './app/services/mediapipe.service';
import { PoseTrackingService } from './app/services/pose-tracking.service';
import { BVHConverterService } from './app/services/bvh-converter.service';
import './styles.css';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    ThreeSceneService,
    MediaPipeService,
    PoseTrackingService,
    BVHConverterService,
  ],
}).catch(err => console.error(err));

