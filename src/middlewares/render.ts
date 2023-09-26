import fs from 'node:fs';
import Handlebars from 'handlebars';

function loadPartial() {
	// @ts-expect-error
	Handlebars.partials = {}; // Clear partials for DEV
	const views = fs.readdirSync('src/views');
	for (const view of views) {
		const file = fs.readFileSync('src/views/' + view);
		Handlebars.registerPartial(view, file.toString());
		console.log('Registered', view);
	}
	// Handlebars.registerHelper('block', (params, template) => {
	// 	console.log(params, template.fn(params))
	// 	return template.fn(params)
	// });
	Handlebars.registerHelper('block', function (context, options) {
		return options.fn(this);
	});
}

const matchBlock = (name: string) => new RegExp(`{{#block ${name}}}\n*([\\s\\S]*?)\s*{{\/block}}`, 'g')
export function render(template: string, parameters?: Record<string, any>) {
	const [fileName, block] = template.split('?');
	let file = fs.readFileSync('src/views/' + fileName + '.hbs').toString()
	if (block) file = matchBlock(block).exec(file)?.[1] as string
	if (file == null) throw Error('File not found ' + template)
	loadPartial(); // set here for hot reload
	return Handlebars.compile(file)(parameters);
}
