import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-wrapper">
      <div class="video-container">
        <video 
          #videoElement
          class="video-element"
          autoplay
          muted
          playsinline>
        </video>
        <div class="status-indicator"></div>
        <div class="video-label">Live Camera</div>
      </div>
    </div>
  `,
  styles: [`
    .video-wrapper {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
      max-width: calc(100vw - 2rem);
    }
    
    .video-container {
      position: relative;
      transition: transform var(--transition-slow);
    }
    
    .video-wrapper:hover .video-container {
      transform: rotate(0deg) scale(1.05);
    }
    
    .video-element {
      width: 18rem;
      height: auto;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-2xl);
      border: 2px solid rgba(99, 102, 241, 0.5);
      transform: rotate(-3deg);
      transition: all var(--transition-slow);
      display: block;
      background-color: #000;
    }
    
    .status-indicator {
      position: absolute;
      top: -0.5rem;
      right: -0.5rem;
      width: 1rem;
      height: 1rem;
      background-color: var(--color-success);
      border-radius: 9999px;
      border: 2px solid #0f172a;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    .video-label {
      position: absolute;
      bottom: 0.5rem;
      left: 0.5rem;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    
    @media (max-width: 768px) {
      .video-wrapper {
        bottom: 0.5rem;
        right: 0.5rem;
        max-width: calc(100vw - 1rem);
      }
      
      .video-element {
        width: 12rem;
      }
    }
    
    @media (max-width: 480px) {
      .video-element {
        width: 10rem;
      }
    }
  `]
})
export class VideoDisplayComponent implements AfterViewInit, OnChanges {
  @Input() videoElement?: HTMLVideoElement;
  @ViewChild('videoElement', { static: false }) videoRef?: ElementRef<HTMLVideoElement>;

  ngAfterViewInit(): void {
    this.updateVideoSource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['videoElement'] && this.videoRef) {
      this.updateVideoSource();
    }
  }

  private updateVideoSource(): void {
    if (this.videoRef && this.videoElement && this.videoElement.srcObject) {
      this.videoRef.nativeElement.srcObject = this.videoElement.srcObject;
    }
  }
}
