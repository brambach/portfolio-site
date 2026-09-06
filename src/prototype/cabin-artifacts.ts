import * as THREE from 'three';
import {contactCardPose} from './contact-card-motion';
import {createRoutePaper} from './route-paper';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeTennisRacket, racketPose } from './tennis-racket';
import { LAPTOP_SCREEN, laptopPose } from './laptop-motion';

export function addCabinArtifacts(vehicle: THREE.Group, onChange = () => {}, journeyMode = false, scenicMode = false) {
  const artifacts = new THREE.Group();
  artifacts.name = 'Cabin objects';
  const metal = new THREE.MeshStandardMaterial({ color: '#9eaaa9', metalness: .8, roughness: .33 });
  const dark = new THREE.MeshStandardMaterial({ color: '#121719', metalness: .12, roughness: .56 });
  const laptop = new THREE.Group();
  laptop.name = 'Physical project laptop';
  laptop.userData.artifact = 'laptop';
  const base = new THREE.Mesh(new RoundedBoxGeometry(.338, .012, .238, 3, .005), metal);
  laptop.add(base);
  const keyboard = new THREE.Mesh(new RoundedBoxGeometry(.282, .002, .103, 2, .006), dark);
  keyboard.position.set(0, .006, .035);
  laptop.add(keyboard);
  const keys = new THREE.InstancedMesh(new RoundedBoxGeometry(.016, .002, .014, 1, .0015), dark, 65);
  const transform = new THREE.Matrix4();
  for (let i = 0; i < 65; i++) {
    transform.makeTranslation((i % 13 - 6) * .02, .0085, .072 - Math.floor(i / 13) * .018);
    keys.setMatrixAt(i, transform);
  }
  laptop.add(keys);
  const legendCanvas = document.createElement('canvas');
  legendCanvas.width = 1300; legendCanvas.height = 500;
  const ink = legendCanvas.getContext('2d')!;
  ink.fillStyle = '#b9c1ba';
  ink.font = '24px sans-serif';
  ink.textAlign = 'center'; ink.textBaseline = 'middle';
  const legends = [
    ['esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '⌫'],
    ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
    ['⇪', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", '↵'],
    ['⇧', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', '↑', '⇧'],
    ['fn', 'ctrl', 'alt', '⌘', '', '', '', '', '', '⌘', '←', '↓', '→'],
  ];
  legends.forEach((row, y) => row.forEach((letter, x) => ink.fillText(letter, x * 100 + 50, y * 100 + 50)));
  const legendTexture = new THREE.CanvasTexture(legendCanvas);
  legendTexture.colorSpace = THREE.SRGBColorSpace;
  const legendPlate = new THREE.Mesh(new THREE.PlaneGeometry(.26, .09), new THREE.MeshBasicMaterial({ map: legendTexture, transparent: true, depthWrite: false, opacity: .7 }));
  legendPlate.rotation.x = -Math.PI / 2;
  legendPlate.rotation.z = Math.PI;
  legendPlate.position.set(0, .0096, .036);
  laptop.add(legendPlate);
  const space = new THREE.Mesh(new RoundedBoxGeometry(.099, .002, .013, 1, .002), dark);
  space.position.set(0, .008, -.016);
  laptop.add(space);
  const trackpad = new THREE.Mesh(new RoundedBoxGeometry(.113, .001, .061, 2, .004), new THREE.MeshStandardMaterial({ color: '#a2acab', metalness: .62, roughness: .46 }));
  trackpad.position.set(0, .0065, -.07);
  laptop.add(trackpad);
  const speaker = new THREE.InstancedMesh(new THREE.CircleGeometry(.00065, 4), dark, 168);
  const scratch = new THREE.Object3D();
  scratch.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 168; i++) {
    scratch.position.set((i < 84 ? -1 : 1) * (.149 + (i % 3) * .003), .0068, .082 - Math.floor((i % 84) / 3) * .0035);
    scratch.updateMatrix(); speaker.setMatrixAt(i, scratch.matrix);
  }
  laptop.add(speaker);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .29, 16), dark);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, .005, .111);
  laptop.add(hinge);
  const lid = new THREE.Group();
  lid.name = 'Laptop hinge';
  lid.position.set(0, .009, .111);
  const caseMesh = new THREE.Mesh(new RoundedBoxGeometry(.338, .218, .006, 3, .005), metal);
  caseMesh.position.y = .107;
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(.326, .206, .001, 3, .005), dark);
  bezel.position.set(0, .107, -.0035);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(LAPTOP_SCREEN.width, LAPTOP_SCREEN.height), new THREE.MeshBasicMaterial({ color: '#131b1a' }));
  screen.name = 'Laptop display';
  screen.position.set(0, .11, -.0042);
  screen.rotation.y = Math.PI;
  const webcam = new THREE.Mesh(new THREE.SphereGeometry(.0014, 8, 6), new THREE.MeshPhysicalMaterial({ color: '#0c1921', roughness: .2, clearcoat: 1 }));
  webcam.position.set(0, .210, -.0045);
  const stickerCanvas = document.createElement('canvas');
  stickerCanvas.width = 768; stickerCanvas.height = 256;
  const label = stickerCanvas.getContext('2d')!;
  label.fillStyle = '#e5dfc9'; label.fillRect(0, 0, 768, 256);
  label.fillStyle = '#344237'; label.textAlign = 'center';
  label.font = '500 52px sans-serif'; label.fillText('BRYCE RAMBACH', 384, 108);
  label.font = '36px monospace'; label.fillText('PROJECT NOTES', 384, 175);
  const stickerTexture = new THREE.CanvasTexture(stickerCanvas);
  stickerTexture.colorSpace = THREE.SRGBColorSpace;
  const sticker = new THREE.Mesh(new THREE.PlaneGeometry(.155, .052), new THREE.MeshStandardMaterial({map:stickerTexture, roughness:.85}));
  sticker.position.set(0,.11,.0038);
  lid.add(caseMesh, bezel, screen, webcam, sticker);
  laptop.add(lid);
  artifacts.add(laptop);

  if (!scenicMode) {
    const journal = new THREE.Group();
    journal.name = 'Photo board on the passenger dash';
    journal.position.set(-.5,1.06,.73);
    journal.scale.setScalar(.68);
    journal.rotation.set(-.95,-.1,0);
    journal.userData.artifact = 'journal';
    const backing = new THREE.Mesh(new RoundedBoxGeometry(.49,.023,.35,2,.006),new THREE.MeshStandardMaterial({color:'#745a3b',roughness:1}));
    journal.add(backing);
    const cork = new THREE.Mesh(new THREE.BoxGeometry(.468,.003,.328),new THREE.MeshStandardMaterial({color:'#aa8e62',roughness:1}));
    cork.position.y=.013;
    journal.add(cork);
    const photoLoader = new THREE.TextureLoader();
    ['clay-court','meadow-trail','snowboard-dusk','city-dusk'].forEach((file,index)=>{
      const print = new THREE.Group();
      print.position.set(index%2 ? .114 : -.114,.017,index<2 ? -.079 : .079);
      print.rotation.y = [-.06,.04,.03,-.05][index];
      const paper = new THREE.Mesh(new THREE.BoxGeometry(.198,.0015,.134),new THREE.MeshStandardMaterial({color:'#e6dfcc',roughness:.95}));
      const map = photoLoader.load(`/images/${file}.jpg`,onChange);
      map.colorSpace=THREE.SRGBColorSpace;
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(.181,.105),new THREE.MeshStandardMaterial({map,roughness:.8,color:'#dedbcc'}));
      photo.rotation.x=-Math.PI/2;
      photo.position.set(0,.001,-.006);
      const tape = new THREE.Mesh(new THREE.BoxGeometry(.047,.001,.017),new THREE.MeshStandardMaterial({color:'#c6c2a5',roughness:1}));
      tape.position.set(.009,.0025,-.063);tape.rotation.y=.09;
      print.add(paper,photo,tape);journal.add(print);
    });
    artifacts.add(journal);
  }
  const card = new THREE.Mesh(new THREE.BoxGeometry(.15, .0015, .09), new THREE.MeshStandardMaterial({ color: '#e9e2ce', roughness: .94 }));
  card.name = 'Bryce Rambach contact card';
  if (scenicMode) {
    // The glovebox front is z=.778. The card's back rests against that face.
    card.position.set(-.265, .858, .77725);
    card.rotation.x = -Math.PI / 2;
  } else {
    card.position.set(-.35, 1.092, .76);
    card.rotation.y = -.2;
  }
  card.userData.artifact = 'card';
  const cardCanvas = document.createElement('canvas');
  cardCanvas.width = 1200; cardCanvas.height = 720;
  const cardInk = cardCanvas.getContext('2d')!;
  cardInk.fillStyle = '#e9e2ce'; cardInk.fillRect(0, 0, 1200, 720);
  cardInk.fillStyle = '#314b40';
  cardInk.fillRect(80, 84, 52, 8);
  cardInk.font = '500 72px Georgia, serif';
  cardInk.fillText('Bryce Rambach.', 80, 244);
  cardInk.font = '30px sans-serif';
  cardInk.fillText('DESIGNER & ENGINEER', 84, 306);
  cardInk.fillStyle = '#39443c';
  cardInk.font = '36px sans-serif';
  cardInk.fillText('bryce.rambach@gmail.com', 80, 552);
  cardInk.font = '30px sans-serif';
  cardInk.fillText('github.com/brambach', 80, 609);
  const cardTexture = new THREE.CanvasTexture(cardCanvas);
  cardTexture.colorSpace = THREE.SRGBColorSpace;
  const cardFace = new THREE.Mesh(new THREE.PlaneGeometry(.15, .09), new THREE.MeshStandardMaterial({ map: cardTexture, roughness: .94 }));
  cardFace.name = 'Printed contact details';
  cardFace.rotation.set(-Math.PI / 2, 0, Math.PI);
  cardFace.position.y = .00085;
  cardFace.castShadow = false;
  card.add(cardFace);
  if (scenicMode) {
    const clip = new THREE.Mesh(new RoundedBoxGeometry(.022, .006, .009, 2, .0015), new THREE.MeshStandardMaterial({ color: '#8d886e', metalness: .65, roughness: .48 }));
    clip.name = 'Glovebox card clip';
    clip.position.set(0, .002, .0435);
    clip.position.applyQuaternion(card.quaternion).add(card.position);
    clip.quaternion.copy(card.quaternion);
    artifacts.add(clip);
    const target = new THREE.Mesh(new THREE.BoxGeometry(.20, .025, .125), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    target.name = 'Contact card touch target';
    target.position.y = .012;
    target.userData.pickTarget = true;
    card.add(target);
  }
  artifacts.add(card);
  if(journeyMode)artifacts.add(createRoutePaper());
  const racket = makeTennisRacket();
  artifacts.add(racket);
  artifacts.traverse(object => { if (object instanceof THREE.Mesh && !object.userData.pickTarget) object.castShadow = object.receiveShadow = true; });
  screen.castShadow = false;
  cardFace.castShadow = false;
  vehicle.add(artifacts);
  function update(progress: number, racketProgress = 0, cardProgress = 0) {
    const pose = laptopPose(progress);
    laptop.position.copy(pose.position);
    laptop.rotation.y = pose.rotation;
    lid.rotation.x = pose.lid;
    const contact=contactCardPose(cardProgress,scenicMode);
    card.position.copy(contact.position);card.quaternion.copy(contact.rotation);
    const tennis = racketPose(racketProgress);
    racket.position.copy(tennis.position);
    racket.quaternion.copy(tennis.rotation);
  }
  update(0);
  return { group: artifacts, laptop, racket, card, screen, update };
}
