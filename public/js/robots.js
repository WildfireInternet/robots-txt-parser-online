/*!
 * Browser build of robots-txt-parse 0.0.4 and robots-txt-guard 1.0.2 (parse + isAllowed only)
 * https://github.com/Woorank/robots-txt-parse
 * https://github.com/Woorank/robots-txt-guard
 *
 * The MIT License (MIT)
 * Copyright (c) 2014 WooRank
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function (root) {
    'use strict';

    // --- parse (robots-txt-parse, made synchronous instead of stream based) ---

    var START_GROUP  = 'START_GROUP',
        GROUP_MEMBER = 'GROUP_MEMBER',
        NON_GROUP    = 'NON_GROUP';

    function parseLine(line) {
        var commentFree = line.replace(/#.*$/, ''),
            index       = commentFree.indexOf(':');

        if (index === -1) return null;

        var field = commentFree.substr(0, index).trim().toLowerCase(),
            value = commentFree.substr(index + 1).trim();

        switch (field) {
            case 'user-agent':
                return {
                    type : START_GROUP,
                    agent: value
                };
            case 'allow':
            case 'disallow':
                return {
                    type: GROUP_MEMBER,
                    rule: field,
                    path: value
                };
            default:
                return {
                    type : NON_GROUP,
                    field: field,
                    value: value
                };
        }
    }

    function parse(content) {
        var result = {
            groups: [],
            extensions: []
        };

        var prevToken    = null,
            currentGroup = null;

        content.split(/\r?\n/).forEach(function (line) {
            var token = parseLine(line);
            if ( ! token) return;

            switch (token.type) {
                case START_GROUP:
                    if (prevToken !== START_GROUP) {
                        currentGroup = {
                            agents  : [],
                            rules   : []
                        };
                        result.groups.push(currentGroup);
                    }
                    currentGroup.agents.push(token.agent);
                    break;
                case GROUP_MEMBER:
                    if (currentGroup) {
                        currentGroup.rules.push({
                            rule: token.rule,
                            path: token.path
                        });
                    }
                    break;
                case NON_GROUP:
                    result.extensions.push({
                        extension: token.field,
                        value: token.value
                    });
                    break;
            }

            prevToken = token.type;
        });

        return result;
    }

    // --- patterns (robots-txt-guard/lib/patterns.js) ---

    // translates a robots.txt glob patterns to regexes
    function escapeRegExp(regexString) {
        return regexString
            .replace(/[*/\-[\]{}()+?.,\\^$|#]/g, '\\$&');
    }

    function makePathPattern(pattern) {
        const firstChar = pattern[0];
        const lastChar = pattern[pattern.length - 1];
        const matchEnd = lastChar === '$';

        if (firstChar !== '/') {
            pattern = '/' + pattern;
        }

        if (pattern.includes('*') || pattern.endsWith('$')) {
            if (pattern.endsWith('$')) {
                pattern = pattern.slice(0, -1);
            }

            // wildcards are ignored in specificity
            const specificityString = pattern.replace(/\*/g, '');

            pattern = pattern
                .split(/\*+/)
                .map(escapeRegExp)
                .join('(?:.*)');

            pattern = '^' + pattern;
            if (matchEnd) {
                pattern += '$';
            }

            const regexp = new RegExp(pattern);

            return {
                specificity: specificityString.length,
                test: path => regexp.test(path)
            };
        } else {
            return {
                specificity: pattern.length,
                test: path => path.startsWith(pattern)
            };
        }
    }

    function alwaysTrue() {
        return true;
    }

    function makeUserAgentPattern(pattern) {
        if (pattern === '*') {
            return {
                specificity: 0,
                test: alwaysTrue
            };
        }

        const specificityString = pattern;

        pattern = escapeRegExp(pattern);

        const regexp = new RegExp(pattern, 'i');

        return {
            specificity: specificityString.length,
            test: path => regexp.test(path)
        };
    }

    // --- guard (robots-txt-guard/lib/guard.js) ---

    function moreSpecificFirst(obj1, obj2) {
        return obj2.pattern.specificity - obj1.pattern.specificity;
    }

    function guard(config) {
        const groups = [];

        for (const group of config.groups) {
            // flatten agents
            const allowByPath = new Map();

            for (const { rule, path } of group.rules) {
                const normalizedRule = rule.toLowerCase();
                if (path && (normalizedRule === 'allow' || normalizedRule === 'disallow')) {
                    const repeatedPath = allowByPath.get(path);
                    const overwrite = repeatedPath && (normalizedRule === 'allow');
                    if (overwrite || !repeatedPath) {
                        allowByPath.set(path, normalizedRule);
                    }
                }
            }

            const accessibilityRules = [];
            for (const [path, rule] of allowByPath.entries()) {
                accessibilityRules.push({
                    pattern: makePathPattern(path),
                    allow: rule !== 'disallow'
                });
            }

            accessibilityRules.sort(moreSpecificFirst);

            for (const agent of group.agents) {
                groups.push({
                    pattern: makeUserAgentPattern(agent),
                    accessibilityRules
                });
            }
        }

        groups.sort(moreSpecificFirst);

        function findGroup(userAgent) {
            for (const group of groups) {
                if (group.pattern.test(userAgent)) {
                    return group;
                }
            }
            return null;
        }

        function matchRule(rules, path) {
            for (const rule of rules) {
                if (rule.pattern.test(path)) {
                    return rule.allow;
                }
            }
            // no rule matched? assume true
            return true;
        }

        function isAllowed(userAgent, path) {
            const group = findGroup(userAgent);
            if (group) {
                return matchRule(group.accessibilityRules, path);
            }
            // no group matched? assume allowed
            return true;
        }

        return {
            isAllowed: isAllowed
        };
    }

    const RobotsTxt = {
        parse: parse,
        guard: guard
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RobotsTxt;
    } else {
        root.RobotsTxt = RobotsTxt;
    }

})(this);
