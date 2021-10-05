#version 300 es

out vec4 color;
out vec3 position;
out float pointSizeBrightnessFactor;

uniform vec3 cameraPosition;
uniform vec4 cameraRotation;

uniform vec4 quat1;
uniform vec4 quat2;
uniform vec4 quat3;

uniform uint iterations;


vec3 rotateQuat(vec3 position, vec4 q)
{ 
  vec3 v = position.xyz;
  return v + 2.0 * cross(q.yzw, cross(q.yzw, v) + q.x * v);
}

vec4 quatAngleAxis(float angle, vec3 axis) {
    return vec4(cos(angle), axis * sin(angle));
}

vec4 quatInverse(vec4 q) {
    vec4 conj;
    conj.yzwx = vec4(-q.yzw, q.x);
    return conj / dot(q, q);
}

//`(${new Array(20).fill(0).map((e, i) => Math.pow(3, i)+"u")})`
uint[] powsOfThree = uint[](1u,3u,9u,27u,81u,243u,729u,2187u,6561u,19683u,59049u,177147u,531441u,1594323u,4782969u,14348907u,43046721u,129140163u,387420489u,1162261467u);
// /`(${new Array(32).fill(0).map((e, i) => Math.pow(2, i)+"u")})`
uint[] powsOfTwo = uint[](1u,2u,4u,8u,16u,32u,64u,128u,256u,512u,1024u,2048u,4096u,8192u,16384u,32768u,65536u,131072u,262144u,524288u,1048576u,2097152u,4194304u,8388608u,16777216u,33554432u,67108864u,134217728u,268435456u,536870912u,1073741824u,2147483648u);

#define POWERS powsOfThree

void main() {
  color = vec4(0.0);

  vec3 branchPos = vec3(0.0, -1.0, 0.0);
  vec3 branchDir = vec3(0.0, 1.0, 0.0);
  float len = 0.5;
  for (uint i = 0u; i < iterations; i++) {
    uint divisor = POWERS[i+1u];
    uint remainder = uint(gl_VertexID) % divisor;
    remainder /= POWERS[i];
    branchPos += branchDir * len;
    if (remainder == 0u) {
      branchDir = rotateQuat(branchDir, quat1);
      color.x += 1.2 * pow(0.7, float(iterations));
      len *= 0.7;
    } else if (remainder == 1u) {
      branchDir = rotateQuat(branchDir, quat2);
      color.y += 1.2 * pow(0.7, float(iterations));;
      len *= 0.6;
    } else {
      branchDir = rotateQuat(branchDir, quat3);
      color.z += 1.2 * pow(0.7, float(iterations));;
      len *= 0.5;
    }
  }
  //color = vec4(0.5, 0.05, 0.005, 0.0);
  branchPos -= cameraPosition;
  branchPos = rotateQuat(branchPos, quatInverse(cameraRotation));
  branchPos.xy /= branchPos.z * 2.3;
  branchPos.z *= 0.01;
  if (branchPos.z < 0.0) branchPos.z = 1.5;
  gl_Position = vec4(branchPos, 1.0);
  //position = vec3(float(gl_VertexID) * 0.001);
  //gl_Position = vec4(vec2(float(gl_VertexID) * 0.001), 0.5, 1.0);
  gl_PointSize = ceil(0.0005 / branchPos.z);
  position = branchPos;
  
  pointSizeBrightnessFactor = gl_PointSize;
}