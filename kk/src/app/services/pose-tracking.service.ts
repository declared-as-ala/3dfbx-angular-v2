import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { HolisticResults } from './mediapipe.service';

@Injectable({
  providedIn: 'root'
})
export class PoseTrackingService {
  private indexToName: { [key: number]: string } = {};
  private nameToIndex: { [key: string]: number } = {
    nose: 0, left_eye_inner: 1, left_eye: 2, left_eye_outer: 3,
    right_eye_inner: 4, right_eye: 5, right_eye_outer: 6,
    left_ear: 7, right_ear: 8, mouth_left: 9, mouth_right: 10,
    left_shoulder: 11, right_shoulder: 12, left_elbow: 13, right_elbow: 14,
    left_wrist: 15, right_wrist: 16, left_pinky: 17, right_pinky: 18,
    left_index: 19, right_index: 20, left_thumb: 21, right_thumb: 22,
    left_hip: 23, right_hip: 24, left_knee: 25, right_knee: 26,
    left_ankle: 27, right_ankle: 28, left_heel: 29, right_heel: 30,
    left_foot_index: 31, right_foot_index: 32,
  };

  private indexToNameHands: { [key: number]: string } = {};
  private nameToIndexHands: { [key: string]: number } = {
    wrist: 0, thumb_finger_mcp: 1, thumb_finger_pip: 2, thumb_finger_dip: 3,
    thumb_finger_tip: 4, index_finger_mcp: 5, index_finger_pip: 6,
    index_finger_dip: 7, index_finger_tip: 8, middle_finger_mcp: 9,
    middle_finger_pip: 10, middle_finger_dip: 11, middle_finger_tip: 12,
    ring_finger_mcp: 13, ring_finger_pip: 14, ring_finger_dip: 15,
    ring_finger_tip: 16, pinky_finger_mcp: 17, pinky_finger_pip: 18,
    pinky_finger_dip: 19, pinky_finger_tip: 20,
  };

  constructor() {
    // Initialize index mappings
    Object.entries(this.nameToIndex).forEach(([key, value]) => {
      this.indexToName[value] = key;
    });
    Object.entries(this.nameToIndexHands).forEach(([key, value]) => {
      this.indexToNameHands[value] = key;
    });
  }

  updatePose(model: THREE.Group, results: HolisticResults, camera: THREE.PerspectiveCamera): void {
    if (!results.poseLandmarks) return;

    const poseLandmarksDict: { [key: string]: any } = {};
    results.poseLandmarks.forEach((landmark, i) => {
      poseLandmarksDict[this.indexToName[i]] = landmark;
    });

    const pos3dLandmarks = this.update3dPose(camera, 2.5, new THREE.Vector3(1, 0, -1.5), poseLandmarksDict);

    // Calculate spine joints
    const centerHips = new THREE.Vector3()
      .addVectors(pos3dLandmarks['left_hip'], pos3dLandmarks['right_hip'])
      .multiplyScalar(0.5);
    const centerShoulders = new THREE.Vector3()
      .addVectors(pos3dLandmarks['left_shoulder'], pos3dLandmarks['right_shoulder'])
      .multiplyScalar(0.5);
    const centerEar = new THREE.Vector3()
      .addVectors(pos3dLandmarks['left_ear'], pos3dLandmarks['right_ear'])
      .multiplyScalar(0.5);

    const dirSpine = new THREE.Vector3().subVectors(centerShoulders, centerHips);
    const lengthSpine = dirSpine.length();
    dirSpine.normalize();

    const dirShoulders = new THREE.Vector3().subVectors(
      pos3dLandmarks['right_shoulder'],
      pos3dLandmarks['left_shoulder']
    );

    const newJoints3D: { [key: string]: THREE.Vector3 } = {
      hips: new THREE.Vector3().addVectors(centerHips, dirSpine.clone().multiplyScalar(lengthSpine / 9.0)),
      spine0: new THREE.Vector3().addVectors(centerHips, dirSpine.clone().multiplyScalar((lengthSpine / 9.0) * 3)),
      spine1: new THREE.Vector3().addVectors(centerHips, dirSpine.clone().multiplyScalar((lengthSpine / 9.0) * 5)),
      spine2: new THREE.Vector3().addVectors(centerHips, dirSpine.clone().multiplyScalar((lengthSpine / 9.0) * 7)),
    };

    const neck = new THREE.Vector3().addVectors(centerShoulders, dirSpine.clone().multiplyScalar(lengthSpine / 9.0));
    newJoints3D['neck'] = neck;
    newJoints3D['shoulder_left'] = new THREE.Vector3().addVectors(
      pos3dLandmarks['left_shoulder'],
      dirShoulders.clone().multiplyScalar(1 / 3.0)
    );
    newJoints3D['shoulder_right'] = new THREE.Vector3().addVectors(
      pos3dLandmarks['left_shoulder'],
      dirShoulders.clone().multiplyScalar(2 / 3.0)
    );

    const dirHead = new THREE.Vector3().subVectors(centerEar, neck);
    newJoints3D['head'] = new THREE.Vector3().addVectors(neck, dirHead.clone().multiplyScalar(0.5));

    const dirRightFoot = new THREE.Vector3().subVectors(
      pos3dLandmarks['right_foot_index'],
      pos3dLandmarks['right_heel']
    );
    newJoints3D['right_toebase'] = new THREE.Vector3().addVectors(
      pos3dLandmarks['right_heel'],
      dirRightFoot.clone().multiplyScalar(0.6)
    );

    const dirLeftFoot = new THREE.Vector3().subVectors(
      pos3dLandmarks['left_foot_index'],
      pos3dLandmarks['left_heel']
    );
    newJoints3D['left_toebase'] = new THREE.Vector3().addVectors(
      pos3dLandmarks['left_heel'],
      dirLeftFoot.clone().multiplyScalar(0.6)
    );

    // Update hips
    this.updateHips(model, newJoints3D, pos3dLandmarks);

    // Update neck and head
    this.updateNeckAndHead(model, newJoints3D, pos3dLandmarks);

    // Update arms
    const poseLeftWrist = pos3dLandmarks['left_wrist'];
    const poseRightWrist = pos3dLandmarks['right_wrist'];
    this.updateLeftArm(model, newJoints3D, pos3dLandmarks, poseLeftWrist);
    this.updateRightArm(model, newJoints3D, pos3dLandmarks, poseRightWrist);

    // Update legs
    this.updateLeftLeg(model, newJoints3D, pos3dLandmarks);
    this.updateRightLeg(model, newJoints3D, pos3dLandmarks);

    // Update hands
    if (results.leftHandLandmarks) {
      this.updateLeftHand(model, results.leftHandLandmarks, pos3dLandmarks, poseLeftWrist, camera);
    }
    if (results.rightHandLandmarks) {
      this.updateRightHand(model, results.rightHandLandmarks, pos3dLandmarks, poseRightWrist, camera);
    }
  }

  private update3dPose(camera: THREE.PerspectiveCamera, distFromCam: number, offset: THREE.Vector3, poseLandmarks: { [key: string]: any }): { [key: string]: THREE.Vector3 } {
    const ipLt = new THREE.Vector3(-1, 1, -1).unproject(camera);
    const ipRb = new THREE.Vector3(1, -1, -1).unproject(camera);
    const ipDiff = new THREE.Vector3().subVectors(ipRb, ipLt);
    const xScale = Math.abs(ipDiff.x);

    const projScale = (pMs: THREE.Vector3, camPos: THREE.Vector3, srcD: number, dstD: number) => {
      const vecCam2p = new THREE.Vector3().subVectors(pMs, camPos);
      return new THREE.Vector3().addVectors(camPos, vecCam2p.multiplyScalar(dstD / srcD));
    };

    const pose3dDict: { [key: string]: THREE.Vector3 } = {};
    Object.entries(poseLandmarks).forEach(([key, value]) => {
      const p3d = new THREE.Vector3(
        (value.x - 0.5) * 2.0,
        -(value.y - 0.5) * 2.0,
        0
      ).unproject(camera);
      p3d.z = -value.z * xScale - camera.near + camera.position.z;
      pose3dDict[key] = projScale(p3d, camera.position, camera.near, distFromCam).add(offset);
    });

    return pose3dDict;
  }

  private computeR(A: THREE.Vector3, B: THREE.Vector3): THREE.Matrix4 {
    const uA = A.clone().normalize();
    const uB = B.clone().normalize();
    const idot = uA.dot(uB);
    const crossAB = new THREE.Vector3().crossVectors(uA, uB);
    const cdot = crossAB.length();

    const u = uA.clone();
    const v = new THREE.Vector3().subVectors(uB, uA.clone().multiplyScalar(idot)).normalize();
    const w = crossAB.clone().normalize();

    const C = new THREE.Matrix4().makeBasis(u, v, w).transpose();
    const Ruvw = new THREE.Matrix4().set(
      idot, -cdot, 0, 0,
      cdot, idot, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );

    return new THREE.Matrix4().multiplyMatrices(
      C.clone().transpose(),
      new THREE.Matrix4().multiplyMatrices(Ruvw, C)
    );
  }

  private setRbyCalculatingJoints(
    jointMp: THREE.Vector3,
    jointMpChild: THREE.Vector3,
    jointModel: THREE.Object3D,
    jointModelChild: THREE.Object3D,
    RChain: THREE.Matrix4
  ): void {
    const v = new THREE.Vector3().subVectors(jointMpChild, jointMp).normalize();
    const R = this.computeR(
      jointModelChild.position.clone().normalize(),
      v.applyMatrix4(RChain.clone().transpose())
    );
    if (jointModel.name !== 'mixamorigHead') {
      jointModel.quaternion.setFromRotationMatrix(R);
    }
    RChain.multiply(R);
  }

  private updateHips(model: THREE.Group, newJoints3D: { [key: string]: THREE.Vector3 }, pos3dLandmarks: { [key: string]: THREE.Vector3 }): void {
    const jointHips = newJoints3D['hips'];
    const jointLeftUpLeg = pos3dLandmarks['left_hip'];
    const jointRightUpLeg = pos3dLandmarks['right_hip'];
    const jointSpine0 = newJoints3D['spine0'];

    const boneHips = model.getObjectByName('mixamorigHips');
    const boneLeftUpLeg = model.getObjectByName('mixamorigLeftUpLeg');
    const boneRightUpLeg = model.getObjectByName('mixamorigRightUpLeg');
    const boneSpine0 = model.getObjectByName('mixamorigSpine');

    if (!boneHips || !boneLeftUpLeg || !boneRightUpLeg || !boneSpine0) return;

    const vHiptoLeft = new THREE.Vector3().subVectors(jointLeftUpLeg, jointHips).normalize();
    const vHiptoRight = new THREE.Vector3().subVectors(jointRightUpLeg, jointHips).normalize();
    const vHiptoSpine0 = new THREE.Vector3().subVectors(jointSpine0, jointHips).normalize();

    const RHiptoLeft = this.computeR(boneLeftUpLeg.position.clone().normalize(), vHiptoLeft);
    const QHiptoLeft = new THREE.Quaternion().setFromRotationMatrix(RHiptoLeft);
    const RHiptoRight = this.computeR(boneRightUpLeg.position.clone().normalize(), vHiptoRight);
    const QHiptoRight = new THREE.Quaternion().setFromRotationMatrix(RHiptoRight);
    const RHiptoSpine0 = this.computeR(boneSpine0.position.clone().normalize(), vHiptoSpine0);
    const QHiptoSpine0 = new THREE.Quaternion().setFromRotationMatrix(RHiptoSpine0);

    const QHips = new THREE.Quaternion()
      .copy(QHiptoSpine0)
      .slerp(QHiptoLeft.clone().slerp(QHiptoRight, 0.5), 1 / 3);

    boneHips.quaternion.copy(QHips);
  }

  private updateNeckAndHead(model: THREE.Group, newJoints3D: { [key: string]: THREE.Vector3 }, pos3dLandmarks: { [key: string]: THREE.Vector3 }): void {
    const boneHips = model.getObjectByName('mixamorigHips');
    if (!boneHips) return;

    const RHips = new THREE.Matrix4().extractRotation(boneHips.matrix);
    let RChainNeck = new THREE.Matrix4().identity();
    RChainNeck.multiply(RHips);

    const jointNeck = newJoints3D['neck'];
    const jointHead = newJoints3D['head'];
    const boneNeck = model.getObjectByName('mixamorigNeck');
    const boneHead = model.getObjectByName('mixamorigHead');

    if (!boneNeck || !boneHead) return;

    this.setRbyCalculatingJoints(jointNeck, jointHead, boneNeck, boneHead, RChainNeck);

    const jointLeftEye = pos3dLandmarks['left_eye'];
    const jointRightEye = pos3dLandmarks['right_eye'];
    const boneLeftEye = model.getObjectByName('mixamorigLeftEye');
    const boneRightEye = model.getObjectByName('mixamorigRightEye');

    if (boneLeftEye && boneRightEye) {
      const vLeftEye = new THREE.Vector3().subVectors(jointLeftEye, jointHead).normalize();
      const vRightEye = new THREE.Vector3().subVectors(jointRightEye, jointHead).normalize();
      const RHeadtoLeftEye = this.computeR(
        boneLeftEye.position.clone().normalize(),
        vLeftEye.clone().applyMatrix4(RChainNeck.clone().transpose())
      );
      const RHeadtoRightEye = this.computeR(
        boneRightEye.position.clone().normalize(),
        vRightEye.clone().applyMatrix4(RChainNeck.clone().transpose())
      );
      const QHeadtoLeftEye = new THREE.Quaternion().setFromRotationMatrix(RHeadtoLeftEye);
      const QHeadtoRightEye = new THREE.Quaternion().setFromRotationMatrix(RHeadtoRightEye);
      const QHead = new THREE.Quaternion().copy(QHeadtoLeftEye).slerp(QHeadtoRightEye, 0.5);
      boneHead.quaternion.copy(QHead);
    }
  }

  private updateLeftArm(model: THREE.Group, newJoints3D: { [key: string]: THREE.Vector3 }, pos3dLandmarks: { [key: string]: THREE.Vector3 }, poseLeftWrist: THREE.Vector3): void {
    const boneHips = model.getObjectByName('mixamorigHips');
    if (!boneHips) return;

    const RHips = new THREE.Matrix4().extractRotation(boneHips.matrix);
    let RChainLeftUpper = new THREE.Matrix4().identity();
    RChainLeftUpper.multiply(RHips);

    const jointLeftShoulderInside = newJoints3D['shoulder_left'];
    const jointLeftShoulder = pos3dLandmarks['left_shoulder'];
    const jointLeftElbow = pos3dLandmarks['left_elbow'];
    const jointLeftWrist = pos3dLandmarks['left_wrist'];

    const boneLeftShoulder = model.getObjectByName('mixamorigLeftShoulder');
    const boneLeftArm = model.getObjectByName('mixamorigLeftArm');
    const boneLeftForeArm = model.getObjectByName('mixamorigLeftForeArm');
    const boneLeftHand = model.getObjectByName('mixamorigLeftHand');

    if (!boneLeftShoulder || !boneLeftArm || !boneLeftForeArm || !boneLeftHand) return;

    this.setRbyCalculatingJoints(jointLeftShoulderInside, jointLeftShoulder, boneLeftShoulder, boneLeftArm, RChainLeftUpper);
    this.setRbyCalculatingJoints(jointLeftShoulder, jointLeftElbow, boneLeftArm, boneLeftForeArm, RChainLeftUpper);
    this.setRbyCalculatingJoints(jointLeftElbow, jointLeftWrist, boneLeftForeArm, boneLeftHand, RChainLeftUpper);
  }

  private updateRightArm(model: THREE.Group, newJoints3D: { [key: string]: THREE.Vector3 }, pos3dLandmarks: { [key: string]: THREE.Vector3 }, poseRightWrist: THREE.Vector3): void {
    const boneHips = model.getObjectByName('mixamorigHips');
    if (!boneHips) return;

    const RHips = new THREE.Matrix4().extractRotation(boneHips.matrix);
    let RChainRightUpper = new THREE.Matrix4().identity();
    RChainRightUpper.multiply(RHips);

    const jointRightShoulderInside = newJoints3D['shoulder_left'];
    const jointRightShoulder = pos3dLandmarks['right_shoulder'];
    const jointRightElbow = pos3dLandmarks['right_elbow'];
    const jointRightWrist = pos3dLandmarks['right_wrist'];

    const boneRightShoulder = model.getObjectByName('mixamorigRightShoulder');
    const boneRightArm = model.getObjectByName('mixamorigRightArm');
    const boneRightForeArm = model.getObjectByName('mixamorigRightForeArm');
    const boneRightHand = model.getObjectByName('mixamorigRightHand');

    if (!boneRightShoulder || !boneRightArm || !boneRightForeArm || !boneRightHand) return;

    this.setRbyCalculatingJoints(jointRightShoulderInside, jointRightShoulder, boneRightShoulder, boneRightArm, RChainRightUpper);
    this.setRbyCalculatingJoints(jointRightShoulder, jointRightElbow, boneRightArm, boneRightForeArm, RChainRightUpper);
    this.setRbyCalculatingJoints(jointRightElbow, jointRightWrist, boneRightForeArm, boneRightHand, RChainRightUpper);
  }

  private updateLeftLeg(model: THREE.Group, newJoints3D: { [key: string]: THREE.Vector3 }, pos3dLandmarks: { [key: string]: THREE.Vector3 }): void {
    const boneHips = model.getObjectByName('mixamorigHips');
    if (!boneHips) return;

    const RHips = new THREE.Matrix4().extractRotation(boneHips.matrix);
    let RChainLeftLower = new THREE.Matrix4().identity();
    RChainLeftLower.multiply(RHips);

    const jointLeftUpLeg = pos3dLandmarks['left_hip'];
    const jointLeftKnee = pos3dLandmarks['left_knee'];
    const jointLeftAnkle = pos3dLandmarks['left_ankle'];
    const jointLeftToeBase = newJoints3D['left_toebase'];
    const jointLeftFoot = pos3dLandmarks['left_foot_index'];

    const boneLeftUpLeg = model.getObjectByName('mixamorigLeftUpLeg');
    const boneLeftLeg = model.getObjectByName('mixamorigLeftLeg');
    const boneLeftFoot = model.getObjectByName('mixamorigLeftFoot');
    const boneLeftToeBase = model.getObjectByName('mixamorigLeftToeBase');
    const boneLeftToeEnd = model.getObjectByName('mixamorigLeftToe_End');

    if (!boneLeftUpLeg || !boneLeftLeg || !boneLeftFoot || !boneLeftToeBase || !boneLeftToeEnd) return;

    this.setRbyCalculatingJoints(jointLeftUpLeg, jointLeftKnee, boneLeftUpLeg, boneLeftLeg, RChainLeftLower);
    this.setRbyCalculatingJoints(jointLeftKnee, jointLeftAnkle, boneLeftLeg, boneLeftFoot, RChainLeftLower);
    this.setRbyCalculatingJoints(jointLeftAnkle, jointLeftToeBase, boneLeftFoot, boneLeftToeBase, RChainLeftLower);
    this.setRbyCalculatingJoints(jointLeftToeBase, jointLeftFoot, boneLeftToeBase, boneLeftToeEnd, RChainLeftLower);
  }

  private updateRightLeg(model: THREE.Group, newJoints3D: { [key: string]: THREE.Vector3 }, pos3dLandmarks: { [key: string]: THREE.Vector3 }): void {
    const boneHips = model.getObjectByName('mixamorigHips');
    if (!boneHips) return;

    const RHips = new THREE.Matrix4().extractRotation(boneHips.matrix);
    let RChainRightLower = new THREE.Matrix4().identity();
    RChainRightLower.multiply(RHips);

    const jointRightUpLeg = pos3dLandmarks['right_hip'];
    const jointRightKnee = pos3dLandmarks['right_knee'];
    const jointRightAnkle = pos3dLandmarks['right_ankle'];
    const jointRightToeBase = newJoints3D['right_toebase'];
    const jointRightFoot = pos3dLandmarks['right_foot_index'];

    const boneRightUpLeg = model.getObjectByName('mixamorigRightUpLeg');
    const boneRightLeg = model.getObjectByName('mixamorigRightLeg');
    const boneRightFoot = model.getObjectByName('mixamorigRightFoot');
    const boneRightToeBase = model.getObjectByName('mixamorigRightToeBase');
    const boneRightToeEnd = model.getObjectByName('mixamorigRightToe_End');

    if (!boneRightUpLeg || !boneRightLeg || !boneRightFoot || !boneRightToeBase || !boneRightToeEnd) return;

    this.setRbyCalculatingJoints(jointRightUpLeg, jointRightKnee, boneRightUpLeg, boneRightLeg, RChainRightLower);
    this.setRbyCalculatingJoints(jointRightKnee, jointRightAnkle, boneRightLeg, boneRightFoot, RChainRightLower);
    this.setRbyCalculatingJoints(jointRightAnkle, jointRightToeBase, boneRightFoot, boneRightToeBase, RChainRightLower);
    this.setRbyCalculatingJoints(jointRightToeBase, jointRightFoot, boneRightToeBase, boneRightToeEnd, RChainRightLower);
  }

  private updateLeftHand(model: THREE.Group, handLandmarks: any[], pos3dLandmarks: { [key: string]: THREE.Vector3 }, poseLeftWrist: THREE.Vector3, camera: THREE.PerspectiveCamera): void {
    // Implementation for left hand tracking
    // This is a simplified version - full implementation would include finger tracking
  }

  private updateRightHand(model: THREE.Group, handLandmarks: any[], pos3dLandmarks: { [key: string]: THREE.Vector3 }, poseRightWrist: THREE.Vector3, camera: THREE.PerspectiveCamera): void {
    // Implementation for right hand tracking
    // This is a simplified version - full implementation would include finger tracking
  }
}


