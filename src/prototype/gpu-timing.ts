export type GpuSample={at:number;ms:number};

export function createGpuTiming(context:WebGLRenderingContext|WebGL2RenderingContext,record:(sample:GpuSample)=>void){
  if(!('createQuery' in context))return {supported:false,poll(){},begin(_at:number){},end(){},dispose(){}};
  const gl=context;
  const extension=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const pending:{query:WebGLQuery;at:number}[]=[];
  let active:{query:WebGLQuery;at:number}|null=null,disposed=false,disjoint=false;
  function discard(){for(const sample of pending)gl.deleteQuery(sample.query);pending.length=0;}
  return {
    supported:!!extension,
    poll(){
      if(!extension||disposed)return;
      disjoint=gl.isContextLost()||!!gl.getParameter(extension.GPU_DISJOINT_EXT);
      if(disjoint){discard();return;}
      while(pending.length&&gl.getQueryParameter(pending[0].query,gl.QUERY_RESULT_AVAILABLE)){
        const sample=pending.shift()!;
        const ms=gl.getQueryParameter(sample.query,gl.QUERY_RESULT)/1e6;
        gl.deleteQuery(sample.query);
        if(Number.isFinite(ms)&&ms>=0)record({at:sample.at,ms});
      }
    },
    begin(at:number){
      if(!extension||disposed||disjoint||active||pending.length>=4||gl.isContextLost())return;
      const query=gl.createQuery();if(!query)return;
      active={query,at};gl.beginQuery(extension.TIME_ELAPSED_EXT,query);
    },
    end(){
      if(!active||!extension)return;
      gl.endQuery(extension.TIME_ELAPSED_EXT);pending.push(active);active=null;
    },
    dispose(){
      if(disposed)return;disposed=true;
      if(active&&extension){gl.endQuery(extension.TIME_ELAPSED_EXT);gl.deleteQuery(active.query);active=null;}
      discard();
    },
  };
}
