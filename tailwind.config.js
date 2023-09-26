/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

export default {
	content: ['./src/**/*.{html,js,hbs}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Raleway', ...defaultTheme.fontFamily.sans],
			},
		},
		colors: {
			transparent: 'transparent',
			inherit: 'inherit',
			white: '#FFF',
			yellow: {
				500: 'hsl(55, 74%, 49%)',
				600: 'hsla(55, 74%, 49%, 80%)',
				700: 'hsla(55, 74%, 49%, 50%)',
				800: 'hsla(55, 74%, 49%, 25%)',
			},
			gray: {
				200: 'hsl(60, 18%, 90%)',
				300: 'hsla(60, 18%, 90%, 80%)',
				400: 'hsla(60, 18%, 90%, 50%)',
				500: 'hsla(60, 18%, 90%, 25%)',
				600: 'hsla(60, 18%, 90%, 10%)',
				700: 'hsla(60, 18%, 90%, 5%)',
				800: 'hsla(60, 18%, 90%, 2%)',

				900: 'hsl(60, 1%, 13%)',
			},
		},
	},
	plugins: [],
};

