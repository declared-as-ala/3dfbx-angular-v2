import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { HolisticResults, FaceResults } from './mediapipe.service';
import { PoseTrackingService } from './pose-tracking.service';
import { BVHConverterService } from './bvh-converter.service';

@Injectable({
  providedIn: 'root'
})
export class ThreeSceneService {
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private stats?: Stats;
  private model?: THREE.Group;
  private facemesh?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private currentAnimation?: THREE.AnimationAction | null;
  private clock = new THREE.Clock();
  private animationId?: number;
  private currentMode: 'tracking' | 'animation' = 'tracking';
  private videoElement?: HTMLVideoElement;
  private container?: HTMLElement;

  private poseTrackingService = inject(PoseTrackingService);
  private bvhConverterService = inject(BVHConverterService);

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    // Initialize stats
    this.stats = new Stats();
    this.stats.dom.style.position = 'fixed';
    this.stats.dom.style.top = '0px';
    this.stats.dom.style.right = '0px';
    document.body.appendChild(this.stats.dom);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    this.camera.position.set(0, 100, 600);

    // Initialize scene
    this.scene = new THREE.Scene();
    
    // Load background
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/assets/background.jpg',
      (texture) => {
        if (this.scene) {
          this.scene.background = texture;
        }
      },
      undefined,
      () => {
        if (this.scene) {
          this.scene.background = new THREE.Color(0x111111);
        }
      }
    );

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    this.scene.add(dirLight);

    // Add ground plane
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.MeshStandardMaterial({ color: 0x000000, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Add grid
    const grid = new THREE.GridHelper(4000, 80, 0x444444, 0x444444);
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(10);
    this.scene.add(axesHelper);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 100, 0);
    this.controls.enableZoom = true;
    this.controls.update();

    // Load model
    await this.loadModel();

    // Load face mesh
    await this.loadFaceMesh();

    // Setup window resize handler
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private async loadModel(): Promise<void> {
    const loader = new FBXLoader();
    return new Promise((resolve, reject) => {
      loader.load('/assets/ybot.fbx', (object) => {
        this.model = object;
        if (this.model.children[1]) {
          (this.model.children[1] as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: 0x999999 });
        }
        if (this.model.children[2]) {
          (this.model.children[2] as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: 0x222222 });
        }

        this.mixer = new THREE.AnimationMixer(object);
        object.traverse((child) => {
          if (child.name === 'mixamorigHead') {
            child.traverse((child1) => {
              child1.scale.set(0.9, 0.85, 0.67);
            });
          }
        });

        if (this.scene) {
          this.scene.add(object);
        }
        resolve();
      }, undefined, reject);
    });
  }

  private async loadFaceMesh(): Promise<void> {
    if (!this.renderer) return;

    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/')
      .detectSupport(this.renderer);

    const loader = new GLTFLoader()
      .setKTX2Loader(ktx2Loader)
      .setMeshoptDecoder(MeshoptDecoder);

    return new Promise((resolve, reject) => {
      loader.load('/assets/scene.glb', (gltf) => {
        this.facemesh = gltf.scene.children[0];
        if (this.facemesh) {
          this.facemesh.castShadow = false;
          this.facemesh.receiveShadow = false;
          this.facemesh.scale.set(10, 9.5, 7.7);
          this.facemesh.rotation.set(0, 0, 0);
          (this.facemesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            depthWrite: false,
            metalness: 1,
            roughness: 5
          });
          if (this.scene) {
            this.scene.add(this.facemesh);
          }
        }
        resolve();
      }, undefined, reject);
    });
  }

  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
  }

  setMode(mode: 'tracking' | 'animation'): void {
    this.currentMode = mode;
    if (mode === 'tracking') {
      // Stop animations when switching to tracking mode
      if (this.currentAnimation) {
        this.currentAnimation.stop();
        this.currentAnimation = undefined;
      }
      if (this.mixer) {
        this.mixer.stopAllAction();
      }
      if ((this as any).animatedMixer) {
        (this as any).animatedMixer.stopAllAction();
      }
      // Show our model and hide animated object
      if (this.model) {
        this.model.visible = true;
      }
      if ((this as any).animatedObject && this.scene) {
        (this as any).animatedObject.visible = false;
        // Optionally remove from scene
        // this.scene.remove((this as any).animatedObject);
      }
    } else {
      // Hide our model when switching to animation mode (if animated object exists)
      if ((this as any).animatedObject && this.model) {
        this.model.visible = false;
        (this as any).animatedObject.visible = true;
      }
      // Don't reset clock when switching to animation mode - let it continue
      // this.clock.start();
    }
    // Only reset clock when switching to tracking mode
    if (mode === 'tracking') {
      this.clock.start();
    }
  }

  updateTracking(results: HolisticResults, mode: 'tracking' | 'animation'): void {
    if (mode === 'tracking' && this.model && results) {
      this.poseTrackingService.updatePose(this.model, results, this.camera!);
    }
  }

  updateFaceTracking(faceResults: FaceResults, mode: 'tracking' | 'animation'): void {
    if (mode === 'tracking' && faceResults && faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
      const face = this.scene?.getObjectByName('mesh_2') as THREE.Mesh;
      if (face && (face as any).morphTargetDictionary) {
        const blendshapesMap: { [key: string]: string } = {
          'browDownLeft': 'browDown_L',
          'browDownRight': 'browDown_R',
          'browInnerUp': 'browInnerUp',
          'browOuterUpLeft': 'browOuterUp_L',
          'browOuterUpRight': 'browOuterUp_R',
          'cheekPuff': 'cheekPuff',
          'cheekSquintLeft': 'cheekSquint_L',
          'cheekSquintRight': 'cheekSquint_R',
          'eyeBlinkLeft': 'eyeBlink_L',
          'eyeBlinkRight': 'eyeBlink_R',
          'eyeLookDownLeft': 'eyeLookDown_L',
          'eyeLookDownRight': 'eyeLookDown_R',
          'eyeLookInLeft': 'eyeLookIn_L',
          'eyeLookInRight': 'eyeLookIn_R',
          'eyeLookOutLeft': 'eyeLookOut_L',
          'eyeLookOutRight': 'eyeLookOut_R',
          'eyeLookUpLeft': 'eyeLookUp_L',
          'eyeLookUpRight': 'eyeLookUp_R',
          'eyeSquintLeft': 'eyeSquint_L',
          'eyeSquintRight': 'eyeSquint_R',
          'eyeWideLeft': 'eyeWide_L',
          'eyeWideRight': 'eyeWide_R',
          'jawForward': 'jawForward',
          'jawLeft': 'jawLeft',
          'jawOpen': 'jawOpen',
          'jawRight': 'jawRight',
          'mouthClose': 'mouthClose',
          'mouthDimpleLeft': 'mouthDimple_L',
          'mouthDimpleRight': 'mouthDimple_R',
          'mouthFrownLeft': 'mouthFrown_L',
          'mouthFrownRight': 'mouthFrown_R',
          'mouthFunnel': 'mouthFunnel',
          'mouthLeft': 'mouthLeft',
          'mouthLowerDownLeft': 'mouthLowerDown_L',
          'mouthLowerDownRight': 'mouthLowerDown_R',
          'mouthPressLeft': 'mouthPress_L',
          'mouthPressRight': 'mouthPress_R',
          'mouthPucker': 'mouthPucker',
          'mouthRight': 'mouthRight',
          'mouthRollLower': 'mouthRollLower',
          'mouthRollUpper': 'mouthRollUpper',
          'mouthShrugLower': 'mouthShrugLower',
          'mouthShrugUpper': 'mouthShrugUpper',
          'mouthSmileLeft': 'mouthSmile_L',
          'mouthSmileRight': 'mouthSmile_R',
          'mouthStretchLeft': 'mouthStretch_L',
          'mouthStretchRight': 'mouthStretch_R',
          'mouthUpperUpLeft': 'mouthUpperUp_L',
          'mouthUpperUpRight': 'mouthUpperUp_R',
          'noseSneerLeft': 'noseSneer_L',
          'noseSneerRight': 'noseSneer_R',
        };

        const faceBlendshapes = faceResults.faceBlendshapes[0].categories;
        const morphTargetDictionary = (face as any).morphTargetDictionary;
        const morphTargetInfluences = (face as any).morphTargetInfluences;

        for (const blendshape of faceBlendshapes) {
          const categoryName = blendshape.categoryName;
          const score = blendshape.score;
          const mappedName = blendshapesMap[categoryName];
          if (mappedName) {
            const index = morphTargetDictionary[mappedName];
            if (index !== undefined && morphTargetInfluences) {
              morphTargetInfluences[index] = score;
            }
          }
        }
      }
    }
  }

  loadAnimation(animationFile: string): void {
    if (!this.model || !this.mixer) {
      console.warn('Model or mixer not ready');
      setTimeout(() => this.loadAnimation(animationFile), 500);
      return;
    }

    console.log('Loading animation:', animationFile);
    const loader = new FBXLoader();
    loader.load(
      `/assets/${animationFile}`,
      (animObject) => {
        console.log('Animation file loaded:', animObject);
        console.log('Number of animations:', animObject.animations ? animObject.animations.length : 0);
        console.log('Loaded object type:', animObject.type);
        console.log('Loaded object children:', animObject.children.length);
        
        // Debug: Log the structure of the loaded object
        animObject.traverse((child: any) => {
          if (child.animations && child.animations.length > 0) {
            console.log('Found animations in child:', child.name, child.type, child.animations.length);
            child.animations.forEach((anim: any, idx: number) => {
              console.log(`  Animation ${idx}:`, anim.name, 'Duration:', anim.duration, 'Tracks:', anim.tracks ? anim.tracks.length : 0);
            });
          }
          if (child.skeleton) {
            console.log('Found skeleton in child:', child.name, 'Bones:', child.skeleton.bones.length);
          }
        });
        
        if (this.mixer) {
          this.mixer.stopAllAction();
        }
        if (this.currentAnimation) {
          this.currentAnimation.stop();
          this.currentAnimation = undefined;
        }

        // Try to find animations in the loaded object
        let animations: THREE.AnimationClip[] = [];
        
        if (animObject.animations && animObject.animations.length > 0) {
          animations = animObject.animations;
        } else {
          // Sometimes animations are stored in the object itself
          animObject.traverse((child: any) => {
            if (child.animations && child.animations.length > 0) {
              animations.push(...child.animations);
            }
          });
        }

        console.log('Found animations:', animations.length);
        
        if (animations.length > 0) {
          // Try each animation until we find one with tracks
          let animationPlayed = false;
          for (const clip of animations) {
            console.log('Trying animation clip:', clip.name, 'Duration:', clip.duration, 'Tracks:', clip.tracks ? clip.tracks.length : 0);
            
            if (clip.tracks && clip.tracks.length > 0 && clip.duration > 0) {
              try {
                // Find the mesh with skeleton in the loaded object (usually Alpha_Surface)
                let animatedMesh: any = null;
                animObject.traverse((child: any) => {
                  // Look for a SkinnedMesh with skeleton (this is the visible character)
                  if (child.type === 'SkinnedMesh' && child.skeleton && child.skeleton.bones && !animatedMesh) {
                    animatedMesh = child;
                  }
                });
                
                // Fallback: find any object with skeleton
                if (!animatedMesh) {
                  animObject.traverse((child: any) => {
                    if (child.skeleton && child.skeleton.bones && !animatedMesh) {
                      animatedMesh = child;
                    }
                  });
                }
                
                if (animatedMesh) {
                  console.log('Using animated mesh:', animatedMesh.name, 'Type:', animatedMesh.type);
                  
                  // Remove previous animated object if exists
                  if ((this as any).animatedObject && this.scene) {
                    this.scene.remove((this as any).animatedObject);
                  }
                  
                  // Hide our model
                  if (this.model) {
                    this.model.visible = false;
                  }
                  
                  // Add the entire animObject group to the scene
                  if (this.scene) {
                    // Position the group where our model is
                    if (this.model) {
                      // Get model's world position
                      const worldPos = new THREE.Vector3();
                      const worldQuat = new THREE.Quaternion();
                      const worldScale = new THREE.Vector3();
                      this.model.matrixWorld.decompose(worldPos, worldQuat, worldScale);
                      
                      animObject.position.set(0, 100, 0); // Default position like our model
                      animObject.rotation.set(0, 0, 0);
                      animObject.scale.set(1, 1, 1);
                      
                      console.log('Positioned animated object at:', animObject.position);
                    }
                    
                    // Make sure all children are visible and have proper materials
                    animObject.traverse((child: any) => {
                      child.visible = true;
                      child.castShadow = true;
                      child.receiveShadow = true;
                      
                      if (child.material) {
                        if (Array.isArray(child.material)) {
                          child.material.forEach((mat: any) => {
                            if (mat) {
                              mat.visible = true;
                              mat.transparent = false;
                              mat.opacity = 1.0;
                            }
                          });
                        } else {
                          child.material.visible = true;
                          child.material.transparent = false;
                          child.material.opacity = 1.0;
                        }
                      }
                    });
                    
                    animObject.visible = true;
                    this.scene.add(animObject);
                    (this as any).animatedObject = animObject;
                    console.log('Added animated object group to scene, mesh:', animatedMesh.name);
                    console.log('Animated object position:', animObject.position);
                    console.log('Animated object visible:', animObject.visible);
                  }
                  
                  // Create mixer for the root of the animation (use the group, not just the mesh)
                  // The mixer needs to be on the root object that contains the skeleton
                  const animatedMixer = new THREE.AnimationMixer(animObject);
                  this.currentAnimation = animatedMixer.clipAction(clip);
                  this.currentAnimation.reset();
                  this.currentAnimation.setLoop(THREE.LoopRepeat, Infinity);
                  this.currentAnimation.setEffectiveWeight(1.0);
                  this.currentAnimation.timeScale = 1.0;
                  this.currentAnimation.play();
                  
                  // Store the mixer for updates
                  (this as any).animatedMixer = animatedMixer;
                  
                  // Don't get delta here - let the animation loop handle it
                  // Just ensure the action is playing
                  
                  console.log('Animation playing on loaded object:', clip.name || animationFile);
                  console.log('Animation isRunning:', this.currentAnimation.isRunning());
                  console.log('Animation duration:', clip.duration);
                  console.log('Animation tracks:', clip.tracks.length);
                  animationPlayed = true;
                  break;
                } else {
                  // Fallback: try to apply to our model (might not work due to bone name mismatch)
                  console.log('No skeleton found in loaded object, trying to apply to our model');
                  if (this.mixer && this.model) {
                    this.currentAnimation = this.mixer.clipAction(clip, this.model);
                    this.currentAnimation.reset();
                    this.currentAnimation.setLoop(THREE.LoopRepeat, Infinity);
                    this.currentAnimation.setEffectiveWeight(1.0);
                    this.currentAnimation.timeScale = 1.0;
                    this.currentAnimation.play();
                    
                    const delta = this.clock.getDelta();
                    this.mixer.update(delta);
                    
                    console.log('Animation playing on our model:', clip.name || animationFile);
                    animationPlayed = true;
                    break;
                  }
                }
              } catch (error) {
                console.error('Error creating animation action:', error);
                // Try next animation
              }
            }
          }
          
          if (!animationPlayed) {
            console.warn('No valid animations found with tracks and duration > 0');
            console.log('All animation clips:', animations.map(a => ({
              name: a.name,
              duration: a.duration,
              tracks: a.tracks ? a.tracks.length : 0,
              trackTypes: a.tracks ? a.tracks.map((t: any) => t.constructor.name) : []
            })));
            
            // Try to use the loaded object itself if it has animations
            // Sometimes FBX animations need to be applied to the loaded object's skeleton
            // First, try to add the loaded object to the scene and animate it directly
            if (animObject.children.length > 0) {
              const animatedChild = animObject.children.find((child: any) => 
                child.animations && child.animations.length > 0
              ) as any;
              
              if (animatedChild) {
                console.log('Found animated child:', animatedChild.name);
                // Add to scene temporarily to see if it animates
                if (this.scene && !this.scene.getObjectByName(animatedChild.name)) {
                  this.scene.add(animatedChild);
                  console.log('Added animated child to scene');
                }
                
                // Try to create mixer for the animated child
                try {
                  const childMixer = new THREE.AnimationMixer(animatedChild);
                  const childClip = animatedChild.animations[0];
                  if (childClip) {
                    const action = childMixer.clipAction(childClip);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.play();
                    (this as any).childMixer = childMixer;
                    (this as any).animatedChild = animatedChild;
                    console.log('Playing animation on child object:', animatedChild.name);
                    animationPlayed = true;
                  }
                } catch (error) {
                  console.error('Failed to play child animation:', error);
                }
              }
            }
            
            // Fallback: try all children
            if (!animationPlayed) {
              animObject.traverse((child: any) => {
                if (child.animations && child.animations.length > 0 && !animationPlayed) {
                  const childClip = child.animations[0];
                  console.log('Trying to use child animation:', child.name, childClip.name);
                  try {
                    // Create a new mixer for the child object
                    const childMixer = new THREE.AnimationMixer(child);
                    const action = childMixer.clipAction(childClip);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.play();
                    console.log('Playing animation on child object:', child.name);
                    (this as any).childMixer = childMixer;
                    (this as any).animatedChild = child;
                    animationPlayed = true;
                  } catch (error) {
                    console.error('Failed to play child animation:', error);
                  }
                }
              });
            }
          }
        } else {
          console.warn('No animations found in loaded file');
        }
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log('Loading animation:', Math.round(percentComplete) + '%');
        }
      },
      (error) => {
        console.error('Error loading animation file:', error);
      }
    );
  }

  startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // Update animation mixer if in animation mode
      if (this.currentMode === 'animation') {
        const delta = this.clock.getDelta();
        
        // Update our model's mixer if it has an animation
        if (this.mixer && this.currentAnimation) {
          this.mixer.update(delta);
        }
        
        // Update animated mixer if it exists (for animations loaded from FBX)
        if ((this as any).animatedMixer) {
          (this as any).animatedMixer.update(delta);
        }
        
        // Update child mixer if it exists
        if ((this as any).childMixer) {
          (this as any).childMixer.update(delta);
        }
      }

      // Update face mesh position
      if (this.model && this.facemesh) {
        const head = this.model.getObjectByName('mixamorigHead');
        if (head) {
          head.getWorldPosition(this.facemesh.position);
          head.getWorldQuaternion(this.facemesh.quaternion);
        }
      }

      // Update controls
      if (this.controls) {
        this.controls.update();
      }

      // Render
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      // Update stats
      if (this.stats) {
        this.stats.update();
      }
    };

    animate();
  }

  private onWindowResize(): void {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.stats) {
      document.body.removeChild(this.stats.dom);
    }
    window.removeEventListener('resize', () => this.onWindowResize());
    if (this.renderer && this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

