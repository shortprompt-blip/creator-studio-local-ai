(function () {

    'use strict';

    const MODEL =
        'Llama-3.2-3B-Instruct-q4f16_1-MLC';

    let engine = null;
    let loading = false;

    function $(id) {
        return document.getElementById(id);
    }

    function setStatus(text) {
        const el = $('spcs-model-status');
        if (el) {
            el.textContent = text;
        }
    }

    function showError(message) {

        const error = $('spcs-error');

        if (!error) return;

        error.textContent = message;

        error.style.display = 'block';

    }

    function hideError() {

        const error = $('spcs-error');

        if (error) {

            error.style.display = 'none';

            error.textContent = '';

        }

    }

    function setProgress(percent, text) {

        const wrapper = $('spcs-progress-wrapper');
        const bar = $('spcs-progress-bar');
        const label = $('spcs-progress-text');
        const percentage = $('spcs-progress-percent');

        if (wrapper) {
            wrapper.style.display = 'block';
        }

        if (bar) {
            bar.style.width =
                Math.max(0, Math.min(100, percent)) + '%';
        }

        if (label) {
            label.textContent = text || 'Loading AI...';
        }

        if (percentage) {
            percentage.textContent =
                Math.round(percent) + '%';
        }
    }


    async function loadWebLLM() {

        if (engine) {

            setStatus('Local AI ready');

            $('spcs-generate').disabled = false;

            return;

        }

        if (loading) return;

        hideError();

        if (!('gpu' in navigator)) {

            showError(
                'WebGPU is not available in this browser. ' +
                'Try a recent version of Chrome or Edge.'
            );

            setStatus('WebGPU unavailable');

            return;

        }

        loading = true;

        const loadButton = $('spcs-load-model');

        loadButton.disabled = true;

        loadButton.textContent =
            'Loading Local AI...';

        setStatus(
            'Downloading model for first use...'
        );

        setProgress(
            1,
            'Preparing local AI model...'
        );

        try {

            if (!window.spWebLLM) {

                const module = await import(
                    'https://esm.run/@mlc-ai/web-llm'
                );

                window.spWebLLM = module;

            }

            const webllm = window.spWebLLM;

            engine =
                await webllm.CreateMLCEngine(
                    MODEL,
                    {
                        initProgressCallback: function (progress) {

                            let percent = 0;

                            if (
                                progress &&
                                typeof progress.progress === 'number'
                            ) {

                                percent =
                                    progress.progress * 100;

                            }

                            const text =
                                progress &&
                                progress.text
                                    ? progress.text
                                    : 'Loading local AI model...';

                            setProgress(
                                percent,
                                text
                            );

                        }
                    }
                );

            setProgress(
                100,
                'Local AI ready'
            );

            setStatus(
                'Local AI ready — processing on your device'
            );

            loadButton.textContent =
                '✓ AI Ready';

            loadButton.disabled = true;

            $('spcs-generate').disabled = false;

        } catch (error) {

            console.error(
                'ShortPrompt Creator Studio:',
                error
            );

            engine = null;

            setStatus(
                'Model loading failed'
            );

            loadButton.disabled = false;

            loadButton.textContent =
                'Retry Local AI';

            showError(
                'The local AI model could not be loaded. ' +
                'Check that WebGPU is enabled and try again.'
            );

        } finally {

            loading = false;

        }

    }


    function buildPrompt() {

        const platform =
            $('spcs-platform').value;

        const contentType =
            $('spcs-content-type').value;

        const goal =
            $('spcs-goal').value;

        const tone =
            $('spcs-tone').value;

        const topic =
            $('spcs-topic').value.trim();

        const style =
            $('spcs-style').value.trim();


        return `
You are a professional social media content strategist.

Create content for a creator.

PLATFORM:
${platform}

CONTENT TYPE:
${contentType}

GOAL:
${goal}

TONE:
${tone}

CONTENT / TOPIC:
${topic}

CREATOR STYLE:
${style || 'No additional style instructions.'}

Return ONLY valid JSON.

Use exactly this structure:

{
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "hashtags": "string"
}

Requirements:

- Write naturally.
- Do not mention that you are an AI.
- Do not invent specific facts about the product or creator.
- Avoid generic corporate language.
- The hook must be attention-grabbing but not misleading.
- The caption must be appropriate for ${platform}.
- The CTA must encourage a realistic action.
- Hashtags should be relevant and not excessively generic.
- Use the selected tone.
- Keep the content concise enough for social media.
`;
    }


    function cleanJSON(text) {

        text = text.trim();

        text = text
            .replace(/^```json/i, '')
            .replace(/^```/i, '')
            .replace(/```$/i, '')
            .trim();

        const first =
            text.indexOf('{');

        const last =
            text.lastIndexOf('}');

        if (
            first !== -1 &&
            last !== -1 &&
            last > first
        ) {

            text =
                text.substring(
                    first,
                    last + 1
                );

        }

        return text;

    }


    async function generateContent() {

        hideError();

        if (!engine) {

            showError(
                'Load the Local AI model first.'
            );

            return;

        }

        const topic =
            $('spcs-topic').value.trim();

        if (!topic) {

            showError(
                'Describe the content you want to publish first.'
            );

            $('spcs-topic').focus();

            return;

        }


        const button =
            $('spcs-generate');

        button.disabled = true;

        button.textContent =
            '⏳ Generating locally...';


        try {

            const prompt =
                buildPrompt();


            const response =
                await engine.chat.completions.create({

                    messages: [

                        {
                            role: 'system',

                            content:
                                'You are a precise social media copywriter. Return JSON only.'
                        },

                        {
                            role: 'user',

                            content: prompt
                        }

                    ],

                    temperature: 0.7,

                    max_tokens: 900

                });


            const raw =
                response &&
                response.choices &&
                response.choices[0] &&
                response.choices[0].message
                    ? response.choices[0].message.content
                    : '';


            if (!raw) {

                throw new Error(
                    'The model returned an empty response.'
                );

            }


            const jsonText =
                cleanJSON(raw);


            let result;

            try {

                result =
                    JSON.parse(jsonText);

            } catch (jsonError) {

                console.error(
                    'Invalid JSON:',
                    raw
                );

                throw new Error(
                    'The local model returned an invalid format. Try generating again.'
                );

            }


            $('spcs-hook').textContent =
                result.hook || '';

            $('spcs-caption').textContent =
                result.caption || '';

            $('spcs-cta').textContent =
                result.cta || '';

            $('spcs-hashtags').textContent =
                result.hashtags || '';


        } catch (error) {

            console.error(
                'Creator Studio generation error:',
                error
            );

            showError(
                error.message ||
                'Generation failed. Please try again.'
            );

        } finally {

            button.disabled = false;

            button.textContent =
                '✨ Generate Content';

        }

    }


    function copyText(text) {

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            return navigator.clipboard.writeText(text);

        }


        const textarea =
            document.createElement('textarea');

        textarea.value = text;

        textarea.style.position =
            'fixed';

        textarea.style.opacity =
            '0';

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            'copy'
        );

        textarea.remove();

        return Promise.resolve();

    }


    function copyElement(id, button) {

        const element =
            $(id);

        if (!element) return;

        const text =
            element.textContent.trim();

        if (!text) return;

        copyText(text).then(function () {

            const old =
                button.textContent;

            button.textContent =
                '✓ Copied';

            setTimeout(function () {

                button.textContent =
                    old;

            }, 1500);

        });

    }


    function copyAll() {

        const hook =
            $('spcs-hook').textContent.trim();

        const caption =
            $('spcs-caption').textContent.trim();

        const cta =
            $('spcs-cta').textContent.trim();

        const hashtags =
            $('spcs-hashtags').textContent.trim();


        const output =
`HOOK

${hook}

CAPTION

${caption}

CTA

${cta}

HASHTAGS

${hashtags}`;


        copyText(output);

    }


    function init() {

        if (!$('sp-creator-studio')) {
            return;
        }


        $('spcs-load-model')
            .addEventListener(
                'click',
                loadWebLLM
            );


        $('spcs-generate')
            .addEventListener(
                'click',
                generateContent
            );


        $('spcs-copy-all')
            .addEventListener(
                'click',
                copyAll
            );


        document
            .querySelectorAll(
                '#sp-creator-studio .spcs-copy'
            )
            .forEach(function (button) {

                button.addEventListener(
                    'click',
                    function () {

                        copyElement(
                            button.dataset.target,
                            button
                        );

                    }
                );

            });

    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();

    }

})();
