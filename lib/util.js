"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addSuffixToFilePath = addSuffixToFilePath;
exports.callLogText = callLogText;
exports.captureStackTrace = captureStackTrace;
exports.createFileMatcher = createFileMatcher;
exports.createTitleMatcher = createTitleMatcher;
exports.currentExpectTimeout = currentExpectTimeout;
exports.debugTest = void 0;
exports.errorWithFile = errorWithFile;
exports.errorWithLocation = errorWithLocation;
exports.expectTypes = expectTypes;
exports.forceRegExp = forceRegExp;
exports.formatLocation = formatLocation;
exports.getContainedPath = getContainedPath;
exports.getPackageJsonPath = getPackageJsonPath;
exports.mergeObjects = mergeObjects;
exports.monotonicTime = monotonicTime;
exports.relativeFilePath = relativeFilePath;
exports.sanitizeForFilePath = sanitizeForFilePath;
exports.serializeError = serializeError;
exports.trimLongString = trimLongString;

var _util = _interopRequireDefault(require("util"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _url = _interopRequireDefault(require("url"));

var _safe = _interopRequireDefault(require("colors/safe"));

var _minimatch = _interopRequireDefault(require("minimatch"));

var _debug = _interopRequireDefault(require("debug"));

var _utils = require("playwright-core/lib/utils");

var _stackTrace = require("playwright-core/lib/utils/stackTrace");

var _globals = require("./globals");

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
const PLAYWRIGHT_CORE_PATH = _path.default.dirname(require.resolve('playwright-core'));

const EXPECT_PATH = _path.default.dirname(require.resolve('expect'));

const PLAYWRIGHT_TEST_PATH = _path.default.join(__dirname, '..');

function filterStackTrace(e) {
  // This method filters internal stack frames using Error.prepareStackTrace
  // hook. Read more about the hook: https://v8.dev/docs/stack-trace-api
  //
  // NOTE: Error.prepareStackTrace will only be called if `e.stack` has not
  // been accessed before. This is the case for Jest Expect and simple throw
  // statements.
  //
  // If `e.stack` has been accessed, this method will be NOOP.
  const oldPrepare = Error.prepareStackTrace;

  const stackFormatter = oldPrepare || ((error, structuredStackTrace) => [`${error.name}: ${error.message}`, ...structuredStackTrace.map(callSite => '    at ' + callSite.toString())].join('\n'));

  Error.prepareStackTrace = (error, structuredStackTrace) => {
    return stackFormatter(error, structuredStackTrace.filter(callSite => {
      const fileName = callSite.getFileName();
      const functionName = callSite.getFunctionName() || undefined;
      if (!fileName) return true;
      return !fileName.startsWith(PLAYWRIGHT_TEST_PATH) && !fileName.startsWith(PLAYWRIGHT_CORE_PATH) && !fileName.startsWith(EXPECT_PATH) && !(0, _stackTrace.isInternalFileName)(fileName, functionName);
    }));
  }; // eslint-disable-next-line


  e.stack; // trigger Error.prepareStackTrace

  Error.prepareStackTrace = oldPrepare;
}

function captureStackTrace(customApiName) {
  const stackTrace = (0, _stackTrace.captureStackTrace)();
  const frames = [];
  const frameTexts = [];

  for (let i = 0; i < stackTrace.frames.length; ++i) {
    const frame = stackTrace.frames[i];
    if (frame.file.startsWith(EXPECT_PATH)) continue;
    frames.push(frame);
    frameTexts.push(stackTrace.frameTexts[i]);
  }

  return {
    allFrames: stackTrace.allFrames,
    frames,
    frameTexts,
    apiName: customApiName !== null && customApiName !== void 0 ? customApiName : stackTrace.apiName
  };
}

function serializeError(error) {
  if (error instanceof Error) {
    filterStackTrace(error);
    return {
      message: error.message,
      stack: error.stack
    };
  }

  return {
    value: _util.default.inspect(error)
  };
}

function monotonicTime() {
  const [seconds, nanoseconds] = process.hrtime();
  return seconds * 1000 + (nanoseconds / 1000000 | 0);
}

function createFileMatcher(patterns) {
  const reList = [];
  const filePatterns = [];

  for (const pattern of Array.isArray(patterns) ? patterns : [patterns]) {
    if ((0, _utils.isRegExp)(pattern)) {
      reList.push(pattern);
    } else {
      if (!pattern.startsWith('**/') && !pattern.startsWith('**/')) filePatterns.push('**/' + pattern);else filePatterns.push(pattern);
    }
  }

  return filePath => {
    for (const re of reList) {
      re.lastIndex = 0;
      if (re.test(filePath)) return true;
    } // Windows might still receive unix style paths from Cygwin or Git Bash.
    // Check against the file url as well.


    if (_path.default.sep === '\\') {
      const fileURL = _url.default.pathToFileURL(filePath).href;

      for (const re of reList) {
        re.lastIndex = 0;
        if (re.test(fileURL)) return true;
      }
    }

    for (const pattern of filePatterns) {
      if ((0, _minimatch.default)(filePath, pattern, {
        nocase: true,
        dot: true
      })) return true;
    }

    return false;
  };
}

function createTitleMatcher(patterns) {
  const reList = Array.isArray(patterns) ? patterns : [patterns];
  return value => {
    for (const re of reList) {
      re.lastIndex = 0;
      if (re.test(value)) return true;
    }

    return false;
  };
}

function mergeObjects(a, b) {
  const result = { ...a
  };

  if (!Object.is(b, undefined)) {
    for (const [name, value] of Object.entries(b)) {
      if (!Object.is(value, undefined)) result[name] = value;
    }
  }

  return result;
}

function forceRegExp(pattern) {
  const match = pattern.match(/^\/(.*)\/([gi]*)$/);
  if (match) return new RegExp(match[1], match[2]);
  return new RegExp(pattern, 'g');
}

function relativeFilePath(file) {
  if (!_path.default.isAbsolute(file)) return file;
  return _path.default.relative(process.cwd(), file);
}

function formatLocation(location) {
  return relativeFilePath(location.file) + ':' + location.line + ':' + location.column;
}

function errorWithFile(file, message) {
  return new Error(`${relativeFilePath(file)}: ${message}`);
}

function errorWithLocation(location, message) {
  return new Error(`${formatLocation(location)}: ${message}`);
}

function expectTypes(receiver, types, matcherName) {
  if (typeof receiver !== 'object' || !types.includes(receiver.constructor.name)) {
    const commaSeparated = types.slice();
    const lastType = commaSeparated.pop();
    const typesString = commaSeparated.length ? commaSeparated.join(', ') + ' or ' + lastType : lastType;
    throw new Error(`${matcherName} can be only used with ${typesString} object${types.length > 1 ? 's' : ''}`);
  }
}

function sanitizeForFilePath(s) {
  return s.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, '-');
}

function trimLongString(s, length = 100) {
  if (s.length <= length) return s;
  const hash = (0, _utils.calculateSha1)(s);
  const middle = `-${hash.substring(0, 5)}-`;
  const start = Math.floor((length - middle.length) / 2);
  const end = length - middle.length - start;
  return s.substring(0, start) + middle + s.slice(-end);
}

function addSuffixToFilePath(filePath, suffix, customExtension, sanitize = false) {
  const dirname = _path.default.dirname(filePath);

  const ext = _path.default.extname(filePath);

  const name = _path.default.basename(filePath, ext);

  const base = _path.default.join(dirname, name);

  return (sanitize ? sanitizeForFilePath(base) : base) + suffix + (customExtension || ext);
}
/**
 * Returns absolute path contained within parent directory.
 */


function getContainedPath(parentPath, subPath = '') {
  const resolvedPath = _path.default.resolve(parentPath, subPath);

  if (resolvedPath === parentPath || resolvedPath.startsWith(parentPath + _path.default.sep)) return resolvedPath;
  return null;
}

const debugTest = (0, _debug.default)('pw:test');
exports.debugTest = debugTest;

function callLogText(log) {
  if (!log) return '';
  return `
Call log:
  ${_safe.default.dim('- ' + (log || []).join('\n  - '))}
`;
}

function currentExpectTimeout(options) {
  var _testInfo$project$exp;

  const testInfo = (0, _globals.currentTestInfo)();
  if (options.timeout !== undefined) return options.timeout;
  let defaultExpectTimeout = testInfo === null || testInfo === void 0 ? void 0 : (_testInfo$project$exp = testInfo.project.expect) === null || _testInfo$project$exp === void 0 ? void 0 : _testInfo$project$exp.timeout;
  if (typeof defaultExpectTimeout === 'undefined') defaultExpectTimeout = 5000;
  return defaultExpectTimeout;
}

const folderToPackageJsonPath = new Map();

function getPackageJsonPath(folderPath) {
  const cached = folderToPackageJsonPath.get(folderPath);
  if (cached !== undefined) return cached;

  const packageJsonPath = _path.default.join(folderPath, 'package.json');

  if (_fs.default.existsSync(packageJsonPath)) {
    folderToPackageJsonPath.set(folderPath, packageJsonPath);
    return packageJsonPath;
  }

  const parentFolder = _path.default.dirname(folderPath);

  if (folderPath === parentFolder) {
    folderToPackageJsonPath.set(folderPath, '');
    return '';
  }

  const result = getPackageJsonPath(parentFolder);
  folderToPackageJsonPath.set(folderPath, result);
  return result;
}