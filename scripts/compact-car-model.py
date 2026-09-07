import copy,json,struct,pathlib
p=pathlib.Path('public/models/entrance/porsche-1975.glb')
raw=p.read_bytes();magic,version,total=struct.unpack_from('<III',raw)
assert magic==0x46546c67 and version==2 and total==len(raw)
n,t=struct.unpack_from('<II',raw,12);assert t==0x4e4f534a
old=json.loads(raw[20:20+n]);pos=20+n
size,t=struct.unpack_from('<II',raw,pos);assert t==0x004e4942 and pos+8+size==len(raw)
binary=raw[pos+8:];g=copy.deepcopy(old);result=bytearray();offsets={}
assert len(g['buffers'])==1 and 'uri' not in g['buffers'][0]
for v in g['bufferViews']:
 assert v['buffer']==0
 data=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
 assert len(data)==v['byteLength']
 if data not in offsets:
  result.extend(b'\0'*(-len(result)%4));offsets[data]=len(result);result.extend(data)
 v['byteOffset']=offsets[data]
result.extend(b'\0'*(-len(result)%4));g['buffers'][0]['byteLength']=len(result)
for a,b in zip(old['bufferViews'],g['bufferViews']):
 assert binary[a.get('byteOffset',0):a.get('byteOffset',0)+a['byteLength']]==result[b['byteOffset']:b['byteOffset']+b['byteLength']]
 assert {k:v for k,v in a.items() if k!='byteOffset'}=={k:v for k,v in b.items() if k!='byteOffset'}
check=copy.deepcopy(g);check['buffers']=old['buffers'];check['bufferViews']=old['bufferViews'];assert check==old
j=json.dumps(g,separators=(',',':'),ensure_ascii=False).encode();j+=b' '*(-len(j)%4)
out=struct.pack('<III',magic,version,28+len(j)+len(result))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(result),0x004e4942)+result
p.write_bytes(out)
print(json.dumps({'before':len(raw),'after':len(out),'saved':len(raw)-len(out),'verifiedViews':len(g['bufferViews'])}))
