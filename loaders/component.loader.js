'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils/js');
const requireIt = utils.requireIt;
const toCode = utils.toCode;

/* eslint-disable no-console */

/**
 * Return JS code as a string for a component with all required for style guide information.
 *
 * @param {string} filepath
 * @param {object} config
 * @returns {string}
 */
function processComponent(filepath, config) {
	const nameFallback = getNameFallback(filepath);
	const examplesFile = config.getExampleFilename(filepath);
	const componentPath = path.relative(config.configDir, filepath);

	return toCode({
		filepath: JSON.stringify(filepath),
		nameFallback: JSON.stringify(nameFallback),
		pathLine: JSON.stringify(config.getComponentPathLine(componentPath)),
		module: requireIt(filepath),
		props: requireIt('!!props!' + filepath),
		examples: getExamples(examplesFile, nameFallback, config.defaultExample),
	});
}

/**
 * If component name can’t be detected at runtime, use filename (or folder name if file name is 'index')
 *
 * @param {string} filepath
 * @returns {string}
 */
function getNameFallback(filepath) {
	const filename = path.parse(filepath).name;
	return filename === 'index' ? path.basename(path.dirname(filepath)) : filename;
}

/**
 * Get require statement for examples file if it exists, or for default examples if it was defined.
 *
 * @param {string} examplesFile
 * @param {string} nameFallback
 * @param {string} defaultExample
 * @returns {string}
 */
function getExamples(examplesFile, nameFallback, defaultExample) {
	if (fs.existsSync(examplesFile)) {
		return requireIt('examples!' + examplesFile);
	}

	if (defaultExample) {
		return requireIt('examples?componentName=' + nameFallback + '!' + defaultExample);
	}

	return null;
}

module.exports = function() {
	if (this.cacheable) {
		this.cacheable();
	}

	const file = this.request.split('!').pop();
	const config = this.options.styleguidist;

	const code = processComponent(file, config);
	return `module.exports = ${code};`;
};
