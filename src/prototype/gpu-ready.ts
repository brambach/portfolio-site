// Let queued warmup draws finish without blocking input on the main thread.
export function waitForGpu(context:WebGLRenderingContext|WebGL2RenderingContext,signal:AbortSignal):Promise<boolean>{
  if(signal.aborted)return Promise.reject(new DOMException('Scene loading was cancelled.','AbortError'));
  if(!('fenceSync' in context))return Promise.resolve(false);
  const gl=context;
  const sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);
  if(!sync)return Promise.resolve(false);
  gl.flush();
  return new Promise((resolve,reject)=>{
    const started=performance.now();let timer:ReturnType<typeof setTimeout>|undefined,finished=false;
    function finish(ready:boolean,error?:Error){
      if(finished)return;finished=true;clearTimeout(timer);signal.removeEventListener('abort',abort);gl.deleteSync(sync);
      if(error)reject(error);else resolve(ready);
    }
    function abort(){finish(false,new DOMException('Scene loading was cancelled.','AbortError'));}
    function poll(){
      if(signal.aborted){abort();return;}
      const status=gl.clientWaitSync(sync!,0,0);
      if(status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED){finish(true);return;}
      if(status===gl.WAIT_FAILED||performance.now()-started>=3000){finish(false);return;}
      timer=setTimeout(poll,8);
    }
    signal.addEventListener('abort',abort,{once:true});poll();
  });
}
