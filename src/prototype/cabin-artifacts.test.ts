import {afterEach, describe, expect, it, vi} from 'vitest';
import {Group, Mesh, MeshStandardMaterial, Texture, TextureLoader} from 'three';
import {addCabinArtifacts} from './cabin-artifacts';
import {SceneResources} from './scene-resources';

afterEach(() => vi.restoreAllMocks());

describe('release cabin assets', () => {
  it('avoids photo requests in the scenic release and disposes its printed card', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(), fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const load = vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(() => new Texture());
    const resources = new SceneResources();
    const cabin = addCabinArtifacts(new Group(), () => {}, false, true);
    resources.object(cabin.group);
    expect(load).not.toHaveBeenCalled();
    const face = cabin.card.getObjectByName('Printed contact details') as Mesh;
    const map = (face.material as MeshStandardMaterial).map!;
    const dispose = vi.spyOn(map, 'dispose');
    resources.dispose();
    resources.dispose();
    expect(dispose).toHaveBeenCalledOnce();

    const prototype = addCabinArtifacts(new Group());
    expect(load).toHaveBeenCalledTimes(4);
    const prototypeResources = new SceneResources();
    prototypeResources.object(prototype.group);
    prototypeResources.dispose();
  });
});
