// Copy to clipboard
document.addEventListener('click', e => {
	const value = e.target.dataset.copy || e.target.parentNode?.getAttribute('data-copy');
	if (value) {
		console.log('Copied to clipboard', value);
		navigator.clipboard.writeText(value);
	}
}, false);
document
	.querySelector('[name=destination]')
	.addEventListener('input', e => e.target.value = e.target.value.replace(/^http?s:\/\//, ''));