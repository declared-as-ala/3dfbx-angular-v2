import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[999999] group" style="max-width: calc(100vw - 2rem);">
      <div class="relative">
        <video 
          #videoElement
          class="w-32 sm:w-40 md:w-56 lg:w-72 xl:w-80 h-auto rounded-xl shadow-2xl border-2 border-indigo-500/50 transform -rotate-3 transition-all duration-300 group-hover:rotate-0 group-hover:scale-105 max-w-[calc(100vw-20rem)] sm:max-w-none"
          autoplay
          muted
          playsinline>
        </video>
        <div class="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
        <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          Live Camera
        </div>
      </div>
    </div>
  `,
  styles: []
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
