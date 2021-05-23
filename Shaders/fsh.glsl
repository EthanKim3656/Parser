#version 300 es

precision lowp float;

in vec3 v_position;
in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_cam;

out vec4 color;

const vec3 light_source = vec3(70., 80., 200.);

const float spec_power     = 32.;
const float spec_intensity = 1.;

const vec3 diffuse_color = vec3( 1., 1., 1. );

void main () {

	vec3 normal    =  normalize( v_normal );
	vec3 incident  = -normalize( v_position + v_cam );
	vec3 light     = -normalize( v_position + light_source );
	vec3 reflected =  reflect( light, normal );

	float diffuse = dot( normal, incident );
	float ambient = 0.31830988618;
	
	float rndot = max( dot( reflected, normal ), 0. );
	float specular = pow( rndot, spec_power ) * spec_intensity;

	color = vec4( diffuse_color.rgb * ( diffuse + specular + ambient ), 1. );
}