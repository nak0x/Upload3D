import { Effect } from 'postprocessing'
import { Uniform } from 'three'

const fragmentShader = /* glsl */ `
uniform float uOpacity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float grain(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    vec2 i2 = floor(p);
    vec2 f2 = fract(p);
    vec2 u = f2 * f2 * (3.0 - 2.0 * f2);
    f += amp * mix(
      mix(hash(i2 + vec2(0.0, 0.0)), hash(i2 + vec2(1.0, 0.0)), u.x),
      mix(hash(i2 + vec2(0.0, 1.0)), hash(i2 + vec2(1.0, 1.0)), u.x),
      u.y
    );
    p *= 2.1;
    amp *= 0.45;
  }
  return f;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 grainUv = uv * resolution.xy / 3.0;
  float g = grain(grainUv);
  vec3 blended = inputColor.rgb * mix(vec3(1.0), vec3(g), uOpacity);
  outputColor = vec4(blended, inputColor.a);
}
`

export class PaperOverlayEffectImpl extends Effect {
  constructor({ opacity = 0.15 }: { opacity?: number } = {}) {
    super('PaperOverlayEffect', fragmentShader, {
      uniforms: new Map([['uOpacity', new Uniform(opacity)]]),
    })
  }
}
