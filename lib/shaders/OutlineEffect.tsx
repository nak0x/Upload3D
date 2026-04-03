import { Effect } from 'postprocessing'
import { Color, Uniform } from 'three'
import { forwardRef, useMemo } from 'react'

const fragmentShader = /* glsl */ `
uniform float uEdgeStrength;
uniform vec3  uEdgeColor;
uniform float uNoiseFrequency;
uniform float uTime;

float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 texel = vec2(1.0) / resolution.xy;

  float n = valueNoise(uv * uNoiseFrequency + uTime * 0.5);
  vec2 dispUv = uv + (n - 0.5) * texel * 3.0;

  float tl = luma(texture2D(inputBuffer, dispUv + texel * vec2(-1.0, -1.0)).rgb);
  float tm = luma(texture2D(inputBuffer, dispUv + texel * vec2( 0.0, -1.0)).rgb);
  float tr = luma(texture2D(inputBuffer, dispUv + texel * vec2( 1.0, -1.0)).rgb);
  float ml = luma(texture2D(inputBuffer, dispUv + texel * vec2(-1.0,  0.0)).rgb);
  float mr = luma(texture2D(inputBuffer, dispUv + texel * vec2( 1.0,  0.0)).rgb);
  float bl = luma(texture2D(inputBuffer, dispUv + texel * vec2(-1.0,  1.0)).rgb);
  float bm = luma(texture2D(inputBuffer, dispUv + texel * vec2( 0.0,  1.0)).rgb);
  float br = luma(texture2D(inputBuffer, dispUv + texel * vec2( 1.0,  1.0)).rgb);

  float Gx = -tl - 2.0*ml - bl + tr + 2.0*mr + br;
  float Gy = -tl - 2.0*tm - tr + bl + 2.0*bm + br;
  float edge = clamp(sqrt(Gx*Gx + Gy*Gy) * uEdgeStrength, 0.0, 1.0);

  vec3 color = mix(inputColor.rgb, uEdgeColor, edge);
  outputColor = vec4(color, inputColor.a);
}
`

export class OutlineEffectImpl extends Effect {
  constructor({
    edgeStrength = 3.0,
    edgeColor = '#2d1a0e',
    noiseFrequency = 8.0,
  }: {
    edgeStrength?: number
    edgeColor?: string
    noiseFrequency?: number
  } = {}) {
    const color = new Color(edgeColor)
    super('OutlineEffect', fragmentShader, {
      uniforms: new Map<string, Uniform<unknown>>([
        ['uEdgeStrength',  new Uniform(edgeStrength)],
        ['uEdgeColor',     new Uniform(color)],
        ['uNoiseFrequency',new Uniform(noiseFrequency)],
        ['uTime',          new Uniform(0)],
      ]),
    })
  }

  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
    this.uniforms.get('uTime')!.value += deltaTime
  }
}

export const OutlinePass = forwardRef<
  OutlineEffectImpl,
  { edgeStrength?: number; edgeColor?: string; noiseFrequency?: number }
>(({ edgeStrength = 3.0, edgeColor = '#2d1a0e', noiseFrequency = 8.0 }, ref) => {
  const effect = useMemo(
    () => new OutlineEffectImpl({ edgeStrength, edgeColor, noiseFrequency }),
    [edgeStrength, edgeColor, noiseFrequency]
  )
  return <primitive ref={ref} object={effect} dispose={null} />
})
OutlinePass.displayName = 'OutlinePass'
