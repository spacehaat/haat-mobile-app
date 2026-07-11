const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Standalone repo: shared code lives in ./packages (not parent monorepo).
config.watchFolders = [path.resolve(projectRoot, 'packages')];

module.exports = config;
