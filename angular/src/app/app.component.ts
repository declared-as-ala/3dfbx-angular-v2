import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { VideoDisplayComponent } from './components/video-display/video-display.component';
import { ThreeSceneService } from './services/three-scene.service';
import { MediaPipeService } from './services/mediapipe.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ControlPanelComponent, VideoDisplayComponent],
  template: `
    <div class="app-container">
      <div #sceneContainer class="scene-container"></div>
      <app-control-panel 
        [currentMode]="currentMode"
        (modeChange)="onModeChange($event)"
        (animationSelected)="onAnimationSelected($event)">
      </app-control-panel>
      <app-video-display 
        [videoElement]="videoElement">
      </app-video-display>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
    }
    
    .app-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    }
    
    .scene-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
    }
  `]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sceneContainer', { static: false }) sceneContainer!: ElementRef<HTMLDivElement>;
  
  currentMode: 'tracking' | 'animation' = 'tracking';
  videoElement?: HTMLVideoElement;

  private threeSceneService = inject(ThreeSceneService);
  private mediaPipeService = inject(MediaPipeService);

  ngOnInit(): void {
    // Initialize services
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.sceneContainer) {
      await this.threeSceneService.initialize(this.sceneContainer.nativeElement);
      this.videoElement = await this.mediaPipeService.initialize();
      this.threeSceneService.setVideoElement(this.videoElement);
      
      // Start the animation loop
      this.threeSceneService.startAnimation();
      
      // Start MediaPipe tracking
      this.mediaPipeService.startTracking((results) => {
        this.threeSceneService.updateTracking(results, this.currentMode);
      });

      // Update face tracking
      setInterval(() => {
        const faceResults = this.mediaPipeService.getFaceResults();
        if (faceResults) {
          this.threeSceneService.updateFaceTracking(faceResults, this.currentMode);
        }
      }, 100);
    }
  }

  onModeChange(mode: 'tracking' | 'animation'): void {
    this.currentMode = mode;
    this.threeSceneService.setMode(mode);
  }

  onAnimationSelected(animationFile: string): void {
    console.log('onAnimationSelected called with:', animationFile, 'currentMode:', this.currentMode);
    if (this.currentMode === 'animation' && animationFile) {
      this.threeSceneService.loadAnimation(animationFile);
    } else if (!animationFile) {
      // Stop animation if empty selection
      this.threeSceneService.setMode('animation'); // Reset mode to stop current animation
    }
  }

  ngOnDestroy(): void {
    this.mediaPipeService.cleanup();
    this.threeSceneService.cleanup();
  }
}
