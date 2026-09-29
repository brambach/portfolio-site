import {describe,expect,it} from 'vitest';
import {PROJECT_BILLBOARDS,billboardAt,billboardPoint} from './project-billboards';
import {roadProjects} from '../projects/road-lineup';
import {scenicAccess,scenicRoad} from './scenic-route';
import {nearAccess} from './journey-route';
import {inTown} from './town-world';
import {scenicTreePlacements} from './scenic-trees';

describe('project billboards on the 3D road', () => {
  it('stand in the same order as /work, Dervo first', () => {
    expect(PROJECT_BILLBOARDS.map(board=>board.project.id)).toEqual(roadProjects.map(project=>project.id));
    expect(PROJECT_BILLBOARDS[0]).toMatchObject({lead:true,mile:'Mile 01 · Now building'});
    expect(PROJECT_BILLBOARDS[1].mile).toBe('Mile 02');
  });

  it('sit on the open road, clear of town and every turn-in, before the lake', () => {
    const lake=scenicAccess.find(access=>access.id==='lake')!;
    for(const board of PROJECT_BILLBOARDS){
      const point=billboardPoint(board);
      expect(inTown(point.x,point.z),board.project.id).toBe(false);
      expect(nearAccess(point.x,point.z,12,scenicAccess),board.project.id).toBe(false);
      expect(board.distance).toBeLessThan(lake.entry-150);
    }
    const gaps=PROJECT_BILLBOARDS.slice(1).map((board,i)=>board.distance-PROJECT_BILLBOARDS[i].distance);
    expect(Math.min(...gaps)).toBeGreaterThan(200);
  });

  it('keep trees from growing through a board', () => {
    const trees=scenicTreePlacements(()=>0);
    for(const board of PROJECT_BILLBOARDS){
      const point=billboardPoint(board);
      expect(trees.some(tree=>tree.point.distanceTo(point.clone().setY(0))<6),board.project.id).toBe(false);
    }
  });

  it('count as pulled over from just before a board to a little past it', () => {
    const lucid=PROJECT_BILLBOARDS.find(board=>board.project.id==='lucid')!;
    expect(billboardAt(lucid.distance+30)?.project.id).toBe('lucid');
    expect(billboardAt(lucid.distance-60)).toBeNull();
    expect(billboardAt(scenicRoad.length*.03)).toBeNull();
  });
});
