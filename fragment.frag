#version 300 es

precision highp float;

in vec4 color;
in vec3 position;
in float pointSizeBrightnessFactor;

out vec4 fragColor;

void main() {
  fragColor = 0.0005 * color / position.z / pointSizeBrightnessFactor;
}