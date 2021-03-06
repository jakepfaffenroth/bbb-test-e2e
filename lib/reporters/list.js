"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _safe = _interopRequireDefault(require("colors/safe"));

var _ms = _interopRequireDefault(require("ms"));

var _base = require("./base");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-console */
// Allow it in the Visual Studio Code Terminal and the new Windows Terminal
const DOES_NOT_SUPPORT_UTF8_IN_TERMINAL = process.platform === 'win32' && process.env.TERM_PROGRAM !== 'vscode' && !process.env.WT_SESSION;
const POSITIVE_STATUS_MARK = DOES_NOT_SUPPORT_UTF8_IN_TERMINAL ? 'ok' : '✓';
const NEGATIVE_STATUS_MARK = DOES_NOT_SUPPORT_UTF8_IN_TERMINAL ? 'x' : '✘';

class ListReporter extends _base.BaseReporter {
  constructor(options = {}) {
    super(options);
    this._lastRow = 0;
    this._testRows = new Map();
    this._needNewLine = false;
    this._liveTerminal = void 0;
    this._liveTerminal = process.stdout.isTTY || !!process.env.PWTEST_TTY_WIDTH;
  }

  printsToStdio() {
    return true;
  }

  onBegin(config, suite) {
    super.onBegin(config, suite);
    console.log(this.generateStartingMessage());
    console.log();
  }

  onTestBegin(test, result) {
    if (this._liveTerminal) {
      if (this._needNewLine) {
        this._needNewLine = false;
        process.stdout.write('\n');
        this._lastRow++;
      }

      const line = '     ' + _safe.default.gray((0, _base.formatTestTitle)(this.config, test));

      const suffix = this._retrySuffix(result);

      process.stdout.write(this.fitToScreen(line, suffix) + suffix + '\n');
    }

    this._testRows.set(test, this._lastRow++);
  }

  onStdOut(chunk, test, result) {
    super.onStdOut(chunk, test, result);

    this._dumpToStdio(test, chunk, process.stdout);
  }

  onStdErr(chunk, test, result) {
    super.onStdErr(chunk, test, result);

    this._dumpToStdio(test, chunk, process.stderr);
  }

  onStepBegin(test, result, step) {
    if (!this._liveTerminal) return;
    if (step.category !== 'test.step') return;

    this._updateTestLine(test, '     ' + _safe.default.gray((0, _base.formatTestTitle)(this.config, test, step)), this._retrySuffix(result));
  }

  onStepEnd(test, result, step) {
    if (!this._liveTerminal) return;
    if (step.category !== 'test.step') return;

    this._updateTestLine(test, '     ' + _safe.default.gray((0, _base.formatTestTitle)(this.config, test, step.parent)), this._retrySuffix(result));
  }

  _dumpToStdio(test, chunk, stream) {
    if (this.config.quiet) return;
    const text = chunk.toString('utf-8');
    this._needNewLine = text[text.length - 1] !== '\n';

    if (this._liveTerminal) {
      const newLineCount = text.split('\n').length - 1;
      this._lastRow += newLineCount;
    }

    stream.write(chunk);
  }

  onTestEnd(test, result) {
    super.onTestEnd(test, result);

    let duration = _safe.default.dim(` (${(0, _ms.default)(result.duration)})`);

    const title = (0, _base.formatTestTitle)(this.config, test);
    let text = '';

    if (result.status === 'skipped') {
      text = _safe.default.green('  -  ') + _safe.default.cyan(title);
      duration = ''; // Do not show duration for skipped.
    } else {
      const statusMark = ('  ' + (result.status === 'passed' ? POSITIVE_STATUS_MARK : NEGATIVE_STATUS_MARK)).padEnd(5);
      if (result.status === test.expectedStatus) text = _safe.default.green(statusMark) + _safe.default.gray(title);else text = _safe.default.red(statusMark + title);
    }

    const suffix = this._retrySuffix(result) + duration;

    if (this._liveTerminal) {
      this._updateTestLine(test, text, suffix);
    } else {
      if (this._needNewLine) {
        this._needNewLine = false;
        process.stdout.write('\n');
      }

      process.stdout.write(text + suffix);
      process.stdout.write('\n');
    }
  }

  _updateTestLine(test, line, suffix) {
    if (process.env.PW_TEST_DEBUG_REPORTERS) this._updateTestLineForTest(test, line, suffix);else this._updateTestLineForTTY(test, line, suffix);
  }

  _updateTestLineForTTY(test, line, suffix) {
    const testRow = this._testRows.get(test); // Go up if needed


    if (testRow !== this._lastRow) process.stdout.write(`\u001B[${this._lastRow - testRow}A`); // Erase line, go to the start

    process.stdout.write('\u001B[2K\u001B[0G');
    process.stdout.write(this.fitToScreen(line, suffix) + suffix); // Go down if needed.

    if (testRow !== this._lastRow) process.stdout.write(`\u001B[${this._lastRow - testRow}E`);
  }

  _retrySuffix(result) {
    return result.retry ? _safe.default.yellow(` (retry #${result.retry})`) : '';
  }

  _updateTestLineForTest(test, line, suffix) {
    const testRow = this._testRows.get(test);

    process.stdout.write(testRow + ' : ' + line + suffix + '\n');
  }

  async onEnd(result) {
    await super.onEnd(result);
    process.stdout.write('\n');
    this.epilogue(true);
  }

}

var _default = ListReporter;
exports.default = _default;