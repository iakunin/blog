/*
This file has been taken from following blogpost:
https://koki-nakamura22.github.io/blog/2019/10/03/hugo-adding-copy-button/

Many thanks to Koki Nakamura (the author of this blogpost)!
*/

document.addEventListener('DOMContentLoaded', function(){
    'use strict';

    if (!document.queryCommandSupported('copy')) {
        return;
    }

    function flashCopyMessage(el, msg) {
        el.textContent = msg;
        setTimeout(() => {
            el.textContent = "Copy";
        }, 1000);
    }

    function selectText(node) {
        let selection = window.getSelection();
        let range = document.createRange();
        if (node.childElementCount === 2) {
            // Skip the title.
            range.selectNodeContents(node.children[1]);
        } else {
            range.selectNodeContents(node);
        }
        selection.removeAllRanges();
        selection.addRange(range);
        return selection;
    }

    function addCopyButton(containerEl) {
        let copyBtn = document.createElement("button");
        copyBtn.className = "highlight-copy-btn";
        copyBtn.textContent = "Copy";

        let codeEl = containerEl.firstElementChild;
        copyBtn.addEventListener('click', () => {
            try {
                let selection = selectText(codeEl);
                document.execCommand('copy');
                selection.removeAllRanges();

                flashCopyMessage(copyBtn, 'Copied!')
            } catch (e) {
                console && console.log(e);
                flashCopyMessage(copyBtn, 'Failed :\'(')
            }
        });

        containerEl.appendChild(copyBtn);
    }

    // Add copy button to code blocks
    let highlightBlocks = document.getElementsByClassName('highlight');
    Array.prototype.forEach.call(highlightBlocks, addCopyButton);
}, false);
