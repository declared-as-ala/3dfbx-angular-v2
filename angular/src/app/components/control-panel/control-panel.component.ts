import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[10000] w-auto sm:w-auto max-w-sm" style="overflow: visible;">
      <div class="bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50" style="overflow: visible;">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 class="text-white text-xl font-bold flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Control Panel
          </h2>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Mode Selection -->
          <div>
            <h3 class="text-gray-300 text-sm font-semibold uppercase tracking-wider mb-4">Select Mode</h3>
            <div class="grid grid-cols-2 gap-3">
              <!-- Tracking Mode Card -->
              <button 
                (click)="onModeChange('tracking')"
                [class.active]="currentMode === 'tracking'"
                class="mode-card bg-gray-700/50 border-2 rounded-xl p-4 text-left cursor-pointer hover:bg-gray-700 transition-all"
                [class.border-indigo-500]="currentMode === 'tracking'"
                [class.border-gray-600]="currentMode !== 'tracking'"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-white font-semibold text-sm">Tracking</div>
                    <div class="text-gray-400 text-xs">Real-time</div>
                  </div>
                </div>
              </button>

              <!-- Animation Mode Card -->
              <button 
                (click)="onModeChange('animation')"
                [class.active]="currentMode === 'animation'"
                class="mode-card bg-gray-700/50 border-2 rounded-xl p-4 text-left cursor-pointer hover:bg-gray-700 transition-all"
                [class.border-purple-500]="currentMode === 'animation'"
                [class.border-gray-600]="currentMode !== 'animation'"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-white font-semibold text-sm">Animation</div>
                    <div class="text-gray-400 text-xs">Pre-loaded</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
  
          <!-- Animation Selection (shown when Animation Mode is active) -->
          <div *ngIf="currentMode === 'animation'" class="space-y-3">
            <div class="border-t border-gray-700 pt-4">
              <label class="text-gray-300 text-sm font-semibold uppercase tracking-wider mb-3 block">Select Animation</label>
              <div class="relative" style="z-index: 10001;">
                <select 
                  (change)="onAnimationSelected($event)"
                  class="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-xl px-4 py-3 pr-10 cursor-pointer hover:border-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors text-sm"
                  style="position: relative; z-index: 10001;"
                >
                  <option value="" style="background-color: #374151; color: white; padding: 10px;">-- Select Animation --</option>
                  <option value="Chicken Dance.fbx" style="background-color: #374151; color: white; padding: 10px;">Chicken Dance</option>
                  <option value="Fast Run.fbx" style="background-color: #374151; color: white; padding: 10px;">Fast Run</option>
                </select>
              </div>
              <p class="text-gray-500 text-xs mt-2">Choose a pre-loaded animation to play</p>
            </div>
          </div>

          <!-- Status Indicator -->
          <div class="border-t border-gray-700 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-400 text-sm">Status</span>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span [class]="getStatusClass()" class="text-sm font-medium">{{ getStatusText() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mode-card.active {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }
  `]
})
export class ControlPanelComponent {
  @Input() currentMode: 'tracking' | 'animation' = 'tracking';
  @Output() modeChange = new EventEmitter<'tracking' | 'animation'>();
  @Output() animationSelected = new EventEmitter<string>();

  onModeChange(mode: 'tracking' | 'animation'): void {
    this.modeChange.emit(mode);
  }

  onAnimationSelected(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const animationFile = select.value;
    if (animationFile) {
      console.log('Animation selected from dropdown:', animationFile);
      this.animationSelected.emit(animationFile);
    } else {
      // Clear animation if empty selection
      this.animationSelected.emit('');
    }
  }

  getStatusText(): string {
    return this.currentMode === 'tracking' ? 'Tracking Active' : 'Animation Mode';
  }

  getStatusClass(): string {
    return this.currentMode === 'tracking' 
      ? 'text-green-400' 
      : 'text-purple-400';
  }
}

