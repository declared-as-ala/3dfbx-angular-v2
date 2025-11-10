import { Injectable } from '@angular/core';
import * as THREE from 'three';

export interface JointInfo {
  name: string;
  position: number[];
  rotation: number[];
  level: number;
}

@Injectable({
  providedIn: 'root'
})
export class BVHConverterService {
  private radToDeg = 180 / Math.PI;

  quaternionToEulerDegrees(q: THREE.Quaternion): number[] {
    const euler = new THREE.Euler().setFromQuaternion(q, 'XYZ');
    return [euler.x * this.radToDeg, euler.y * this.radToDeg, euler.z * this.radToDeg];
  }

  updateMotionData(model: THREE.Group, doret: boolean = false): JointInfo[] | null {
    const jointInfo: JointInfo[] = [];
    const rootJoint = model.getObjectByName('mixamorigHips') as THREE.Bone;
    
    if (!rootJoint) {
      console.error('Root joint not found!');
      return null;
    }

    this.traverseHierarchy(rootJoint, jointInfo, 0);

    if (doret) {
      return jointInfo;
    }

    return null;
  }

  private traverseHierarchy(joint: THREE.Bone, jointInfo: JointInfo[], level: number = 0): void {
    const jointNames = [
      'Hips', 'LeftUpLeg', 'RightUpLeg', 'Spine', 'Spine1', 'Spine2',
      'Neck', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
      'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
      'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightLeg', 'RightFoot', 'RightToeBase',
      // Left hand fingers
      'LeftHandThumb1', 'LeftHandThumb2', 'LeftHandThumb3', 'LeftHandThumb4',
      'LeftHandIndex1', 'LeftHandIndex2', 'LeftHandIndex3', 'LeftHandIndex4',
      'LeftHandMiddle1', 'LeftHandMiddle2', 'LeftHandMiddle3', 'LeftHandMiddle4',
      'LeftHandRing1', 'LeftHandRing2', 'LeftHandRing3', 'LeftHandRing4',
      'LeftHandPinky1', 'LeftHandPinky2', 'LeftHandPinky3', 'LeftHandPinky4',
      // Right hand fingers
      'RightHandThumb1', 'RightHandThumb2', 'RightHandThumb3', 'RightHandThumb4',
      'RightHandIndex1', 'RightHandIndex2', 'RightHandIndex3', 'RightHandIndex4',
      'RightHandMiddle1', 'RightHandMiddle2', 'RightHandMiddle3', 'RightHandMiddle4',
      'RightHandRing1', 'RightHandRing2', 'RightHandRing3', 'RightHandRing4',
      'RightHandPinky1', 'RightHandPinky2', 'RightHandPinky3', 'RightHandPinky4',
    ];

    const name = joint.name.replace('mixamorig', '');
    const jointExists = jointInfo.some((existingJoint) => existingJoint.name === name);

    if (jointNames.includes(name) && !jointExists) {
      let position = joint.position.toArray();
      if (name === 'Hips') {
        position[1] -= 100;
      }
      const rotation = this.quaternionToEulerDegrees(joint.quaternion);

      jointInfo.push({
        name: name,
        position: position,
        rotation: rotation,
        level: level,
      });
    }

    joint.children.forEach((child) => {
      if (child.type === 'Bone') {
        if (!jointExists) {
          this.traverseHierarchy(child as THREE.Bone, jointInfo, level + 1);
        } else {
          this.traverseHierarchy(child as THREE.Bone, jointInfo, level);
        }
      }
    });
  }

  generateBVH(jointInfo: JointInfo[], motionData: JointInfo[][], frameTime: number = 1 / 30): string {
    let bvhContent = 'HIERARCHY\n';

    jointInfo.forEach((joint, index) => {
      const indentation = '  '.repeat(joint.level);
      bvhContent += `${indentation}${joint.level === 0 ? 'ROOT' : 'JOINT'} ${joint.name}\n`;
      bvhContent += `${indentation}{\n`;
      bvhContent += `${indentation}  OFFSET ${joint.position.join(' ')}\n`;

      if (joint.name === 'Hips') {
        bvhContent += `${indentation}  CHANNELS 6 Xposition Yposition Zposition Xrotation Yrotation Zrotation\n`;
      } else {
        bvhContent += `${indentation}  CHANNELS 3 Xrotation Yrotation Zrotation\n`;
      }

      if (index === jointInfo.length - 1 || jointInfo[index + 1].level <= joint.level) {
        bvhContent += `${indentation}  End Site\n`;
        bvhContent += `${indentation}  {\n`;
        bvhContent += `${indentation}    OFFSET 0 0 0\n`;
        bvhContent += `${indentation}  }\n`;
      }

      if (index < jointInfo.length - 1) {
        const nextJoint = jointInfo[index + 1];
        if (nextJoint.level <= joint.level) {
          for (let i = 0; i < joint.level - nextJoint.level + 1; i++) {
            bvhContent += `${'  '.repeat(joint.level - i)}}\n`;
          }
        }
      }
      if (index === jointInfo.length - 1) {
        for (let i = joint.level; i >= 0; i--) {
          bvhContent += `${'  '.repeat(i)}}\n`;
        }
      }
    });

    const numFrames = motionData.length;
    bvhContent += 'MOTION\n';
    bvhContent += `Frames: ${numFrames}\n`;
    bvhContent += `Frame Time: ${frameTime}\n`;

    motionData.forEach((frame) => {
      frame.forEach((joint) => {
        if (joint.name === 'Hips') {
          bvhContent += `${joint.position.join(' ')} ${joint.rotation.join(' ')} `;
        } else {
          bvhContent += `${joint.rotation.join(' ')} `;
        }
      });
      bvhContent += '\n';
    });

    return bvhContent;
  }
}


