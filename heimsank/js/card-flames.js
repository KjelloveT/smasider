// Lokal WebGL-dekorasjon berre over korttoppen. Kortet er framleis skarp HTML.
const HeimsankFlames = (function () {
  const cards = new Map();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const item = cards.get(entry.target);
      if (item) item.visible = entry.isIntersecting;
    });
    wake();
  });
  const vert = `#version 300 es
  in vec2 p; out vec2 uv;
  void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
  const frag = `#version 300 es
  precision highp float;
  in vec2 uv; out vec4 outColor;
  uniform float time; uniform vec3 flameColor;

  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
  }
  float fbm(vec2 p){
    float v=0.,a=.55;
    for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+17.7;a*=.5;}
    return v;
  }
  void main(){
    // Korttoppen ligg ved y=.11 i det litt større effektlerretet.
    float y=1.-uv.y;
    float edge=.11;
    float d=edge-y;
    float x=(uv.x-.083)/.834;
    vec2 flow=vec2(x*7.4, y*9.-time*.55);
    float broad=fbm(flow+vec2(fbm(flow*.55+time*.12),0.));
    float fine=fbm(flow*2.15+vec2(-time*.18,time*.1));
    float tongues=pow(clamp(broad*.72+fine*.38,0.,1.),3.4);
    float height=.009+.125*tongues;
    float body=smoothstep(height,height-.014,d)*smoothstep(-.006,.008,d);
    float alpha=body*(1.-.48*clamp(d/max(height,.01),0.,1.));

    float core=smoothstep(.085,.0,d);
    vec3 hot=mix(vec3(1.,.88,.48),flameColor,smoothstep(.0,.13,d));
    vec3 col=mix(hot,flameColor,clamp(d/.18,0.,1.));
    float glow=smoothstep(.13,0.,d)*smoothstep(-.015,.006,d)*.20;

    // Små gneistar over kanten.
    vec2 cell=floor(vec2(uv.x*46.,(y+time*.12)*44.));
    float rnd=hash(cell);
    vec2 fp=fract(vec2(uv.x*46.,(y+time*.12)*44.))-.5;
    float spark=(1.-smoothstep(.03,.11,length(fp)))*step(.91,rnd);
    spark*=smoothstep(.29,.13,d)*smoothstep(.015,.07,d);

    alpha=max(alpha,glow)+spark;
    col+=core*vec3(.35,.18,.02)+spark*vec3(1.,.75,.3);
    // Rein toppkant utan «taggar» ned langs sidene.
    alpha*=smoothstep(-.01,.025,x)*smoothstep(-.01,.025,1.-x);
    if(y>edge+.012) alpha=0.;
    outColor=vec4(col*alpha,alpha);
  }`;
  function shader(gl,type,source){
    const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) return null;
    return s;
  }
  function setup(canvas, rarity){
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true});
    if(!gl) return null;
    const vs=shader(gl,gl.VERTEX_SHADER,vert),fs=shader(gl,gl.FRAGMENT_SHADER,frag);
    if(!vs||!fs) return null;
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) return null;
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    gl.useProgram(program);
    const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    gl.uniform3fv(gl.getUniformLocation(program,'flameColor'),
      rarity==='gudebore' ? [.96,.38,.03] : [.55,.16,.95]);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    return {gl,program,time:gl.getUniformLocation(program,'time')};
  }
  function active(item){return item.visible&&item.face.isConnected&&!item.face.closest('[inert],.hidden');}
  function wake(){
    if(!frame&&!document.hidden&&!motion.matches&&[...cards.values()].some(active)) frame=requestAnimationFrame(tick);
  }
  function tick(t){
    frame=0;
    cards.forEach(item=>{
      if(!active(item)) return;
      item.gl.viewport(0,0,item.canvas.width,item.canvas.height);
      item.gl.useProgram(item.program);item.gl.uniform1f(item.time,t/1000);
      item.gl.clearColor(0,0,0,0);item.gl.clear(item.gl.COLOR_BUFFER_BIT);
      item.gl.drawArrays(item.gl.TRIANGLES,0,6);
    });
    wake();
  }
  function attach(face,rarity){
    const canvas=document.createElement('canvas');
    canvas.className='hs-card-flames';canvas.width=480;canvas.height=672;canvas.setAttribute('aria-hidden','true');
    const gpu=setup(canvas,rarity);
    if(!gpu) return; // CSS-gløden er reservevisinga.
    face.appendChild(canvas);
    cards.set(face,{face,canvas,...gpu,visible:false});observer.observe(face);
  }
  new MutationObserver(()=>{
    cards.forEach((item,face)=>{
      if(!face.isConnected){observer.unobserve(face);item.gl.getExtension('WEBGL_lose_context')?.loseContext();cards.delete(face);}
    });wake();
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['inert','class']});
  motion.addEventListener('change',wake);document.addEventListener('visibilitychange',wake);
  return {attach};
})();
