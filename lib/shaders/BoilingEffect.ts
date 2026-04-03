import { Effect } from 'postprocessing'
import { Uniform } from 'three'

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uStrength;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float t = uTime * uSpeed;

  float dx = sin(uv.y * 80.0 + t * 1.3) * cos(uv.x * 60.0 + t * 0.9);
  float dy = cos(uv.x * 70.0 + t * 1.1) * sin(uv.y * 90.0 + t * 1.7);

  vec2 wobbleUv = uv + vec2(dx, dy) * uStrength;
  outputColor = texture2D(inputBuffer, wobbleUv);
}
`

export class BoilingEffectImpl extends Effect {
  constructor({
    speed = 1.0,
    strength = 0.002,
  }: {
    speed?: number
    strength?: number
  } = {}) {
    super('BoilingEffect', fragmentShader, {
      uniforms: new Map([
        ['uTime',     new Uniform(0)],
        ['uSpeed',    new Uniform(speed)],
        ['uStrength', new Uniform(strength)],
      ]),
    })
  }

  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
    this.uniforms.get('uTime')!.value += deltaTime
  }
}
