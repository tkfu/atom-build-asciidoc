'use babel';

import { EventEmitter } from 'events';

// Package settings
import meta from '../package.json';

export const config = {
  asciidoctorArguments: {
    title: 'Asciidoctor Arguments',
    description: 'Specify your preferred arguments for asciidoctor, supports [replacement](https://github.com/noseglid/atom-build#replacement) placeholders',
    type: 'string',
    default: '{FILE_ACTIVE}',
    order: 0
  },
  asciidoctorCommand: {
    title: 'Asciidoc Renderer',
    description: 'Override the default renderer (asciidoctor). For example, to use the original asciidoc renderer or use a docker image. Supports [replacement](https://github.com/noseglid/atom-build#replacement) placeholders.',
    type: 'string',
    default: 'asciidoctor',
    order: 1
  },
  manageDependencies: {
    title: 'Manage Dependencies',
    description: 'When enabled, third-party dependencies will be installed automatically',
    type: 'boolean',
    default: true,
    order: 2
  },
  alwaysEligible: {
    title: 'Always Eligible',
    description: 'The build provider will be available in your project, even when not eligible',
    type: 'boolean',
    default: false,
    order: 3
  }
};

// This package depends on build, make sure it's installed
export function activate() {
  if (atom.config.get(meta.name + '.manageDependencies') === true) {
    this.satisfyDependencies();
  }
}

export function satisfyDependencies() {
  let k;
  let v;

  require('atom-package-deps').install(meta.name);

  const ref = meta['package-deps'];
  const results = [];

  for (k in ref) {
    if (typeof ref !== 'undefined' && ref !== null) {
      v = ref[k];
      if (atom.packages.isPackageDisabled(v)) {
        if (atom.inDevMode()) {
          console.log('Enabling package \'' + v + '\'');
        }
        results.push(atom.packages.enablePackage(v));
      } else {
        results.push(void 0);
      }
    }
  }
  return results;
}

export function provideBuilder() {
  return class AsciidocProvider extends EventEmitter {
    constructor(cwd) {
      super();
      this.cwd = cwd;
      atom.config.observe('build-asciidoc.asciidoctorArguments', () => this.emit('refresh'));
      atom.config.observe('build-asciidoc.asciidoctorCommand', () => this.emit('refresh'));
    }

    getNiceName() {
      return 'Asciidoc';
    }

    isEligible() {
      var textEditor = atom.workspace.getActiveTextEditor();
      if (!textEditor || !textEditor.getPath()) {
        return false;
      }
      var path = textEditor.getPath();
      return path.endsWith('.ad') || path.endsWith('.adoc') || path.endsWith('.asc');
    }

    settings() {
      // const errorMatch = [
      //   '(?<message>Error: .*)\\n\\s+on line (?<line>\\d+) of (?<file>.*)\\n'
      // ];

      // User settings
      const customAsciidoctorArguments = atom.config.get(meta.name + '.customAsciidoctorArguments').trim().split(' ');
      const customAsciidocCommand = atom.config.get(meta.name + '.customAsciidocCommand').trim().split(' ');

      return [
        {
          name: 'Asciidoctor',
          exec: customAsciidoctorCommand,
          args: asciidoctorArguments,
          cwd: '{FILE_ACTIVE_PATH}',
          sh: false,
          atomCommandName: 'Asciidoc:render',
          errorMatch: errorMatch
        }
      ];
    }
  };
}
