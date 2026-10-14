/**
 * 网上国网 App 3.2.3 协议（SM2/SM3/SM4 加密 + Turing 设备令牌）
 *
 * 协议与设备令牌算法移植自 stevenjoezhang/hass-state-grid
 * MIT License, Copyright (c) 2026 stevenjoezhang
 * Scriptable 移植参考 githubdulong/Script Scriptable/SGCC.js
 */
function uk(base, user) { return `${base}_${md5hex(String(user)).slice(0, 8)}`; }
const K = { data: 'sgcc_hark_data2', err: 'sgcc_hark_err2', lock: 'sgcc_hark_lock', dev: 'sgcc_app_dev', sess: 'sgcc_app_sess', sms: 'sgcc_app_sms' };

function clean(v) { return String(v == null ? '' : v).trim(); }
function num(v) { if (typeof v === 'number') return Number.isFinite(v) ? v : NaN; const n = Number(String(v == null ? '' : v).replace(/[^\d.-]/g, '')); return Number.isFinite(n) && String(v == null ? '' : v).trim() !== '' ? n : NaN; }

/* ==================== 加密 ==================== */
// 纯 JS 国网 App 协议加密核心（移植自 MIT 项目 stevenjoezhang/hass-state-grid）
// 原 Copyright (c) 2026 stevenjoezhang, MIT License.
function utf8enc(s){const o=[];for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);if(c>=0xd800&&c<0xdc00&&i+1<s.length){const d=s.charCodeAt(i+1);if(d>=0xdc00&&d<0xe000){c=0x10000+((c-0xd800)<<10)+(d-0xdc00);i++;}}if(c<0x80)o.push(c);else if(c<0x800)o.push(0xc0|(c>>6),0x80|(c&63));else if(c<0x10000)o.push(0xe0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));else o.push(0xf0|(c>>18),0x80|((c>>12)&63),0x80|((c>>6)&63),0x80|(c&63));}return new Uint8Array(o);}
function utf8dec(b){let s='';for(let i=0;i<b.length;){const c=b[i++];let cp;if(c<0x80)cp=c;else if(c<0xe0)cp=((c&31)<<6)|(b[i++]&63);else if(c<0xf0){cp=((c&15)<<12)|((b[i++]&63)<<6)|(b[i++]&63);}else{cp=((c&7)<<18)|((b[i++]&63)<<12)|((b[i++]&63)<<6)|(b[i++]&63);}if(cp>0xffff){cp-=0x10000;s+=String.fromCharCode(0xd800+(cp>>10),0xdc00+(cp&1023));}else s+=String.fromCharCode(cp);}return s;}
function u8(x){ if(x instanceof Uint8Array) return x; if(typeof x==='string') return utf8enc(x); return new Uint8Array(x);}
function toHex(b){let s='';for(let i=0;i<b.length;i++)s+=b[i].toString(16).padStart(2,'0');return s;}
function fromHex(h){const b=new Uint8Array(h.length/2);for(let i=0;i<b.length;i++)b[i]=parseInt(h.substr(i*2,2),16);return b;}
function rotl(x,n){n&=31;return ((x<<n)|(x>>>(32-n)))>>>0;}

/* ===== MD5 ===== */
function md5(input){
  const msg=u8(input);
  const S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const Kt=[];for(let i=0;i<64;i++)Kt[i]=(Math.floor(Math.abs(Math.sin(i+1))*4294967296))>>>0;
  const ml=msg.length;const bl=ml*8;
  const withpad=((ml+8)>>6)+1;const buf=new Uint8Array(withpad*64);
  buf.set(msg);buf[ml]=0x80;const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-8,bl>>>0,true);dv.setUint32(buf.length-4,Math.floor(bl/4294967296)>>>0,true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for(let off=0;off<buf.length;off+=64){
    const M=[];for(let i=0;i<16;i++)M[i]=dv.getUint32(off+i*4,true);
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){let F,g;
      if(i<16){F=(B&C)|((~B>>>0)&D);g=i;}
      else if(i<32){F=(D&B)|((~D>>>0)&C);g=(5*i+1)&15;}
      else if(i<48){F=B^C^D;g=(3*i+5)&15;}
      else{F=C^(B|(~D>>>0));g=(7*i)&15;}
      F=(F+A+Kt[i]+M[g])>>>0;A=D;D=C;C=B;B=(B+rotl(F,S[i]))>>>0;
    }
    a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0;
  }
  const out=new Uint8Array(16);const o=new DataView(out.buffer);
  o.setUint32(0,a0,true);o.setUint32(4,b0,true);o.setUint32(8,c0,true);o.setUint32(12,d0,true);
  return out;
}
const md5hex=x=>toHex(md5(x));

/* ===== SHA-256 / HMAC ===== */
function sha256(input){
  const msg=u8(input);
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const ml=msg.length;const bl=ml*8;
  const withpad=((ml+8)>>6)+1;const buf=new Uint8Array(withpad*64);
  buf.set(msg);buf[ml]=0x80;const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-4,bl>>>0);dv.setUint32(buf.length-8,Math.floor(bl/4294967296)>>>0);
  const w=new Array(64);
  for(let off=0;off<buf.length;off+=64){
    for(let i=0;i<16;i++)w[i]=dv.getUint32(off+i*4);
    for(let i=16;i<64;i++){const s0=rotl(w[i-15],25)^rotl(w[i-15],14)^(w[i-15]>>>3);const s1=rotl(w[i-2],15)^rotl(w[i-2],13)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}
    let [a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){const S1=rotl(e,26)^rotl(e,21)^rotl(e,7);const ch=(e&f)^((~e>>>0)&g);const t1=(h+S1+ch+K[i]+w[i])>>>0;const S0=rotl(a,30)^rotl(a,19)^rotl(a,10);const maj=(a&b)^(a&c)^(b&c);const t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
    H=[(H[0]+a)>>>0,(H[1]+b)>>>0,(H[2]+c)>>>0,(H[3]+d)>>>0,(H[4]+e)>>>0,(H[5]+f)>>>0,(H[6]+g)>>>0,(H[7]+h)>>>0];
  }
  const out=new Uint8Array(32);const o=new DataView(out.buffer);
  for(let i=0;i<8;i++)o.setUint32(i*4,H[i]);
  return out;
}
function hmacSha256(key,msg){
  key=u8(key);msg=u8(msg);
  if(key.length>64)key=sha256(key);
  const k=new Uint8Array(64);k.set(key);
  const ip=new Uint8Array(64),op=new Uint8Array(64);
  for(let i=0;i<64;i++){ip[i]=k[i]^0x36;op[i]=k[i]^0x5c;}
  const inner=sha256(concat(ip,msg));
  return sha256(concat(op,inner));
}
function concat(...arrs){let n=0;for(const a of arrs)n+=a.length;const o=new Uint8Array(n);let p=0;for(const a of arrs){o.set(a,p);p+=a.length;}return o;}

/* ===== SM3 ===== */
function sm3(input){
  const m=u8(input);const len=m.length;const bitLen=len*8;
  const padLen=((len%64)<56?56:120)-(len%64);
  const buf=new Uint8Array(len+padLen+8);buf.set(m);buf[len]=0x80;
  const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-4,bitLen>>>0);dv.setUint32(buf.length-8,Math.floor(bitLen/4294967296)>>>0);
  let V=[0x7380166f,0x4914b2b9,0x172442d7,0xda8a0600,0xa96f30bc,0x163138aa,0xe38dee4d,0xb0fb0e4e];
  for(let b=0;b<buf.length;b+=64){
    const W=new Array(68),W1=new Array(64);
    for(let i=0;i<16;i++)W[i]=dv.getUint32(b+i*4);
    for(let i=16;i<68;i++){const x=W[i-16]^W[i-9]^rotl(W[i-3],15);W[i]=(x^rotl(x,15)^rotl(x,23)^rotl(W[i-13],7)^W[i-6])>>>0;}
    for(let i=0;i<64;i++)W1[i]=(W[i]^W[i+4])>>>0;
    let [A,B,C,D,E,F,G,H]=V;
    for(let j=0;j<64;j++){const Tj=j<16?0x79cc4519:0x7a879d8a;const SS1=rotl((rotl(A,12)+E+rotl(Tj,j))>>>0,7);const SS2=(SS1^rotl(A,12))>>>0;const FF=j<16?(A^B^C):((A&B)|(A&C)|(B&C));const GG=j<16?(E^F^G):((E&F)|((~E>>>0)&G));const TT1=(FF+D+SS2+W1[j])>>>0;const TT2=(GG+H+SS1+W[j])>>>0;D=C;C=rotl(B,9);B=A;A=TT1;H=G;G=rotl(F,19);F=E;E=(TT2^rotl(TT2,9)^rotl(TT2,17))>>>0;}
    V=[(V[0]^A)>>>0,(V[1]^B)>>>0,(V[2]^C)>>>0,(V[3]^D)>>>0,(V[4]^E)>>>0,(V[5]^F)>>>0,(V[6]^G)>>>0,(V[7]^H)>>>0];
  }
  const out=new Uint8Array(32);const o=new DataView(out.buffer);for(let i=0;i<8;i++)o.setUint32(i*4,V[i]);return out;
}
const sm3hex=x=>toHex(sm3(x));
// sm3 kdf: z is bytes
function sm3kdf(z,klen){let ct=1;let out=new Uint8Array(0);const n=Math.ceil(klen/32);for(let i=0;i<n;i++){const cnt=new Uint8Array(4);new DataView(cnt.buffer).setUint32(0,ct);out=concat(out,sm3(concat(z,cnt)));ct++;}return out.slice(0,klen);}

/* ===== SM4 ECB PKCS7 ===== */
const SM4_SBOX=fromHex('d690e9fecce13db716b614c228fb2c05 2b679a762abe04c3aa441326498606999c4250f491ef987a33540b43edcfac62 e4b31ca9c908e89580df94fa758f3fa6 4707a7fcf37317ba83593c19e6854fa8 686b81b27164da8bf8eb0f4b70569d35 1e240e5e6358d1a225227c3b01217887 d40046579fd327524c3602e7a0c4c89e eabf8ad240c738b5a3f7f2cef96115a1 e0ae5da49b341a55ad933230f58cb1e3 1df6e22e8266ca60c02923ab0d534e6f d5db3745defd8e2f03ff6a726d6c5b51 8d1baf92bbddbc7f11d95c411f105ad8 0ac13188a5cd7bbd2d74d012b8e5b4b0 8969974a0c96777e65b9f109c56ec684 18f07dec3adc4d2079ee5f3ed7cb3948'.replace(/\s/g,''));
const SM4_CK=[0x00070e15,0x1c232a31,0x383f464d,0x545b6269,0x70777e85,0x8c939aa1,0xa8afb6bd,0xc4cbd2d9,0xe0e7eef5,0xfc030a11,0x181f262d,0x343b4249,0x50575e65,0x6c737a81,0x888f969d,0xa4abb2b9,0xc0c7ced5,0xdce3eaf1,0xf8ff060d,0x141b2229,0x30373e45,0x4c535a61,0x686f767d,0x848b9299,0xa0a7aeb5,0xbcc3cad1,0xd8dfe6ed,0xf4fb0209,0x10171e25,0x2c333a41,0x484f565d,0x646b7279];
const SM4_FK=[0xa3b1bac6,0x56aa3350,0x677d9197,0xb27022dc];
function sm4tau(a){return ((SM4_SBOX[(a>>>24)&0xff]<<24)|(SM4_SBOX[(a>>>16)&0xff]<<16)|(SM4_SBOX[(a>>>8)&0xff]<<8)|SM4_SBOX[a&0xff])>>>0;}
function sm4L(b){return (b^rotl(b,2)^rotl(b,10)^rotl(b,18)^rotl(b,24))>>>0;}
function sm4Lp(b){return (b^rotl(b,13)^rotl(b,23))>>>0;}
function sm4Key(key){const MK=[];for(let i=0;i<4;i++)MK[i]=((key[i*4]<<24)|(key[i*4+1]<<16)|(key[i*4+2]<<8)|key[i*4+3])>>>0;const K=[MK[0]^SM4_FK[0],MK[1]^SM4_FK[1],MK[2]^SM4_FK[2],MK[3]^SM4_FK[3]];const rk=[];for(let i=0;i<32;i++){const t=(K[i+1]^K[i+2]^K[i+3]^SM4_CK[i])>>>0;const r=(K[i]^sm4Lp(sm4tau(t)))>>>0;K[i+4]=r;rk[i]=r;}return rk;}
function sm4Block(rk,inp,enc){let X=[((inp[0]<<24)|(inp[1]<<16)|(inp[2]<<8)|inp[3])>>>0,((inp[4]<<24)|(inp[5]<<16)|(inp[6]<<8)|inp[7])>>>0,((inp[8]<<24)|(inp[9]<<16)|(inp[10]<<8)|inp[11])>>>0,((inp[12]<<24)|(inp[13]<<16)|(inp[14]<<8)|inp[15])>>>0];for(let i=0;i<32;i++){const k=enc?rk[i]:rk[31-i];const t=(X[i+1]^X[i+2]^X[i+3]^k)>>>0;X[i+4]=(X[i]^sm4L(sm4tau(t)))>>>0;}const o=[X[35],X[34],X[33],X[32]];const out=new Uint8Array(16);for(let i=0;i<4;i++){out[i*4]=(o[i]>>>24)&0xff;out[i*4+1]=(o[i]>>>16)&0xff;out[i*4+2]=(o[i]>>>8)&0xff;out[i*4+3]=o[i]&0xff;}return out;}
function sm4EncryptEcb(data,key){const rk=sm4Key(key);const pad=16-(data.length%16);const buf=new Uint8Array(data.length+pad);buf.set(data);for(let i=data.length;i<buf.length;i++)buf[i]=pad;const out=new Uint8Array(buf.length);for(let i=0;i<buf.length;i+=16)out.set(sm4Block(rk,buf.subarray(i,i+16),true),i);return out;}
function sm4DecryptEcb(data,key){const rk=sm4Key(key);const out=new Uint8Array(data.length);for(let i=0;i<data.length;i+=16)out.set(sm4Block(rk,data.subarray(i,i+16),false),i);const pad=out[out.length-1];return out.slice(0,out.length-pad);}
// App: key text 32 hex chars, uses first 16 ASCII bytes as key
function sm4KeyBytes(keyText){return u8(keyText.slice(0,16));}
function sm4EncryptHex(plain,keyText){return toHex(sm4EncryptEcb(u8(plain),sm4KeyBytes(keyText))).toUpperCase();}
function sm4DecryptHex(hex,keyText){return sm4DecryptEcb(fromHex(hex),sm4KeyBytes(keyText));}

/* ===== AES-256 ECB (check code) ===== */
// robust AES sbox
function aesSboxCompute(){const sbox=new Uint8Array(256);let p=1,q=1;do{p=p^(p<<1)^((p&0x80)?0x11b:0);p&=0xff;q^=q<<1;q^=q<<2;q^=q<<4;q&=0xff;if(q&0x80)q^=0x09;const xf=q^((q<<1)|(q>>>7))^((q<<2)|(q>>>6))^((q<<3)|(q>>>5))^((q<<4)|(q>>>4));sbox[p]=(xf^0x63)&0xff;}while(p!==1);sbox[0]=0x63;return sbox;}
const ASB=aesSboxCompute();
function aesExpand(key){const Nk=8,Nr=14,w=new Uint8Array(4*4*(Nr+1));w.set(key);const rcon=[0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36,0x6c,0xd8,0xab,0x4d];let i=Nk;const tmp=new Uint8Array(4);while(i<4*(Nr+1)){for(let k=0;k<4;k++)tmp[k]=w[(i-1)*4+k];if(i%Nk===0){const t=tmp[0];tmp[0]=ASB[tmp[1]]^rcon[i/Nk-1];tmp[1]=ASB[tmp[2]];tmp[2]=ASB[tmp[3]];tmp[3]=ASB[t];}else if(i%Nk===4){for(let k=0;k<4;k++)tmp[k]=ASB[tmp[k]];}for(let k=0;k<4;k++)w[i*4+k]=w[(i-Nk)*4+k]^tmp[k];i++;}return {w,Nr};}
function xtime(a){return ((a<<1)^((a&0x80)?0x11b:0))&0xff;}
function aesEncryptBlock(st,w,Nr){const s=st.slice();for(let k=0;k<16;k++)s[k]^=w[k];for(let r=1;r<Nr;r++){for(let k=0;k<16;k++)s[k]=ASB[s[k]];// shiftrows (column-major state: s[r+4c])
    aesShift(s);aesMix(s);for(let k=0;k<16;k++)s[k]^=w[r*16+k];}
  for(let k=0;k<16;k++)s[k]=ASB[s[k]];aesShift(s);for(let k=0;k<16;k++)s[k]^=w[Nr*16+k];return s;}
function aesShift(s){const t=[s[0],s[5],s[10],s[15],s[4],s[9],s[14],s[3],s[8],s[13],s[2],s[7],s[12],s[1],s[6],s[11]];for(let i=0;i<16;i++)s[i]=t[i];}
function aesMix(s){for(let c=0;c<4;c++){const o=c*4;const a0=s[o],a1=s[o+1],a2=s[o+2],a3=s[o+3];s[o]=xtime(a0)^(xtime(a1)^a1)^a2^a3;s[o+1]=a0^xtime(a1)^(xtime(a2)^a2)^a3;s[o+2]=a0^a1^xtime(a2)^(xtime(a3)^a3);s[o+3]=(xtime(a0)^a0)^a1^a2^xtime(a3);}}
function aes256EcbEncrypt(data,key){const {w,Nr}=aesExpand(key);const pad=16-(data.length%16);const buf=new Uint8Array(data.length+pad);buf.set(data);for(let i=data.length;i<buf.length;i++)buf[i]=pad;const out=new Uint8Array(buf.length);for(let i=0;i<buf.length;i+=16)out.set(aesEncryptBlock(buf.subarray(i,i+16),w,Nr),i);return out;}

/* ===== SM2 ===== */
const SM2_P=BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF');
const SM2_A=BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC');
const SM2_B=BigInt('0x28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93');
const SM2_GX=BigInt('0x32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7');
const SM2_GY=BigInt('0xBC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0');
function mod(a,m){return ((a%m)+m)%m;}
function inv(a,m){let [old_r,r]=[mod(a,m),m];let [old_s,s]=[1n,0n];while(r!==0n){const q=old_r/r;[old_r,r]=[r,old_r-q*r];[old_s,s]=[s,old_s-q*s];}return mod(old_s,m);}
function ptAdd(P,Q){if(!P)return Q;if(!Q)return P;const [x1,y1]=P,[x2,y2]=Q;if(x1===x2&&mod(y1+y2,SM2_P)===0n)return null;let l;if(x1===x2&&y1===y2){l=mod((3n*x1*x1+SM2_A)*inv(2n*y1,SM2_P),SM2_P);}else{l=mod((y2-y1)*inv(mod(x2-x1,SM2_P),SM2_P),SM2_P);}const x3=mod(l*l-x1-x2,SM2_P);const y3=mod(l*(x1-x3)-y1,SM2_P);return [x3,y3];}
function ptMul(k,P){let R=null,N=P;while(k>0n){if(k&1n)R=ptAdd(R,N);N=ptAdd(N,N);k>>=1n;}return R;}
const G=[SM2_GX,SM2_GY];
function b32(n){let h=n.toString(16).padStart(64,'0');return fromHex(h);}
// encrypt 32-char key text ascii -> "04"+C1C3C2 hex (mode 1)
function sm2EncryptKey(keyText,serverPubHex){const msg=u8(keyText);let pub=serverPubHex;if(pub.length===130)pub=pub.slice(2);const px=BigInt('0x'+pub.slice(0,64)),py=BigInt('0x'+pub.slice(64));
  let k,C1,xy;do{k=BigInt('0x'+toHex(randomBytes(32)))%SM2_P;if(k===0n)continue;C1=ptMul(k,G);xy=ptMul(k,[px,py]);}while(!C1||!xy);
  const x2=b32(xy[0]),y2=b32(xy[1]);const t=sm3kdf(concat(x2,y2),msg.length);let ok=false;for(const b of t)if(b!==0){ok=true;break;}if(!ok)return sm2EncryptKey(keyText,serverPubHex);
  const C2=new Uint8Array(msg.length);for(let i=0;i<msg.length;i++)C2[i]=msg[i]^t[i];
  const C3=sm3(concat(x2,msg,y2));
  const c1hex=b32(C1[0]).length?toHex(b32(C1[0]))+toHex(b32(C1[1])):'';
  return '04'+toHex(concat(b32(C1[0]),b32(C1[1]),C3,C2));
}
function sm2DecryptKey(wrapHex,privHex){let w=wrapHex.toLowerCase().startsWith('04')?wrapHex.slice(2):wrapHex;const C1=[BigInt('0x'+w.slice(0,64)),BigInt('0x'+w.slice(64,128))];const C3=w.slice(128,192);const C2=fromHex(w.slice(192));const d=BigInt('0x'+privHex);const xy=ptMul(d,C1);const x2=b32(xy[0]),y2=b32(xy[1]);const t=sm3kdf(concat(x2,y2),C2.length);const M=new Uint8Array(C2.length);for(let i=0;i<C2.length;i++)M[i]=C2[i]^t[i];return M;}
function sm2DerivePub(privHex){const d=BigInt('0x'+privHex);const P=ptMul(d,G);return toHex(b32(P[0]))+toHex(b32(P[1]));}

/* ===== random ===== */
function randomBytes(n){if(typeof globalThis!=='undefined'&&globalThis.crypto&&globalThis.crypto.getRandomValues){const b=new Uint8Array(n);globalThis.crypto.getRandomValues(b);return b;}const b=new Uint8Array(n);for(let i=0;i<n;i++)b[i]=Math.floor(Math.random()*256);return b;}

/* ===== turing hash64 (BigInt) ===== */
const M64=(1n<<64n)-1n;const TMUL=0xC6A4A7935BD1E995n;
function u64(v){return v&M64;}
function mix47(v){v=u64(v);return u64(v^(v>>47n));}
function turingHash64(data,seed){data=u8(data);const length=BigInt(data.length);let state=u64(u64(length*TMUL)^BigInt(seed>>>0));const blocks=data.length>>3;for(let i=0;i<blocks;i++){let word=0n;for(let j=7;j>=0;j--)word=(word<<8n)|BigInt(data[i*8+j]);word=u64(mix47(u64(word*TMUL))*TMUL);state=u64((word^state)*TMUL);}const tail=data.subarray(blocks*8);if(tail.length>=7)state^=BigInt(tail[6])<<48n;if(tail.length>=6)state^=BigInt(tail[5])<<40n;if(tail.length>=5)state^=BigInt(tail[4])<<32n;if(tail.length>=4)state^=BigInt(tail[3])<<24n;if(tail.length>=3)state^=BigInt(tail[2])<<16n;if(tail.length>=2)state^=0x118727C03FB9FFC6n&(BigInt(tail[1])<<8n);if(tail.length>=1){state^=BigInt(tail[0]);state=u64(state*TMUL);}state=mix47(state);state=u64(state*TMUL);return mix47(state);}

/* ===== XXTEA (Quarenden.a with embedded length) ===== */
const DELTA=0x9E3779B9;
function _xxteaKey(keyBytes){let material=keyBytes&&keyBytes.length?keyBytes:u8('DFG#$%^#%$RGHR(&*M<><');if(material.length>16)material=md5(material);const m=new Uint8Array(16);m.set(material.subarray(0,16));const dv=new DataView(m.buffer);return [dv.getUint32(0,true),dv.getUint32(4,true),dv.getUint32(8,true),dv.getUint32(12,true)];}
function _mx(sum,y,z,p,e,key){return (((((z>>>5)^((y<<2)>>>0))>>>0)+(((y>>>3)^((z<<4)>>>0))>>>0))>>>0 ^ ((((y^sum)>>>0)+((z^key[(p&3)^e])>>>0))>>>0))>>>0;}
function xxteaEncrypt(plain,keyBytes){if(!plain.length)return plain;const count=((plain.length/4)|0)+(plain.length%4===0?1:2);const values=new Array(count).fill(0);for(let i=0;i<plain.length;i++)values[i>>2]=(values[i>>2]|(plain[i]<<((i%4)*8)))>>>0;values[count-1]=plain.length;const n=count-1;const key=_xxteaKey(keyBytes);let rounds=6+((52/(n+1))|0);let total=0;let z=values[n];while(rounds){total=(total+DELTA)>>>0;const e=(total>>>2)&3;for(let p=0;p<n;p++){const y=values[p+1];values[p]=(values[p]+_mx(total,y,z,p,e,key))>>>0;z=values[p];}const y=values[0];values[n]=(values[n]+_mx(total,y,z,n,e,key))>>>0;z=values[n];rounds--;}const out=new Uint8Array(count*4);const dv=new DataView(out.buffer);for(let i=0;i<count;i++)dv.setUint32(i*4,values[i],true);return out;}

/* ===== RSA PKCS1 v1.5 (Turing public key) ===== */
const RSA_N=BigInt('0xb595f83a8a0ee3c16261addfc3353e7e13c73b762c3013f53225752a9fa8b0d0c33ed7f810f0a3bb323be5e6bef036eaf2e41e0975accd2a565161f573617492197904e0b30cbc9dd7aea2e079e1de3596dcf36ef444e1f3569987d737e7753e7367e893f9cf71ea661a6de3977199adcc6937dff6c1870297eb744d6473f8fb93367d17f3f51fe229e6c5424359c95985aa3ca18299334f6b1fa2d16198accc057d1e93b76fd385774fbf040453a9dfaa51b7ce6cc8778c6bc84148ec6e9213fadb4f96a4b84728953d4546d60c98b92fbf5cd5db079f4c90c968ac8ce3edeb2f0bde85e4e6399ca97b86faee15f1ef1296e8e0e2f88e6bde00c520bb871225');
const RSA_E=65537n;
function modpow(b,e,m){let r=1n;b%=m;while(e>0n){if(e&1n)r=(r*b)%m;e>>=1n;b=(b*b)%m;}return r;}
function rsaEncrypt(message){const size=256;const ps=size-message.length-3;const pad=new Uint8Array(ps);let f=0;while(f<ps){const r=randomBytes(ps);for(let i=0;i<r.length&&f<ps;i++)if(r[i]!==0)pad[f++]=r[i];}const enc=concat(new Uint8Array([0,2]),pad,new Uint8Array([0]),message);const c=modpow(BigInt('0x'+toHex(enc)),RSA_E,RSA_N);return b256(c,size);}
function b256(n,size){let h=n.toString(16).padStart(size*2,'0');return fromHex(h);}

/* ===== deflate (stored blocks) + zlib wrapper ===== */
function adler32(data){let a=1,b=0;for(let i=0;i<data.length;i++){a=(a+data[i])%65521;b=(b+a)%65521;}return ((b<<16)|a)>>>0;}
function zlibCompressStored(data){const parts=[new Uint8Array([0x78,0x01])];let i=0;while(i<data.length){const len=Math.min(65535,data.length-i);const last=(i+len>=data.length)?1:0;const hdr=new Uint8Array(5);hdr[0]=last;hdr[1]=len&0xff;hdr[2]=(len>>8)&0xff;hdr[3]=(~len)&0xff;hdr[4]=((~len)>>8)&0xff;parts.push(hdr,data.subarray(i,i+len));i+=len;}const ad=adler32(data);parts.push(new Uint8Array([(ad>>>24)&0xff,(ad>>>16)&0xff,(ad>>>8)&0xff,ad&0xff]));return concat(...parts);}


/* ==================== Turing 设备令牌 ==================== */
const REF_NATIVE = {"21":"0","108":"5","7":"","10":"5939.59,5939.59","105":"100","14":"1080*2154","101":"0","152":"0","103":"0","104":"2","33":"33","11":"type=1:name=Goldfish 3-axis Accelerometer:vendor=The Android Open Source Project:resolution=2.480159E-4:,type=4:name=Goldfish 3-axis Gyroscope:vendor=The Android Open Source Project:resolution=0.001:,type=2:name=Goldfish 3-axis Magnetic field sensor:vendor=The Android Open Source Project:resolution=0.5:,type=5:name=Goldfish Light sensor:vendor=The Android Open Source Project:resolution=1.0:,type=6:name=Goldfish Pressure sensor:vendor=The Android Open Source Project:resolution=1.0:,","24":"sdk_gphone64_arm64","12":"","23":"google","8":"google/sdk_gphone64_arm64/emu64a:13/TE1A.240213.009/12342917:userdebug/dev-keys","13":"1000.0","25":"13","20":"0","100":"","22":"","102":"0","106":"","115":"","113":"0","114":"0","44":"","35":"","42":"Google","107":"com.sgcc.wsgw.cn_DAB5608ECD1ABEF80E5FA277CF3B8D50","200":"32,2,3,4,36,5,6,40,136,43,45,143,144,10002,19,10003","116":"","117":"1","45":"","118":"v4;-1_v6;-1","120":"rwxp;/apex/com.android.art/lib64/libart.so,rwxp;/apex/com.android.runtime/lib64/bionic/libdl.so,rwxp;/system/lib64/libz.so","121":"","122":"","135":"tmpfs:/dev:tmpfs:rw&seclabel&nosuid&relatime&mode=755,tmpfs:/mnt:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755&gid=1000,/dev/fuse:/mnt/installer/0/emulated:fuse:rw&lazytime&nosuid&nodev&noexec&noatime&user_id=0&group_id=0&allow_other,/dev/block/platform/a003c00.virtio_mmio/by-name/metadata:/metadata:ext4:rw&seclabel&nosuid&nodev&noatime,tmpfs:/apex:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755,tmpfs:/apex/apex-info-list.xml:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755,/dev/fuse:/storage/emulated:fuse:rw&lazytime&nosuid&nodev&noexec&noatime&user_id=0&group_id=0&allow_other,tmpfs:/data/data:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/user:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/user_de:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/misc/profiles/cur:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/misc/profiles/ref:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,/dev/block/loop::13,/dev/block/dm::71","124":"","131":"0,0,Built-in Screen,1080x2220,131,1,0,","137":"-8233870966039513836:enforcing,7247450386580705748:0,3920320800439300925:T-Mobile","133":"android.content.pm.IPackageManager$Stub$Proxy,,","140":"0,0,,0,,","138":"5,1","149":"en-US","150":"Asia/Shanghai","151":"310260","9":"/dev/block/dm-0:802660,tmpfs:1006268,tmpfs:1006268,/dev/block/dm-4:98620,/dev/block/dm-3:2122372,/dev/block/dm-2:175392,tmpfs:1006268,/dev/block/loop4:784,","15":"Ring_Synth_04.ogg","46":"0","51":""};
const JAVA_CONST = {"2013":"/dev/qemu_pipe,/dev/vboxguest,/dev/vboxuser,/system/framework/org.lineageos.platform-res.apk,/system/lib/ccc,/dev/socket/baseband_genyd,/sys/class/misc/vboxguest,/system/priv-app/CMSettingsProvider,/system/lib64/ccc,/ueventd.ttVM_x86.rc,/init.ttVM_x86.rc,/system/lib/hw/sensors.vbox86.so,/hmdocker,/system/lib/libnemuVMprop.so,/system/bin/magiskpolicy,/system/bin/qemud,/ueventd.vbox86.rc,/system/bin/androVM_setprop,/dev/socket/genyd,/sys/module/vboxguest,/system/priv-app/LineageSettingsProvider,/system/lib/hw/gps.vbox86.so,/system/etc/init.buildroid.sh,/system/lib/hw/audio.primary.vbox86.so,/sys/qemu_trace,/sys/class/misc/vboxuser,/system/bin/mount.nemusf,/ueventd.andy.rc,/system/priv-app/vmos-pro-intent,/sys/module/vboxvideo,/system/lib/hw/gralloc.vbox86.so,/proc/device-tree/goldfish_pipe@a060000,/system/addon.d/50-lineage.sh,/system/priv-app/romex,/system/lib64/arm64/nb/libc.so,/dev/socket/qemud,/data/.bluestacks.prop,/ueventd.android_x86.rc,/.dockerenv,/system/bin/magisk,/system/lib64/libc.so,/system/lib64/.aa,/fstab.andy,/dev/apksafe_pipe,/fstab.vbox86,/ueventd.nox.rc,/init.nox.rc,/system/app/DotPapers,/system/lib/.aa,/init.goldfish.rc,/x86.prop,/dev/mumuvmmguest,/dev/mumuvmmuser,/proc/device-tree/virtio_mmio@a000000,/system/bin/nemuVM-nemu-service,/sys/module/vboxsf,/dev/goldfish_pipe,/system/lib/hw/camera.vbox86.so,/system/priv-app/MuMuAudio,/sys/devices/virtual/misc/vboxguest,/system/bin/androVM-prop,/sys/devices/virtual/misc/vboxuser,/system/addon.d/99-magisk.sh,/fstab.nox,/system/lib64/libriruloader.so,/fstab.ttVM_x86,/system/etc/mumu-configs,/init.vbox86.rc","2016":"com/wind/xpatch/proxy/XpatchProxyApplication,de/robv/android/xposed/XposedHelpers,com/wind/xposed/entry/XposedModuleEntry,com/bug/fuck/fuck","2017":"ro.boot.flash.locked,ro.boot.vbmeta.device_state,ro.boot.verifiedbootstate,ro.boot.veritymode,ro.boot.warranty_bit,ro.debuggable,ro.secure,ro.secureboot.lockstate,ro.vendor.boot.warranty_bit,ro.vendor.warranty_bit,ro.warranty_bit,vendor.boot.vbmeta.device_state,ro.lineage.device,ro.dotOS.device,ro.dalvik.vm.native.bridge,nemud.player_package,init.svc.nemuinit"};
const PKG='com.sgcc.wsgw.cn',CHANNEL='10000191',BUILD_MARKER='77F2B17A00A92C71';
/* ===== JCE writer ===== */
class Jce{constructor(){this.b=[];}
  head(tag,t){if(tag<15)this.b.push((tag<<4)|t);else{this.b.push(0xF0|t,tag);}}
  zero(tag){this.head(tag,12);}
  byte(tag,v){v=Number(v);if(v===0)this.zero(tag);else{this.head(tag,0);this.b.push(v&0xff);}}
  short(tag,v){v=Number(v);if(v>=-128&&v<=127)this.byte(tag,v);else{this.head(tag,1);this.b.push((v>>8)&0xff,v&0xff);}}
  int32(tag,v){v=Number(v);if(v>=-32768&&v<=32767)this.short(tag,v);else{this.head(tag,2);this.b.push((v>>>24)&0xff,(v>>>16)&0xff,(v>>>8)&0xff,v&0xff);}}
  int64(tag,v){const n=BigInt(v);if(n>=-2147483648n&&n<=2147483647n)this.int32(tag,Number(n));else{this.head(tag,3);let x=BigInt.asUintN(64,n);const o=[];for(let i=0;i<8;i++){o.unshift(Number(x&0xffn));x>>=8n;}this.b.push(...o);}}
  string(tag,v){const raw=typeof v==='string'?u8(v):v;if(raw.length<=255){this.head(tag,6);this.b.push(raw.length);}else{this.head(tag,7);const l=raw.length;this.b.push((l>>>24)&0xff,(l>>>16)&0xff,(l>>>8)&0xff,l&0xff);}for(let i=0;i<raw.length;i++)this.b.push(raw[i]);}
  mapIntStr(tag,entries){this.head(tag,8);this.int32(0,entries.length);for(const [k,v] of entries){this.int32(0,k);this.string(1,v);}}
  struct(tag,fields){this.head(tag,10);for(let i=0;i<fields.length;i++)this.b.push(fields[i]);this.head(0,11);}
  finish(){return new Uint8Array(this.b);}
}
/* ===== profile ===== */
const JAVA_PERF_ORDER=[133,138,140,-17,17,145,146,149,22,150,151,24,100,101,102,103,104,105,106,107,44,113,114,115,116,117,118,120,122,'s9'];
const JAVA_PERF_REF={133:0,138:1,140:0,'-17':0,17:1,145:0,146:0,149:0,22:1,150:0,151:0,24:0,100:6,101:114,102:0,103:0,104:0,105:0,106:3,107:0,44:0,113:2,114:1,115:1,116:0,117:0,118:0,120:8,122:0,s9:1};
const NATIVE_PERF_ORDER=[21,7,10,14,33,11,24,12,23,8,13,25,20,35,42,121,135,124,125,129,131,134,132,137,142,141,9,15,16];
const NATIVE_PERF_REF={21:1,7:0,10:3,14:0,33:0,11:0,24:0,12:0,23:0,8:0,13:0,25:0,20:0,35:0,42:0,121:1,135:2,124:0,125:0,129:0,131:0,134:0,132:0,137:1,142:0,141:0,9:16,15:0,16:0};
const PROC_TPL=[[-1,3,1000,17,0,438,3],[-1,1,0,20,0,493,3],[1,1,1000,1864,1036632,420,2],[-1,1,0,20,0,493,2],[1,3,1000,17,0,438,3],[1,1,null,19,0,292,6],[-1,1,null,19,0,292,6]];
function b64(bytes){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let s='';let i=0;for(;i+2<bytes.length;i+=3){const n=(bytes[i]<<16)|(bytes[i+1]<<8)|bytes[i+2];s+=A[(n>>18)&63]+A[(n>>12)&63]+A[(n>>6)&63]+A[n&63];}if(i<bytes.length){const n=(bytes[i]<<16)|((i+1<bytes.length?bytes[i+1]:0)<<8);s+=A[(n>>18)&63]+A[(n>>12)&63]+(i+1<bytes.length?A[(n>>6)&63]:'=')+'=';}return s;}
function b64url(bytes){return b64(bytes).replace(/\+/g,'-').replace(/\//g,'_');}
function b64dec(s){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';s=s.replace(/=+$/,'');const out=[];let buf=0,bits=0;for(const ch of s){buf=(buf<<6)|A.indexOf(ch);bits+=6;if(bits>=8){bits-=8;out.push((buf>>bits)&0xff);}}return new Uint8Array(out);}
class Profile{
  constructor(seed,boot,install){this.seed=seed;this.boot=boot;this.install=install;this._c={};}
  bytes(label,size=32){const key=label+'|'+size;if(this._c[key])return this._c[key];const out=[];let ctr=0;while(out.length<size){const c=new Uint8Array(4);new DataView(c.buffer).setUint32(0,ctr);const d=hmacSha256(this.seed,concat(u8('wsgw-turing-profile-v1\0'+label),c));for(const x of d)out.push(x);ctr++;}const r=new Uint8Array(out.slice(0,size));this._c[key]=r;return r;}
  hex(label,size=16){return toHex(this.bytes(label,size));}
  integerBig(label,lo,hi){lo=BigInt(lo);hi=BigInt(hi);const v=BigInt('0x'+toHex(this.bytes(label,8)));return lo+v%(hi-lo+1n);}
  integer(label,lo,hi){return Number(this.integerBig(label,lo,hi));}
  reqInt(label,ts,lo,hi){return this.integer(`request:${ts}:${label}`,lo,hi);}
  uuid(label){const v=Array.from(this.bytes(label,16));v[6]=(v[6]&0x0f)|0x40;v[8]=(v[8]&0x3f)|0x80;const h=toHex(v);return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
  identity(){if(this._id)return this._id;const mac=Array.from(this.bytes('wifi-mac',6));mac[0]=(mac[0]&0xfe)|0x02;this._id={profile_id:this.uuid('profile-id'),android_id:this.hex('android-id',8),oaid:this.uuid('oaid'),brand:'google',model:'sdk_gphone64_arm64',release:'13',package_name:PKG,channel:CHANNEL};return this._id;}
  timing(label,ts,ref){if(ref<=0)return 0;const radius=Math.max(1,Math.floor(ref/4));const digits=String(ref).length;const lo=digits>1?10**(digits-1):0;const hi=10**digits-1;return this.reqInt(`timing:${label}`,ts,Math.max(lo,ref-radius),Math.min(hi,ref+radius));}
  javaPerf(ts){return JAVA_PERF_ORDER.map(f=>`${f}_${this.timing(String(f),ts,JAVA_PERF_REF[String(f)])}`).join(',');}
  directPerf(ts){const s=NATIVE_PERF_ORDER.map(f=>`${f}_${this.timing('native-'+f,ts,NATIVE_PERF_REF[f])}`).join(',');return `${this.javaPerf(ts)},${s}`;}
  nativeMap(cur){const id=this.identity();const boot=this.boot;const uid=this.integer('uid',10000,19999);const install=this.install;
    const ia=b64url(this.bytes('install-a',16));const ib=b64url(this.bytes('install-b',16)).replace(/=+$/,'')+'=';
    const ictx=`1:1:${uid}:${install}:${id.package_name}::${this.integer('install-slot',100000000,999999999)}:app/~~${ia}/-${ib},`;
    const pe=PROC_TPL.map((t,i)=>{const [sign,kind,ownerV,a,b,c,md]=t;const mag=this.integerBig(`process-hash-${i}`,'1000000000000000000','9000000000000000000');const ph=mag*BigInt(sign);const owner=ownerV==null?uid:ownerV;const metric=this.reqInt(`process-metric-${i}`,cur,10**(md-1),10**md-1);return `${ph}:${kind}:${owner}_${a}_${b}_${c}_${metric}`;});
    const iid=this.hex('interface-id',3);
    const net=`8,eth0;69699;3;fe80::5054:ff:fe${iid.slice(0,2)}:${iid.slice(2)};fec0::5054:ff:fe${iid.slice(0,2)}:${iid.slice(2)};10.0.2.15,dummy0;65731;1;fe80::8c95:a4ff:fe59:322`;
    const lat=this.reqInt('collection-latency',cur,8000,16000);
    const v={};for(const k of Object.keys(REF_NATIVE))v[k]=String(REF_NATIVE[k]);
    Object.assign(v,{16:id.android_id,17:ictx,26:this.hex('native-device-id',16),34:`C:1,T:${cur},LT:${lat}`,125:pe.join(','),126:String(boot),129:net,141:String(this.integer('native-property-141',1000000,9999999)),146:'1,272494655,eth0,10.0.2.15,10.0.2.3',148:id.oaid});
    return v;}
  featureMap(cur,code,nonce){const id=this.identity();const n=this.nativeMap(cur);const st=[0,1,2].map(i=>this.reqInt(`stage-${i}`,cur,1000,2200));
    return {1:id.channel,4:this.javaPerf(cur),205:n[22],210:n[34],240:n[44],250:n[100],251:n[101],252:n[102],253:n[103],254:n[104],255:n[105],256:n[106],257:n[107],258:n[113],259:n[114],264:n[24],266:n[45],267:n[17],268:n[115],269:n[116],270:n[117],271:n[46],272:n[118],273:'',279:n[120],280:n[122],281:n[126],282:n[138],284:n[146],285:n[149],286:n[150],287:n[151],288:n[152],303:`5_1_${code}_${st.join('_')}`,308:'1',309:'',402:'',406:'',2001:n[200],2005:'0',2013:JAVA_CONST['2013'],2016:JAVA_CONST['2016'],2017:JAVA_CONST['2017'],2018:String(this.integer('uid',10000,19999)),2019:n[133],2021:n[140],2029:'0',3001:String(code),3002:'1',3004:nonce,3005:'1'};}
}
function hashTags(entries,ts){const parts=entries.map(([,v])=>String(v));let st=BigInt(ts);for(let i=0;i<Math.floor((entries.length+3)/4);i++){st=((st*214013n+2531011n)>>16n)&0x7FFFn;parts.push(st.toString(16));}const d=turingHash64(u8(parts.join('')),0).toString(16);return ['01'+d,d];}
function buildM90(p,ts,nonce){const code=-22056;const id=p.identity();const f=p.featureMap(ts,code,nonce);const nm=p.nativeMap(ts);
  const nested=Object.keys(nm).map(k=>[Number(k),nm[k]]).sort((a,b)=>a[0]-b[0]);
  const [t10,t12]=hashTags(nested,ts);const uid=f[2018];const proc=`${id.package_name}:tools,${uid},untrusted_app,${uid},,init`;
  const o=new Jce();o.int64(0,ts);
  const meta=new Jce();meta.int32(0,90);meta.string(1,'90');meta.string(2,BUILD_MARKER);meta.string(3,CHANNEL);meta.int32(4,2);o.struct(1,meta.finish());
  o.mapIntStr(2,nested);
  const net=new Jce();net.string(0,'3.2.3,113');net.string(1,id.package_name);o.struct(3,net.finish());
  o.mapIntStr(5,[[3,f[303]],[8,f[308]],[9,f[309]],[7,proc],[10,t10],[12,t12],[4,p.directPerf(ts)]]);
  o.mapIntStr(6,[[2,'']]);
  const tail=new Jce();tail.string(0,'');tail.string(2,'');tail.int32(3,0);tail.string(4,'');tail.string(5,'');o.struct(8,tail.finish());
  const nb=o.finish();
  const w=new Jce();w.mapIntStr(0,[[2,id.model],[1,id.brand],[3,id.channel],[4,id.package_name]]);w.int64(1,ts);w.int32(2,1);w.struct(4,nb);w.int32(5,code);w.string(6,String(code));w.string(7,nonce);
  return {m90:w.finish(),nested:nb,tags:[t10,t12]};}
const ALNUM='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function randStr(n,alpha=ALNUM){const r=randomBytes(n*2);let s='';for(let i=0;i<n;i++)s+=alpha[((r[i*2]<<8)|r[i*2+1])%alpha.length];return s;}
function deviceToken(p,ts){const nonce=randStr(32);const {m90}=buildM90(p,ts,nonce);const key=u8(randStr(16));const comp=zlibCompressStored(concat(new Uint8Array([2]),m90));const cipher=xxteaEncrypt(comp,key);return {token:'v3:'+b64(concat(new Uint8Array([1]),rsaEncrypt(key),cipher)),time:String(ts).slice(0,10),ts};}
function appGuid(p){const a='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';return Array.from(p.bytes('app-guid',60)).map(v=>a[v%62]).join('');}

/* ===== 国网 App 接口 ===== */
const SG_BASE = 'https://csc-service.sgcc.com.cn:28630/';
const SERVER_PUB = '0409C10D38CF7B4E28097EAAA519E3157C9B4E72194CD13BD11932CE40ED5624AFEFF27F78893E4C4FC2029DA147AB6CEAE0CDC8E3A547EFCDC5AB91757FE1CA60';
const CLIENT_PRIV = '50C4AF48DF75808050729977AA6BC127DC21A404755C660B94222F9D50FA4A75';
const P_LOGIN = 'emss-uia-center-front/member/c2/f01';
const P_SMS = 'emss-uia-center-front/member/c1/f01';
const P_DAILY = 'emss-bia-bill-front/member/c11/f01';
const P_MONTH = 'emss-bia-bill-front/member/c51/f04';
const P_BAL = 'emss-bia-balance-front/member/c16/f01';
const CHECK_KEY = 'LNPO+ISJ+QeqNemFK+3OMUdexSn2i6pB';

class SgError extends Error { constructor(code, msg) { super(msg ? `${msg}` : code); this.code = String(code || ''); } }

function cnNow() { const d = new Date(Date.now() + 8 * 3600000); const p = (n, l = 2) => String(n).padStart(l, '0'); return { s14: `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`, ms: p(d.getUTCMilliseconds(), 3), y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }
function reqTimestamp() { const n = cnNow(); return n.s14 + n.ms + randStr(6, '0123456789'); }
function appGuidNew() { const n = cnNow(); return randStr(40, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') + n.s14 + n.ms + String(100 + (randomBytes(2)[0] * 256 + randomBytes(1)[0]) % 900); }

function javaHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0; return h; }
function hashMapOrder(v) {
  if (Array.isArray(v)) return v.map(hashMapOrder);
  if (v && typeof v === 'object') {
    const buckets = {};
    Object.keys(v).forEach((k) => { let h = javaHash(k); h = (h ^ (h >>> 16)) >>> 0; const b = h & 15; (buckets[b] = buckets[b] || []).push(k); });
    const o = {};
    Object.keys(buckets).map(Number).sort((a, b) => a - b).forEach((b) => buckets[b].forEach((k) => { o[k] = hashMapOrder(v[k]); }));
    return o;
  }
  return v;
}
function loginMd5(params) { return md5hex(Object.keys(params).sort().map((k) => k + JSON.stringify(hashMapOrder(params[k]))).join('')); }

function checkCode(account) {
  let r = 0n; const rb = randomBytes(8); for (const b of rb) r = (r << 8n) | BigInt(b); r &= (1n << 63n) - 1n;
  return String(r).padStart(24, '0') + toHex(aes256EcbEncrypt(u8(`${account}${Date.now()}`), u8(CHECK_KEY)));
}
function uscInfo(dev) { return { isEncrypt: 'false', devciceIp: '127.0.0.1', devciceId: '000000', tenant: 'state_grid', member: '2202', optSys: 'Android 13', operatorType: '', devciceName: 'sdk_gphone64_arm64', pushId: '000000,000000' }; }
function loginParams(account, password, code, codeKey) {
  return {
    quInfo: { code: code || '', codeKey: codeKey || '', account, password: md5hex(password), optSys: 'Android', pushId: '000000,000000', addressCity: '', addressProvince: '', addressRegion: '' },
    uscInfo: uscInfo(),
    checkCode: checkCode(account),
    avalonValidCode: '',
  };
}

class SgApp {
  constructor(ctx, user, pass) { this.ctx = ctx; this.user = clean(user).replace(/^(\+?86)?\s*/, '').replace(/\D/g, ''); this.pass = clean(pass); this.dev = null; this.sess = null; }
  sk(base) { return uk(base, this.user); }
  st(k, v) { try { if (v === undefined) return this.ctx.storage.getJSON(k); this.ctx.storage.setJSON(k, v); } catch (_) { return null; } return null; }
  device() {
    if (this.dev) return this.dev;
    let s = this.st(K.dev);
    if (!s || !s.seed) {
      const now = Date.now();
      const boot = now - 3600000 - Math.floor(Math.random() * (86400000 * 14 - 3600000));
      s = { seed: b64(randomBytes(32)), boot, install: boot - 86400000 - Math.floor(Math.random() * 86400000 * 179) };
    }
    const prof = new Profile(b64dec(s.seed), s.boot, s.install);
    if (!s.tok || Date.now() - s.tok.ts > 4 * 3600000) s.tok = deviceToken(prof, Date.now());
    this.st(K.dev, s);
    this.dev = { s, guid: appGuid(prof) };
    return this.dev;
  }
  headers(loginP, authed) {
    const d = this.device();
    const h = {
      'Content-Type': 'application/json; charset=UTF-8',
      timeStamp: loginP ? cnNow().s14 : reqTimestamp(),
      t: authed ? this.sess.token : '',
      userid: authed ? this.sess.userId : '0',
      AppGuid: d.guid, AppGuidNew: appGuidNew(), security: 'android', appcode: 'WSGW-SG1001-APP', datacenter: '99', AccessMethod: 'App',
      deviceTokenTX: d.s.tok.token, deviceTokenTXTime: d.s.tok.time,
      province: authed ? (this.sess.province || '') : '',
      version: '3.2.3', wsgwType: 'android', ip: '127.0.0.1', os: 'android', 'User-Agent': 'okhttp/3.14.9',
    };
    if (loginP) h.md5 = loginMd5(loginP);
    return h;
  }
  async post(path, payload, { authed = false, loginP = null } = {}) {
    const key = toHex(randomBytes(16));
    const ts = String(Date.now());
    const data = sm4EncryptHex(JSON.stringify(payload), key);
    const skey = sm2EncryptKey(key, SERVER_PUB);
    const body = JSON.stringify({ data, sign: sm3hex(skey + data + ts), skey, timestamp: ts });
    const req = { headers: this.headers(loginP, authed), body, timeout: 20000 };
    let text;
    try { const r = await this.ctx.http.post(SG_BASE + path, req); text = await r.text(); if (r.status >= 500) throw new Error('HTTP ' + r.status); }
    catch (e) { throw new SgError('net', '连不上国网服务器：' + ((e && e.message) || e)); }
    let outer; try { outer = JSON.parse(text); } catch (_) { throw new SgError('net', '国网返回了无法识别的内容'); }
    if (!outer.respKey || !outer.encryptData) throw new SgError(outer.code || 'net', outer.message || '国网返回异常');
    const k2 = utf8dec(sm2DecryptKey(String(outer.respKey), CLIENT_PRIV));
    return JSON.parse(utf8dec(sm4DecryptHex(String(outer.encryptData), k2)));
  }
  static check(resp) {
    const top = String(resp.code == null ? '' : resp.code);
    const d = resp.data && typeof resp.data === 'object' ? resp.data : {};
    const srv = d.srvrt && typeof d.srvrt === 'object' ? d.srvrt : null;
    const code = srv ? String(srv.resultCode || '') : top;
    const msg = (srv && srv.resultMessage) || resp.message || '';
    if (srv && code && code !== '0000') throw new SgError(code, msg);
    if (!srv && top && top !== '1') throw new SgError(top, msg);
    return d;
  }
  async login(code, codeKey) {
    const p = loginParams(this.user, this.pass, code, codeKey);
    const resp = await this.post(P_LOGIN, p, { loginP: p });
    const d = SgApp.check(resp);
    const biz = d.bizrt || {};
    if (!biz.token) throw new SgError('auth', '登录没有返回凭证');
    let ui = biz.userInfo; if (Array.isArray(ui)) ui = ui.find((x) => x && typeof x === 'object') || {}; ui = ui || {};
    const life = Number(biz.tokenExpireTime) || 1296000;
    this.sess = { user: this.user, token: String(biz.token), userId: String(ui.userId || biz.userId || '0'), province: clean(ui.addressProvince), exp: Date.now() + Math.max(300, life) * 1000, accounts: (Array.isArray(ui.powerUserList) ? ui.powerUserList : []).map(acctOf).filter(Boolean) };
    this.st(this.sk(K.sess), this.sess);
    return this.sess;
  }
  async sendDeviceSms() {
    const resp = await this.post(P_SMS, { uscInfo: { tenant: 'state_grid', member: '2202', devciceId: '000000', devciceName: 'sdk_gphone64_arm64', devciceIp: '127.0.0.1' }, quInfo: { voiceCodeFlag: false, account: this.user, sendType: 0, businessType: 'logindevice' } });
    const d = SgApp.check(resp);
    const ck = d.bizrt && d.bizrt.codeKey;
    if (!ck) throw new SgError('sms', '验证码发送失败');
    return String(ck);
  }
  async ensure() {
    let s = this.st(this.sk(K.sess));
    if (!s || !s.token) { const o = this.st(K.sess); if (o && o.user === this.user) s = o; }
    if (s && s.user === this.user && s.token && s.exp > Date.now() + 300000) { this.sess = s; return s; }
    const env = this.ctx.env || {};
    const sms = clean(env.SGCC_SMS).replace(/\D/g, '');
    const pend = this.st(this.sk(K.sms));
    const pendOk = pend && pend.user === this.user && Date.now() - pend.ts < 15 * 60000;
    if (pendOk && sms.length === 6 && sms !== pend.used) {
      this.st(this.sk(K.sms), { ...pend, used: sms });
      return this.login(sms, pend.codeKey);
    }
    try { return await this.login(); }
    catch (e) {
      const codeStr = String((e && e.code) || '');
      const msgStr = String((e && e.message) || '');
      const isSmsRequired = codeStr === '4006' || codeStr.includes('4006') ||
                            codeStr === 'RK007' || codeStr === 'RK008' || codeStr === 'RK1003' ||
                            /验证码|新设备|短信|超时\(RK007\)|安全验证|RK00/i.test(msgStr);
      if (!isSmsRequired) throw e;
      // 超过60秒允许重新触发下发短信验证码
      if (!pendOk || Date.now() - pend.ts > 60 * 1000) {
        try {
          const codeKey = await this.sendDeviceSms();
          this.st(this.sk(K.sms), { user: this.user, codeKey, ts: Date.now(), used: sms });
          console.log(`[SGCC] 安全验证码已成功触发下发到手机号: ${this.user}`);
        } catch (smsErr) {
          console.error(`[SGCC] 下发验证码接口异常: ${smsErr.message || smsErr}`);
          throw new SgError('sms_fail', `触发短信验证码失败：${smsErr.message || '国网短信网关繁忙，请稍后重试'}`);
        }
      }
      throw new SgError('4006', `国网新设备安全验证：短信验证码已发至 ${this.user.slice(0, 3)}****${this.user.slice(-4)}，请在设置中填入「短信验证码」后刷新`);
    }
  }
  async authed(path, payload) {
    await this.ensure();
    for (let i = 0; i < 2; i++) {
      const resp = await this.post(path, payload, { authed: true });
      try { return SgApp.check(resp); }
      catch (e) {
        if (!['-200', '-201'].includes(e.code) || i) throw e;
        this.st(this.sk(K.sess), {}); this.sess = null; await this.ensure();
      }
    }
    return {};
  }
}

function acctOf(v) {
  if (!v || typeof v !== 'object') return null;
  const f = (...ks) => { for (const k of ks) if (v[k] != null && v[k] !== '') return String(v[k]); return ''; };
  const consNo = f('powerUserNo', 'consNo');
  if (!consNo) return null;
  const src = f('powerUserNo_dst', 'consNo_dst') || consNo;
  return { consNo, src, pro: f('proNo', 'provinceId'), org: f('orgNo'), elec: f('elecType', 'constType'), name: f('consName', 'userName', 'nickname'), orgName: f('orgName') };
}
function consType(a) { return a.elec === '04' || (a.elec === '02' && a.pro === '11102') ? '02' : '01'; }
function ymd(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function monthRange(y, m) { return [ymd(y, m, 1), ymd(y, m, new Date(Date.UTC(y, m, 0)).getUTCDate())]; }


async function queryAccount(app, a) {
  const n = cnNow();
  const daily = [];
  let monthTotal = NaN;
  for (let off = 0; off < 2; off++) {
    let y = n.y, m = n.m - off; if (m < 1) { m += 12; y -= 1; }
    const [s, e] = monthRange(y, m);
    try {
      const d = await app.authed(P_DAILY, { serviceCode: 'BCP_000026', source: 'app', target: a.pro, data: { acctId: 'acctid01', channelCode: 'SGAPP', consNo: a.src, consNosrc: a.src, endTime: e, consType: consType(a), funcCode: 'ALIPAY_01', orgNo: a.org, proCode: a.pro, promotCode: '1', promotType: '1', serialNo: '', srvCode: '', startTime: s, userName: 'acctid01' } });
      (Array.isArray(d.sevenEleList) ? d.sevenEleList : []).forEach((x) => {
        const dStr = String(x.day || '').replace(/\D/g, '');
        daily.push({ day: dStr, dayElePq: x.dayElePq });
      });
      if (off === 0) monthTotal = num(d.totalPq);
    } catch (e) { if (off === 0 && !daily.length) throw e; }
  }
  let bills = [], yearPq = NaN, yearAmt = NaN;
  for (const y of [n.y, n.y - 1]) {
    try {
      const d = await app.authed(P_MONTH, { serviceCode: 'BCP_000026', source: 'app', target: a.pro, data: { year: y, consNo: a.src, provinceCode: a.pro, startYm: `${y}01`, endYm: `${y}12`, funcCode: 'ALIPAY_01' } });
      const raw = Array.isArray(d.list) ? d.list : Array.isArray(d.mothEleList) ? d.mothEleList : Array.isArray(d.monthEleList) ? d.monthEleList : [];
      const list = raw.map((x) => {
        const ele = Array.isArray(x.eleList) ? x.eleList : [];
        let use = num(x.monthPq != null ? x.monthPq : x.monthEleNum != null ? x.monthEleNum : x.pq != null ? x.pq : x.totalPq);
        if (!Number.isFinite(use) && ele.length) use = ele.reduce((s, i) => s + (num(i.pq) || 0), 0);
        let cost = num(x.monthAmt != null ? x.monthAmt : x.monthEleCost != null ? x.monthEleCost : x.amt);
        if (!Number.isFinite(cost) && ele.length) cost = ele.reduce((s, i) => s + (num(i.amt) || 0), 0);
        return { month: clean(x.ym || x.month).replace(/\D/g, '').slice(0, 6), monthEleNum: use, monthEleCost: cost };
      }).filter((x) => x.month.length === 6);
      if (y === n.y) { yearPq = num(d.yearPq); yearAmt = num(d.yearAmt); if (!Number.isFinite(yearPq) && list.length) yearPq = list.reduce((s, x) => s + (x.monthEleNum || 0), 0); if (!Number.isFinite(yearAmt) && list.length) yearAmt = list.reduce((s, x) => s + (x.monthEleCost || 0), 0); }
      bills = list.concat(bills);
      if (list.length && y === n.y && n.m > 1) break;
    } catch (e) { if (['-200', '-201', '4006', 'RK008'].includes(e.code)) throw e; break; }
  }
  let bal = null;
  try {
    const d = await app.authed(P_BAL, { serviceCode: '0101143', source: 'app', target: a.pro, data: { srvCode: '', serialNo: '', channelCode: '0902', funcCode: 'A1007200', acctId: app.sess.userId, userName: 'acctid01', promotType: '1', promotCode: '1', userAccountId: app.sess.userId, list: [{ consNoSrc: a.src, proCode: a.pro, sceneType: a.elec, consNo: a.consNo, orgNo: a.org }] } });
    bal = (Array.isArray(d.list) ? d.list : []).find((x) => x && typeof x === 'object') || null;
  } catch (e) { if (['-200', '-201', '4006', 'RK008'].includes(e.code)) throw e; }
  
  let sumMoney = NaN, owe = 0;
  if (bal) {
    const sm = num(bal.sumMoney);        // 账单金额 / 应缴金额
    const ab = num(bal.accountBalance);  // 账户预存款可用余额
    const pb = num(bal.prepayBal);       // 预付费余额
    const ho = num(bal.historyOwe);      // 历史真实逾期欠费

    if (String(bal.consType) === '1') {
      // 预付费用户（智能电表）：优先取 sm，无则取 pb
      sumMoney = Number.isFinite(sm) ? sm : (Number.isFinite(pb) ? pb : 0);
      if (sumMoney < 0) owe = Math.abs(sumMoney);
    } else {
      // 后付费用户（抄表结算户）：
      const validAb = Number.isFinite(ab) && ab > 0 ? ab : 0;
      const validSm = Number.isFinite(sm) && sm > 0 ? sm : 0;

      // 若有预存款，展示抵扣后的净结余；若无预存，展示本期账单金额
      sumMoney = validAb > 0 ? (validAb - validSm) : validSm;

      // 严格判定欠费：仅当国网明确标记逾期欠费(historyOwe > 0)时才认定为欠费
      // 正常账期内的待缴账单绝不误判为欠费
      if (Number.isFinite(ho) && ho > 0) {
        owe = ho;
        sumMoney = -ho;
      }
    }
    if (Number.isFinite(ho) && ho > 0) owe = Math.max(owe, ho);
  }

  const isPostPaid = bal && String(bal.consType) !== '1';
  const eleBill = {
    sumMoney: Number.isFinite(sumMoney) ? sumMoney : 0,
    historyOwe: owe,
    prepayBal: bal ? num(bal.prepayBal) : NaN,
    date: bal ? clean(bal.date || bal.amtTime) : ''
  };
  if (isPostPaid) {
    eleBill.accountBalance = bal && Number.isFinite(num(bal.accountBalance)) ? num(bal.accountBalance) : 0;
  }

  return {
    userInfo: { consNo: a.consNo, consNo_dst: a.src, consName_dst: a.name, orgName: a.orgName, proNo: a.pro },
    arrearsOfFees: owe > 0,
    eleBill,
    dayElecQuantity31: { sevenEleList: daily },
    monthElecQuantity: { mothEleList: bills, dataInfo: { totalEleNum: yearPq, totalEleCost: yearAmt } },
    monthTotal,
  };
}


module.exports = { SgApp, queryAccount, SgError, K }
