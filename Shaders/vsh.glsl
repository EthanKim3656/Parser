#version 300 es

in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

uniform mat4 u_all;
uniform vec3 u_cam;

out vec3 v_position;
out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_cam;

void main () {

	gl_Position = u_all * vec4( a_position + u_cam, 1. );

	v_position = a_position;
	v_texcoord = a_texcoord;
	v_normal   = a_normal;
	v_cam      = u_cam;
}