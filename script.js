(function () {
    'use strict';

    // Elements
    const originalEl = document.getElementById('diff-original');
    const modifiedEl = document.getElementById('diff-modified');
    const btnCompare = document.getElementById('btn-compare');
    const btnSwap = document.getElementById('btn-swap');
    const btnClear = document.getElementById('btn-clear');
    const btnCopyDiff = document.getElementById('btn-copy-diff');
    const statsEl = document.getElementById('diff-stats');
    const placeholderEl = document.getElementById('diff-placeholder');
    const outputContainer = document.getElementById('diff-output-container');
    const diffLeft = document.getElementById('diff-left');
    const diffRight = document.getElementById('diff-right');
    const removalCountEl = document.getElementById('removal-count');
    const additionCountEl = document.getElementById('addition-count');
    const leftLineCountEl = document.getElementById('left-line-count');
    const rightLineCountEl = document.getElementById('right-line-count');
    const themeToggle = document.getElementById('theme-toggle');

    let lastDiffData = null;

    // Theme
    function initTheme() {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    themeToggle.addEventListener('click', function () {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });

    initTheme();

    // Escape HTML
    function esc(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Build a diff line HTML
    function makeLine(type, lineNum, marker, content) {
        return '<div class="diff-line ' + type + '">' +
            '<span class="diff-line-num">' + (lineNum !== null ? lineNum : '') + '</span>' +
            '<span class="diff-line-marker">' + marker + '</span>' +
            '<span class="diff-line-content">' + content + '</span>' +
            '</div>';
    }

    // Word-level diff for modified lines
    function wordDiffHTML(oldLine, newLine) {
        const changes = DiffLib.diffWords(oldLine, newLine);

        let oldHTML = '';
        let newHTML = '';

        for (const change of changes) {
            const escaped = esc(change.value);
            if (!change.added && !change.removed) {
                oldHTML += escaped;
                newHTML += escaped;
            } else if (change.removed) {
                oldHTML += '<span class="diff-word-removed">' + escaped + '</span>';
            } else if (change.added) {
                newHTML += '<span class="diff-word-added">' + escaped + '</span>';
            }
        }

        return { oldHTML, newHTML };
    }

    // Compare function
    function compare() {
        const oldText = originalEl.value;
        const newText = modifiedEl.value;

        if (!oldText && !newText) {
            placeholderEl.classList.remove('hidden');
            outputContainer.classList.add('hidden');
            statsEl.textContent = '';
            lastDiffData = null;
            return;
        }

        const changes = DiffLib.diffLines(oldText, newText);

        let leftHTML = '';
        let rightHTML = '';
        let leftLineNum = 0;
        let rightLineNum = 0;
        let totalRemoved = 0;
        let totalAdded = 0;

        lastDiffData = [];

        // Process changes into paired display
        let i = 0;
        while (i < changes.length) {
            const change = changes[i];

            if (!change.added && !change.removed) {
                // Unchanged lines
                for (const line of change.lines) {
                    leftLineNum++;
                    rightLineNum++;
                    leftHTML += makeLine('diff-unchanged', leftLineNum, '', esc(line));
                    rightHTML += makeLine('diff-unchanged', rightLineNum, '', esc(line));
                    lastDiffData.push({ type: 'equal', text: line });
                }
                i++;
            } else if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
                // Paired remove + add = modification
                const removed = change.lines;
                const added = changes[i + 1].lines;
                const maxLen = Math.max(removed.length, added.length);

                for (let j = 0; j < maxLen; j++) {
                    if (j < removed.length && j < added.length) {
                        // Both exist — word-level diff
                        const wordDiff = wordDiffHTML(removed[j], added[j]);
                        leftLineNum++;
                        rightLineNum++;
                        leftHTML += makeLine('diff-removed', leftLineNum, '-', wordDiff.oldHTML);
                        rightHTML += makeLine('diff-added', rightLineNum, '+', wordDiff.newHTML);
                        lastDiffData.push({ type: 'modified', oldText: removed[j], newText: added[j] });
                    } else if (j < removed.length) {
                        leftLineNum++;
                        leftHTML += makeLine('diff-removed', leftLineNum, '-', esc(removed[j]));
                        rightHTML += makeLine('diff-empty', null, '', '');
                        lastDiffData.push({ type: 'removed', text: removed[j] });
                    } else {
                        rightLineNum++;
                        leftHTML += makeLine('diff-empty', null, '', '');
                        rightHTML += makeLine('diff-added', rightLineNum, '+', esc(added[j]));
                        lastDiffData.push({ type: 'added', text: added[j] });
                    }
                }

                totalRemoved += removed.length;
                totalAdded += added.length;
                i += 2;
            } else if (change.removed) {
                // Standalone removal
                for (const line of change.lines) {
                    leftLineNum++;
                    leftHTML += makeLine('diff-removed', leftLineNum, '-', esc(line));
                    rightHTML += makeLine('diff-empty', null, '', '');
                    lastDiffData.push({ type: 'removed', text: line });
                }
                totalRemoved += change.lines.length;
                i++;
            } else if (change.added) {
                // Standalone addition
                for (const line of change.lines) {
                    rightLineNum++;
                    leftHTML += makeLine('diff-empty', null, '', '');
                    rightHTML += makeLine('diff-added', rightLineNum, '+', esc(line));
                    lastDiffData.push({ type: 'added', text: line });
                }
                totalAdded += change.lines.length;
                i++;
            } else {
                i++;
            }
        }

        diffLeft.innerHTML = leftHTML;
        diffRight.innerHTML = rightHTML;

        placeholderEl.classList.add('hidden');
        outputContainer.classList.remove('hidden');

        removalCountEl.textContent = totalRemoved + ' removed';
        additionCountEl.textContent = totalAdded + ' added';
        leftLineCountEl.textContent = leftLineNum + ' lines';
        rightLineCountEl.textContent = rightLineNum + ' lines';

        if (totalRemoved === 0 && totalAdded === 0) {
            statsEl.textContent = 'Identical';
        } else {
            const parts = [];
            if (totalRemoved > 0) parts.push('-' + totalRemoved + ' removed');
            if (totalAdded > 0) parts.push('+' + totalAdded + ' added');
            statsEl.textContent = parts.join(', ');
        }
    }

    // Scroll sync
    let syncing = false;

    function syncScroll(source, target) {
        if (syncing) return;
        syncing = true;
        target.scrollTop = source.scrollTop;
        target.scrollLeft = source.scrollLeft;
        syncing = false;
    }

    diffLeft.addEventListener('scroll', function () { syncScroll(diffLeft, diffRight); });
    diffRight.addEventListener('scroll', function () { syncScroll(diffRight, diffLeft); });

    // Button handlers
    btnCompare.addEventListener('click', compare);

    btnSwap.addEventListener('click', function () {
        const tmp = originalEl.value;
        originalEl.value = modifiedEl.value;
        modifiedEl.value = tmp;
        if (!outputContainer.classList.contains('hidden')) {
            compare();
        }
    });

    btnClear.addEventListener('click', function () {
        originalEl.value = '';
        modifiedEl.value = '';
        diffLeft.innerHTML = '';
        diffRight.innerHTML = '';
        placeholderEl.classList.remove('hidden');
        outputContainer.classList.add('hidden');
        statsEl.textContent = '';
        lastDiffData = null;
    });

    // Copy diff
    btnCopyDiff.addEventListener('click', function () {
        if (!lastDiffData) return;
        let text = '';
        for (const entry of lastDiffData) {
            switch (entry.type) {
                case 'equal':
                    text += '  ' + entry.text + '\n';
                    break;
                case 'removed':
                    text += '- ' + entry.text + '\n';
                    break;
                case 'added':
                    text += '+ ' + entry.text + '\n';
                    break;
                case 'modified':
                    text += '- ' + entry.oldText + '\n';
                    text += '+ ' + entry.newText + '\n';
                    break;
            }
        }
        navigator.clipboard.writeText(text).then(function () {
            showToast('Diff copied to clipboard', 'green');
        }).catch(function () {
            showToast('Failed to copy', 'red');
        });
    });

    // Keyboard shortcut
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            compare();
        }
    });

    // Toast
    function showToast(message, color) {
        const toast = document.getElementById('toast');
        const inner = toast.querySelector('div');
        inner.textContent = message;
        inner.className = 'px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium';

        if (color === 'green') {
            inner.classList.add('bg-green-600');
        } else if (color === 'red') {
            inner.classList.add('bg-red-600');
        } else {
            inner.classList.add('bg-indigo-600');
        }

        toast.classList.remove('hidden');
        requestAnimationFrame(function () {
            toast.classList.add('toast-visible');
        });

        setTimeout(function () {
            toast.classList.remove('toast-visible');
            setTimeout(function () {
                toast.classList.add('hidden');
            }, 300);
        }, 2500);
    }
})();
