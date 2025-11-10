import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="control-panel-wrapper">
      <div class="control-panel glass">
        <!-- Header -->
        <div class="control-header">
          <h2 class="control-title">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Control Panel
          </h2>
        </div>

        <!-- Content -->
        <div class="control-content">
          <!-- Mode Selection -->
          <div class="mode-section">
            <h3 class="section-title">Select Mode</h3>
            <div class="mode-grid">
              <!-- Tracking Mode Card -->
              <button 
                (click)="onModeChange('tracking')"
                [class.active]="currentMode === 'tracking'"
                class="mode-card"
                [class.mode-active]="currentMode === 'tracking'"
              >
                <div class="mode-card-content">
                  <div class="mode-icon bg-indigo-500/20">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div class="mode-name">Tracking</div>
                    <div class="mode-desc">Real-time</div>
                  </div>
                </div>
              </button>

              <!-- Animation Mode Card -->
              <button 
                (click)="onModeChange('animation')"
                [class.active]="currentMode === 'animation'"
                class="mode-card"
                [class.mode-active]="currentMode === 'animation'"
              >
                <div class="mode-card-content">
                  <div class="mode-icon bg-purple-500/20">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div class="mode-name">Animation</div>
                    <div class="mode-desc">Pre-loaded</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
  
          <!-- Animation Selection -->
          <div *ngIf="currentMode === 'animation'" class="animation-section">
            <div class="section-divider"></div>
            <label class="section-title">Select Animation</label>
                <select 
                  (change)="onAnimationSelected($event)"
              class="animation-select"
            >
              <option value="">-- Select Animation --</option>
              <option value="Chicken Dance.fbx">Chicken Dance</option>
              <option value="Fast Run.fbx">Fast Run</option>
                </select>
            <p class="animation-hint">Choose a pre-loaded animation to play</p>
          </div>

          <!-- Status Indicator -->
          <div class="status-section">
            <div class="section-divider"></div>
            <div class="status-row">
              <span class="status-label">Status</span>
              <div class="status-indicator">
                <div class="status-dot animate-pulse"></div>
                <span [class]="getStatusClass()" class="status-text">{{ getStatusText() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .control-panel-wrapper {
      position: fixed;
      top: 1rem;
      left: 1rem;
      right: 1rem;
      z-index: 10000;
      max-width: 24rem;
      width: auto;
    }
    
    .control-panel {
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-2xl);
      overflow: visible;
    }
    
    .control-header {
      background: linear-gradient(to right, #4f46e5, #9333ea);
      padding: var(--spacing-lg) var(--spacing-lg);
      border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    }
    
    .control-title {
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .icon {
      width: 1.5rem;
      height: 1.5rem;
    }
    
    .control-content {
      padding: var(--spacing-lg);
    }
    
    .mode-section {
      margin-bottom: var(--spacing-lg);
    }
    
    .section-title {
      color: #cbd5e1;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--spacing-md);
      display: block;
    }
    
    .mode-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    
    .mode-card {
      background-color: rgba(51, 65, 85, 0.5);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--spacing-md);
      text-align: left;
      cursor: pointer;
      transition: all var(--transition-base);
    }
    
    .mode-card:hover {
      background-color: var(--color-surface-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .mode-card.mode-active {
      background: linear-gradient(135deg, var(--color-indigo) 0%, var(--color-purple) 100%);
      border-color: transparent;
    }
    
    .mode-card-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .mode-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .mode-icon svg {
      width: 1.5rem;
      height: 1.5rem;
      color: #818cf8;
    }
    
    .mode-card.mode-active .mode-icon svg {
      color: white;
    }
    
    .mode-name {
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .mode-desc {
      color: #94a3b8;
      font-size: 0.75rem;
    }
    
    .mode-card.mode-active .mode-name,
    .mode-card.mode-active .mode-desc {
      color: white;
    }
    
    .animation-section {
      margin-top: var(--spacing-lg);
    }
    
    .section-divider {
      border-top: 1px solid var(--color-border);
      margin-bottom: var(--spacing-md);
    }
    
    .animation-select {
      width: 100%;
      background-color: var(--color-surface-light);
      border: 2px solid var(--color-border);
      color: white;
      border-radius: var(--radius-xl);
      padding: 0.75rem var(--spacing-md);
      padding-right: var(--spacing-xl);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all var(--transition-fast);
    }
    
    .animation-select:hover {
      border-color: var(--color-indigo);
    }
    
    .animation-select:focus {
      outline: none;
      border-color: var(--color-indigo);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    
    .animation-hint {
      color: #6b7280;
      font-size: 0.75rem;
      margin-top: var(--spacing-sm);
    }
    
    .status-section {
      margin-top: var(--spacing-lg);
    }
    
    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .status-label {
      color: #94a3b8;
      font-size: 0.875rem;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .status-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 9999px;
      background-color: var(--color-success);
    }
    
    .status-text {
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .status-tracking {
      color: #34d399;
    }
    
    .status-animation {
      color: #a78bfa;
    }
    
    @media (max-width: 640px) {
      .control-panel-wrapper {
        left: 0.5rem;
        right: 0.5rem;
        top: 0.5rem;
        max-width: calc(100vw - 1rem);
      }
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
      ? 'status-tracking' 
      : 'status-animation';
  }
}

