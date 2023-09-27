import fs from 'node:fs';
import Handlebars from 'handlebars';
import { projectRoot } from './helpers.js';

function loadPartial() {
	// @ts-expect-error
	Handlebars.partials = {}; // Clear partials for DEV
	const views = fs.readdirSync(projectRoot() + '/views');
	for (const view of views) {
		const file = fs.readFileSync(projectRoot() + '/views/' + view);
		Handlebars.registerPartial(view, file.toString());
	}
	Handlebars.registerHelper('block', function (context, options) {
		// @ts-expect-error
		return options.fn(this);
	});
}

loadPartial();

const matchBlock = (name: string) => new RegExp(`{{#block ${name}}}\n*([\\s\\S]*?)\s*{{\/block}}`, 'g')
export function render(template: string, parameters?: Record<string, any>) {
	const [fileName, block] = template.split('?');
	let file = fs.readFileSync(projectRoot() + '/views/' + fileName + '.hbs').toString()

	if (block) file = matchBlock(block).exec(file)?.[1] as string
	if (file == null) throw Error('File not found ' + template)
	return Handlebars.compile(file)(parameters);
}
