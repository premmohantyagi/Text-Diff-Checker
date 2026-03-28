/**
 * Minimal diff library implementing Myers' diff algorithm
 * Provides diffLines() and diffWords() functions
 */
(function (global) {
    'use strict';

    function diffSequences(oldTokens, newTokens, equals) {
        const oldLen = oldTokens.length;
        const newLen = newTokens.length;
        const maxD = oldLen + newLen;
        const vOffset = maxD;
        const vSize = 2 * maxD + 1;
        const v = new Array(vSize);
        v[vOffset + 1] = 0;

        const trace = [];

        for (let d = 0; d <= maxD; d++) {
            const vSnapshot = v.slice();
            trace.push(vSnapshot);

            for (let k = -d; k <= d; k += 2) {
                let x;
                if (k === -d || (k !== d && v[vOffset + k - 1] < v[vOffset + k + 1])) {
                    x = v[vOffset + k + 1];
                } else {
                    x = v[vOffset + k - 1] + 1;
                }
                let y = x - k;

                while (x < oldLen && y < newLen && equals(oldTokens[x], newTokens[y])) {
                    x++;
                    y++;
                }

                v[vOffset + k] = x;

                if (x >= oldLen && y >= newLen) {
                    return buildResult(trace, oldTokens, newTokens, vOffset);
                }
            }
        }
        return buildResult(trace, oldTokens, newTokens, vOffset);
    }

    function buildResult(trace, oldTokens, newTokens, vOffset) {
        const oldLen = oldTokens.length;
        const newLen = newTokens.length;

        let x = oldLen;
        let y = newLen;
        const edits = [];

        for (let d = trace.length - 1; d >= 0; d--) {
            const v = trace[d];
            const k = x - y;

            let prevK;
            if (k === -d || (k !== d && v[vOffset + k - 1] < v[vOffset + k + 1])) {
                prevK = k + 1;
            } else {
                prevK = k - 1;
            }

            const prevX = v[vOffset + prevK];
            const prevY = prevX - prevK;

            // Diagonal (equal)
            while (x > prevX && y > prevY) {
                x--;
                y--;
                edits.unshift({ type: 'equal', oldIndex: x, newIndex: y });
            }

            if (d > 0) {
                if (x === prevX) {
                    // Insert
                    y--;
                    edits.unshift({ type: 'insert', newIndex: y });
                } else {
                    // Delete
                    x--;
                    edits.unshift({ type: 'delete', oldIndex: x });
                }
            }
        }

        // Convert edits to change objects
        const changes = [];
        let i = 0;
        while (i < edits.length) {
            const edit = edits[i];
            if (edit.type === 'equal') {
                let value = '';
                while (i < edits.length && edits[i].type === 'equal') {
                    value += oldTokens[edits[i].oldIndex];
                    i++;
                }
                changes.push({ value, added: false, removed: false });
            } else if (edit.type === 'delete') {
                let value = '';
                while (i < edits.length && edits[i].type === 'delete') {
                    value += oldTokens[edits[i].oldIndex];
                    i++;
                }
                changes.push({ value, added: false, removed: true });
            } else if (edit.type === 'insert') {
                let value = '';
                while (i < edits.length && edits[i].type === 'insert') {
                    value += newTokens[edits[i].newIndex];
                    i++;
                }
                changes.push({ value, added: true, removed: false });
            } else {
                i++;
            }
        }

        return changes;
    }

    function diffLines(oldStr, newStr) {
        const oldLines = oldStr.split('\n');
        const newLines = newStr.split('\n');

        const equals = (a, b) => a === b;
        const rawChanges = diffSequences(oldLines, newLines, equals);

        // Convert back: each change's value should include newline info
        const changes = rawChanges.map(change => {
            const lines = change.value.split('\n').filter((_, idx, arr) => {
                // The value was joined from array elements, re-split
                return true;
            });
            return {
                value: change.value,
                added: change.added,
                removed: change.removed,
                count: change.value.split('\n').length
            };
        });

        return changes;
    }

    function tokenizeWords(str) {
        const tokens = [];
        const regex = /(\s+|[^\s]+)/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
            tokens.push(match[0]);
        }
        return tokens;
    }

    function diffWords(oldStr, newStr) {
        const oldTokens = tokenizeWords(oldStr);
        const newTokens = tokenizeWords(newStr);

        const equals = (a, b) => a === b;
        return diffSequences(oldTokens, newTokens, equals);
    }

    global.DiffLib = {
        diffLines: function (oldStr, newStr) {
            const oldLines = oldStr.split('\n');
            const newLines = newStr.split('\n');
            const equals = (a, b) => a === b;
            const rawChanges = diffSequences(oldLines, newLines, equals);

            // Re-structure: each change holds an array of lines
            const result = [];
            for (const change of rawChanges) {
                const lines = change.value.split('\n');
                result.push({
                    lines: lines,
                    count: lines.length,
                    added: change.added,
                    removed: change.removed
                });
            }
            return result;
        },
        diffWords: diffWords
    };

})(window);
