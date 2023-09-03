import Handlebars from 'handlebars'
import fs from 'fs';
function loadPartial() {
  //@ts-ignore
  Handlebars.partials = {} // clear partials for DEV
  const views = fs.readdirSync('src/views')
  views.forEach(view => {
    const file = fs.readFileSync('src/views/' + view)
    Handlebars.registerPartial(view, file.toString())
    console.log('Registered ', view)
  })

}

export function render(template: string, params?: Record<string, any>) {
  const file = fs.readFileSync('src/views/' + template + '.hbs');
  loadPartial()
  return Handlebars.compile(file.toString())(params)
}