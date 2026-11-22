import numpy as np, sys
def read_hdr(path):
    d=open(path,'rb').read();i=d.index(b'\n\n')+2;le=d.index(b'\n',i);dims=d[i:le].decode().split();h,w=int(dims[1]),int(dims[3]);p=le+1
    img=np.zeros((h,w,4),np.uint8)
    for y in range(h):
        assert d[p]==2 and d[p+1]==2;p+=4
        for c in range(4):
            x=0
            while x<w:
                n=d[p];p+=1
                if n>128:n-=128;img[y,x:x+n,c]=d[p];p+=1
                else:img[y,x:x+n,c]=np.frombuffer(d[p:p+n],np.uint8);p+=n
                x+=n
    e=img[...,3].astype(np.float32);f=np.where(e>0,np.ldexp(1.0,(e-136).astype(np.int32)),0)
    return img[...,:3].astype(np.float32)*f[...,None]
