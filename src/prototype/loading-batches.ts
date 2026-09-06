// A single item can exceed the budget. Yield before starting another expensive item.
export async function loadingBatches<T>(items:Iterable<T>,work:(item:T)=>void,signal:AbortSignal){
  let batchStarted=performance.now();
  for(const item of items){
    if(signal.aborted)throw new DOMException('Scene loading was cancelled.','AbortError');
    work(item);
    if(performance.now()-batchStarted>=8){
      await new Promise<void>(resolve=>setTimeout(resolve,0));
      batchStarted=performance.now();
    }
  }
  if(signal.aborted)throw new DOMException('Scene loading was cancelled.','AbortError');
}
