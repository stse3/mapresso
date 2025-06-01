"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mapbox_gl_1 = require("mapbox-gl");
var token = process.env.VITE_MAPBOX_TOKEN;
console.log('Mapbox token type:', token ? (token.startsWith('pk.') ? 'Public token' : 'Secret token') : 'No token');
console.log('Mapbox token length:', token ? token.length : 0);
if (!token) {
    console.error('No Mapbox token found in environment variables');
}
else if (!token.startsWith('pk.')) {
    console.error('Warning: Using a secret token (sk.) instead of a public token (pk.)');
}
mapbox_gl_1.default.accessToken = token;
