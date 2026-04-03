import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import { forwardRef, useMemo } from 'react'

const fragmentShader = /* glsl */ `
uniform int uRadius;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 texel = vec2(1.0) / resolution.xy;
  int r = uRadius;

  vec3 meanQ[4];
  float varQ[4];

  for (int q = 0; q < 4; q++) {
    meanQ[q] = vec3(0.0);
    varQ[q] = 0.0;
  }

  ivec2 signs[4];
  signs[0] = ivec2( 1,  1);
  signs[1] = ivec2(-1,  1);
  signs[2] = ivec2(-1, -1);
  signs[3] = ivec2( 1, -1);

  float count = float((r + 1) * (r + 1));

  for (int q = 0; q < 4; q++) {
    vec3 sumColor = vec3(0.0);
    vec3 sumSq    = vec3(0.0);
    for (int j = 0; j <= r; j++) {
      for (int i = 0; i <= r; i++) {
        vec2 offset = vec2(float(signs[q].x * i), float(signs[q].y * j)) * texel;
        vec3 s = texture2D(inputBuffer, uv + offset).rgb;
        sumColor += s;
        sumSq    += s * s;
      }
    }
    meanQ[q] = sumColor / count;
    vec3 variance = sumSq / count - meanQ[q] * meanQ[q];
    varQ[q] = dot(variance, vec3(0.299, 0.587, 0.114));
  }

  float minVar = varQ[0];
  vec3  result = meanQ[0];
  for (int q = 1; q < 4; q++) {
    if (varQ[q] < minVar) {
      minVar = varQ[q];
      result = meanQ[q];
    }
  }

  outputColor = vec4(result, inputColor.a);
}
`

export class KuwaharaEffectImpl extends Effect {
  constructor({ radius = 2 }: { radius?: number } = {}) {
    super('KuwaharaEffect', fragmentShader, {
      uniforms: new Map([['uRadius', new Uniform(radius)]]),
    })
  }

  set radius(v: number) {
    this.uniforms.get('uRadius')!.value = v
  }
}

export const KuwaharaPass = forwardRef<KuwaharaEffectImpl, { radius?: number }>(
  ({ radius = 2 }, ref) => {
    const effect = useMemo(() => new KuwaharaEffectImpl({ radius }), [radius])
    return <primitive ref={ref} object={effect} dispose={null} />
  }
)
KuwaharaPass.displayName = 'KuwaharaPass'
